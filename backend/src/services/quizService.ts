import mongoose from 'mongoose';
import { UserState, IUserState } from '../models/UserState';
import { Question, IQuestion } from '../models/Question';
import { AnswerLog } from '../models/AnswerLog';
import { User } from '../models/User';
import { calculateNewDifficulty, shouldDecayStreak, updateRecentAnswers } from './adaptiveEngine';
import { calculateScore } from './scoreService';
import { updateScoreLeaderboard, updateStreakLeaderboard, getUserRankScore, getUserRankStreak } from './leaderboardService';
import { getCachedQuestionPool, getCachedUserState, setCachedUserState, invalidateUserStateCache } from './cacheService';

export interface NextQuestionResponse {
    questionId: string;
    difficulty: number;
    prompt: string;
    choices: string[];
    sessionId: string;
    stateVersion: number;
    currentScore: number;
    currentStreak: number;
    maxStreak: number;
    currentDifficulty: number;
    momentum: number;
}

export interface AnswerResponse {
    correct: boolean;
    correctAnswer: string;
    newDifficulty: number;
    newStreak: number;
    maxStreak: number;
    scoreDelta: number;
    totalScore: number;
    stateVersion: number;
    leaderboardRankScore: number;
    leaderboardRankStreak: number;
    streakMultiplier: number;
    difficultyWeight: number;
    momentum: number;
}

export interface MetricsResponse {
    currentDifficulty: number;
    streak: number;
    maxStreak: number;
    totalScore: number;
    accuracy: number;
    totalAnswered: number;
    totalCorrect: number;
    recentPerformance: number;
    momentum: number;
    difficultyHistogram: Record<number, number>;
}

/**
 * Get or create user state
 */
async function getOrCreateUserState(userId: string): Promise<IUserState> {
    // Try cache first
    const cached = await getCachedUserState(userId);
    if (cached) {
        return cached as IUserState;
    }

    let state: any = await UserState.findOne({ userId }).lean();
    if (!state) {
        const newState = new UserState({ userId });
        state = (await newState.save()).toObject();
    }

    await setCachedUserState(userId, state);
    return state as unknown as IUserState;
}

/**
 * Get next question for a user
 */
export async function getNextQuestion(userId: string): Promise<NextQuestionResponse> {
    const state = await getOrCreateUserState(userId);

    // Check streak decay
    if (shouldDecayStreak(state.lastAnswerAt)) {
        await UserState.updateOne(
            { userId },
            { $set: { streak: 0, momentum: 0 } }
        );
        state.streak = 0;
        state.momentum = 0;
        await invalidateUserStateCache(userId);
    }

    // Get question pool for current difficulty
    let questions = await getCachedQuestionPool(state.currentDifficulty);

    // If no questions at this difficulty, try adjacent difficulties
    if (questions.length === 0) {
        for (let offset = 1; offset <= 3; offset++) {
            questions = await getCachedQuestionPool(state.currentDifficulty + offset);
            if (questions.length > 0) break;
            questions = await getCachedQuestionPool(state.currentDifficulty - offset);
            if (questions.length > 0) break;
        }
    }

    if (questions.length === 0) {
        throw new Error('No questions available');
    }

    // Avoid repeating the last question
    let availableQuestions = questions.filter(
        (q) => q._id.toString() !== (state.lastQuestionId ? state.lastQuestionId.toString() : null)
    );
    if (availableQuestions.length === 0) {
        availableQuestions = questions;
    }

    // Pick a random question
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const question = availableQuestions[randomIndex];

    return {
        questionId: question._id.toString(),
        difficulty: question.difficulty,
        prompt: question.prompt,
        choices: question.choices,
        sessionId: userId,
        stateVersion: state.stateVersion,
        currentScore: state.totalScore,
        currentStreak: state.streak,
        maxStreak: state.maxStreak,
        currentDifficulty: state.currentDifficulty,
        momentum: state.momentum,
    };
}

/**
 * Submit an answer - idempotent via answerIdempotencyKey
 */
