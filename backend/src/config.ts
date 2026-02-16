import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '5000', 10),
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/brainbolt',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development',

    // Adaptive algorithm
    minDifficulty: 1,
    maxDifficulty: 10,
    momentumDecay: 0.7,
    momentumThreshold: 0.6,
    momentumCap: 2.0,
    minStreakToIncrease: 2,

    // Scoring
    basePoints: 10,
    maxStreakMultiplier: 3.0,
    streakMultiplierStep: 0.1,

    // Streak decay
    streakDecayMinutes: 30,

    // Leaderboard
    leaderboardSize: 10,

    // Cache TTL (seconds)
    userStateTTL: 300,
    questionPoolTTL: 600,
    leaderboardTTL: 10,

    // Rate limiting
    rateLimitWindowMs: 60 * 1000,
    rateLimitMax: 100,

    // Rolling window size for recent performance
    rollingWindowSize: 20,
};
