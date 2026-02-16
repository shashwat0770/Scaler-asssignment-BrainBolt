import { config } from '../config';
import { cacheGet, cacheSet, cacheDel } from '../redis';
import { Question, IQuestion } from '../models/Question';

const QUESTION_POOL_PREFIX = 'questions:difficulty:';
const USER_STATE_PREFIX = 'user_state:';
const LEADERBOARD_PREFIX = 'leaderboard:';

export async function getCachedQuestionPool(difficulty: number): Promise<any[]> {
    const key = `${QUESTION_POOL_PREFIX}${difficulty}`;
    const cached = await cacheGet(key);

    if (cached) {
        try {
            return JSON.parse(cached);
        } catch {
            // fall through to DB
        }
    }

    const questions = await Question.find({ difficulty }).lean();
    if (questions.length > 0) {
        await cacheSet(key, JSON.stringify(questions), config.questionPoolTTL);
    }
    return questions;
}

export async function getCachedUserState(userId: string): Promise<any | null> {
    const key = `${USER_STATE_PREFIX}${userId}`;
    const cached = await cacheGet(key);
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch {
            return null;
        }
    }
    return null;
}

export async function setCachedUserState(userId: string, state: any): Promise<void> {
    const key = `${USER_STATE_PREFIX}${userId}`;
    await cacheSet(key, JSON.stringify(state), config.userStateTTL);
}

export async function invalidateUserStateCache(userId: string): Promise<void> {
    const key = `${USER_STATE_PREFIX}${userId}`;
    await cacheDel(key);
}

export async function getCachedLeaderboard(type: 'score' | 'streak'): Promise<any[] | null> {
    const key = `${LEADERBOARD_PREFIX}${type}`;
    const cached = await cacheGet(key);
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch {
            return null;
        }
    }
    return null;
}

export async function setCachedLeaderboard(type: 'score' | 'streak', data: any[]): Promise<void> {
    const key = `${LEADERBOARD_PREFIX}${type}`;
    await cacheSet(key, JSON.stringify(data), config.leaderboardTTL);
}

export async function invalidateLeaderboardCache(): Promise<void> {
    await cacheDel(`${LEADERBOARD_PREFIX}score`);
    await cacheDel(`${LEADERBOARD_PREFIX}streak`);
}

export async function invalidateQuestionPoolCache(difficulty?: number): Promise<void> {
    if (difficulty) {
        await cacheDel(`${QUESTION_POOL_PREFIX}${difficulty}`);
    } else {
        for (let d = config.minDifficulty; d <= config.maxDifficulty; d++) {
            await cacheDel(`${QUESTION_POOL_PREFIX}${d}`);
        }
    }
}