export async function submitAnswer(
    userId: string,
    questionId: string,
    answer: string,
    stateVersion: number,
    answerIdempotencyKey: string
): Promise<AnswerResponse> {
    // Idempotency check
    const existingAnswer = await AnswerLog.findOne({ idempotencyKey: answerIdempotencyKey }).lean();
    if (existingAnswer) {
        // Return the previous result
        const state = await getOrCreateUserState(userId);
        const rankScore = await getUserRankScore(userId);
        const rankStreak = await getUserRankStreak(userId);

        const question = await Question.findById(questionId).lean();
        return {
            correct: existingAnswer.correct,
            correctAnswer: question?.correctAnswer || '',
            newDifficulty: state.currentDifficulty,
            newStreak: state.streak,
            maxStreak: state.maxStreak,
            scoreDelta: existingAnswer.scoreDelta,
            totalScore: state.totalScore,
            stateVersion: state.stateVersion,
            leaderboardRankScore: rankScore,
            leaderboardRankStreak: rankStreak,
            streakMultiplier: 1,
            difficultyWeight: 1,
            momentum: state.momentum,
        };
    }

    // Get question
    const question = await Question.findById(questionId);
    if (!question) {
        throw new Error('Question not found');
    }

    // Get current state
    const state = await UserState.findOne({ userId });
    if (!state) {
        throw new Error('User state not found');
    }

    // Check streak decay before processing
    if (shouldDecayStreak(state.lastAnswerAt)) {
        state.streak = 0;
        state.momentum = 0;
    }

    // Check answer
    const isCorrect = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

    // Calculate score
    const { scoreDelta, streakMultiplier, difficultyWeight } = calculateScore(
        isCorrect,
        state.currentDifficulty,
        state.streak
    );

    // Update streak
    let newStreak = isCorrect ? state.streak + 1 : 0;

    // Update adaptive difficulty
    const { newDifficulty, newMomentum } = calculateNewDifficulty(
        state.currentDifficulty,
        isCorrect,
        state.momentum,
        newStreak
    );

    // Update recent answers
    const newRecentAnswers = updateRecentAnswers(
        state.recentAnswers || [],
        isCorrect
    );

    // Calculate new totals
    const newTotalScore = state.totalScore + scoreDelta;
    const newMaxStreak = Math.max(state.maxStreak, newStreak);
    const newTotalAnswered = state.totalAnswered + 1;
    const newTotalCorrect = state.totalCorrect + (isCorrect ? 1 : 0);
    const newStateVersion = state.stateVersion + 1;

    // Atomic update
    await UserState.updateOne(
        { userId, stateVersion: state.stateVersion },
        {
            $set: {
                currentDifficulty: newDifficulty,
                streak: newStreak,
                maxStreak: newMaxStreak,
                totalScore: newTotalScore,
                totalAnswered: newTotalAnswered,
                totalCorrect: newTotalCorrect,
                lastQuestionId: questionId,
                lastAnswerAt: new Date(),
                stateVersion: newStateVersion,
                momentum: newMomentum,
                recentAnswers: newRecentAnswers,
            },
        }
    );

    // Log the answer
    await AnswerLog.create({
        userId,
        questionId,
        difficulty: state.currentDifficulty,
        answer,
        correct: isCorrect,
        scoreDelta,
        streakAtAnswer: newStreak,
        answeredAt: new Date(),
        idempotencyKey: answerIdempotencyKey,
    });

    // Invalidate user state cache
    await invalidateUserStateCache(userId);

    // Get user for leaderboard
    const user = await User.findById(userId);
    const username = user?.username || 'Unknown';

    // Update leaderboards (async, don't block response)
    await updateScoreLeaderboard(userId, username, newTotalScore);
    await updateStreakLeaderboard(userId, username, newMaxStreak);

    // Get ranks
    const rankScore = await getUserRankScore(userId);
    const rankStreak = await getUserRankStreak(userId);

    return {
        correct: isCorrect,
        correctAnswer: question.correctAnswer,
        newDifficulty,
        newStreak,
        maxStreak: newMaxStreak,
        scoreDelta,
        totalScore: newTotalScore,
        stateVersion: newStateVersion,
        leaderboardRankScore: rankScore,
        leaderboardRankStreak: rankStreak,
        streakMultiplier,
        difficultyWeight,
        momentum: newMomentum,
    };
}

/**
 * Get user metrics
 */
export async function getUserMetrics(userId: string): Promise<MetricsResponse> {
    const state = await getOrCreateUserState(userId);

    // Calculate difficulty histogram from answer log
    const histogram = await AnswerLog.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: '$difficulty', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]);

    const difficultyHistogram: Record<number, number> = {};
    histogram.forEach((h: any) => {
        difficultyHistogram[h._id] = h.count;
    });

    // Calculate recent performance from rolling window
    const recentAnswers = state.recentAnswers || [];
    const recentPerformance = recentAnswers.length > 0
        ? recentAnswers.filter(Boolean).length / recentAnswers.length
        : 0;

    return {
        currentDifficulty: state.currentDifficulty,
        streak: state.streak,
        maxStreak: state.maxStreak,
        totalScore: state.totalScore,
        accuracy: state.totalAnswered > 0 ? state.totalCorrect / state.totalAnswered : 0,
        totalAnswered: state.totalAnswered,
        totalCorrect: state.totalCorrect,
        recentPerformance: Math.round(recentPerformance * 10000) / 10000,
        momentum: state.momentum,
        difficultyHistogram,
    };
}
