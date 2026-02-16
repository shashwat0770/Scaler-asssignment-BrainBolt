import { config } from '../config';

export interface ScoreResult {
    scoreDelta: number;
    streakMultiplier: number;
    difficultyWeight: number;
}

/**
 * Calculate score for an answer.
 * 
 * Formula:
 *   streakMultiplier = min(1.0 + streak * 0.1, 3.0)
 *   difficultyWeight = 1.0 + (difficulty - 1) * 0.25
 *   scoreDelta = basePoints * difficultyWeight * streakMultiplier (if correct)
 *   scoreDelta = 0 (if wrong — no penalty, streak resets instead)
 */
export function calculateScore(
    isCorrect: boolean,
    difficulty: number,
    streak: number
): ScoreResult {
    const streakMultiplier = Math.min(
        1.0 + streak * config.streakMultiplierStep,
        config.maxStreakMultiplier
    );

    const difficultyWeight = 1.0 + (difficulty - 1) * 0.25;

    let scoreDelta = 0;
    if (isCorrect) {
        scoreDelta = Math.round(config.basePoints * difficultyWeight * streakMultiplier);
    }

    return { scoreDelta, streakMultiplier, difficultyWeight };
}

/**
 * Calculate overall accuracy
 */
export function calculateAccuracy(totalCorrect: number, totalAnswered: number): number {
    if (totalAnswered === 0) return 0;
    return Math.round((totalCorrect / totalAnswered) * 10000) / 10000;
}
