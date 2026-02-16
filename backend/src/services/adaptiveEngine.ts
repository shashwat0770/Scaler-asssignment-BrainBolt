import { config } from '../config';

export interface AdaptiveResult {
    newDifficulty: number;
    newMomentum: number;
}

/**
 * Momentum-based adaptive difficulty engine with ping-pong stabilization.
 * 
 * How it prevents ping-pong instability:
 * 1. Momentum accumulates over time (decayed), not instant reaction
 * 2. Must exceed threshold to change difficulty
 * 3. Minimum streak required to increase difficulty
 * 4. Alternating correct/wrong produces momentum ~0 (within threshold band)
 * 
 * Example: correct, wrong, correct, wrong pattern:
 *   momentum: 0 -> 1.0 -> -0.3 -> 0.79 -> -0.45 (oscillates near 0, never exceeds ±0.6)
 */
export function calculateNewDifficulty(
    currentDifficulty: number,
    isCorrect: boolean,
    currentMomentum: number,
    currentStreak: number
): AdaptiveResult {
    // Step 1: Update momentum with decay
    let newMomentum: number;
    if (isCorrect) {
        newMomentum = currentMomentum * config.momentumDecay + 1.0;
    } else {
        newMomentum = currentMomentum * config.momentumDecay - 1.0;
    }

    // Step 2: Clamp momentum
    newMomentum = Math.max(-config.momentumCap, Math.min(config.momentumCap, newMomentum));

    // Step 3: Determine difficulty change
    let newDifficulty = currentDifficulty;

    if (newMomentum > config.momentumThreshold && currentStreak >= config.minStreakToIncrease) {
        // Increase difficulty only with sustained correct answers AND minimum streak
        newDifficulty = Math.min(currentDifficulty + 1, config.maxDifficulty);
    } else if (newMomentum < -config.momentumThreshold) {
        // Decrease difficulty on sustained wrong answers (no streak requirement)
        newDifficulty = Math.max(currentDifficulty - 1, config.minDifficulty);
    }
    // Otherwise: difficulty stays the same (stabilized)

    return { newDifficulty, newMomentum };
}

/**
 * Check if streak should decay due to inactivity
 */
export function shouldDecayStreak(lastAnswerAt: Date | null): boolean {
    if (!lastAnswerAt) return false;
    const minutesSinceLastAnswer = (Date.now() - new Date(lastAnswerAt).getTime()) / (1000 * 60);
    return minutesSinceLastAnswer > config.streakDecayMinutes;
}

/**
 * Update the rolling window of recent answers
 */
export function updateRecentAnswers(recentAnswers: boolean[], isCorrect: boolean): boolean[] {
    const updated = [...recentAnswers, isCorrect];
    if (updated.length > config.rollingWindowSize) {
        return updated.slice(updated.length - config.rollingWindowSize);
    }
    return updated;
}

/**
 * Calculate recent accuracy from rolling window
 */
export function calculateRecentAccuracy(recentAnswers: boolean[]): number {
    if (recentAnswers.length === 0) return 0;
    const correct = recentAnswers.filter(Boolean).length;
    return correct / recentAnswers.length;
}
