import { config } from '../config';
import { LeaderboardScore } from '../models/LeaderboardScore';
import { LeaderboardStreak } from '../models/LeaderboardStreak';
import { getCachedLeaderboard, setCachedLeaderboard, invalidateLeaderboardCache } from './cacheService';
import { sseManager } from './sseManager';

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    value: number;
    isCurrentUser?: boolean;
}

export interface LeaderboardResponse {
    leaderboard: LeaderboardEntry[];
    userRank: LeaderboardEntry | null;
}

export async function updateScoreLeaderboard(userId: string, username: string, totalScore: number): Promise<void> {
    await LeaderboardScore.findOneAndUpdate(
        { userId },
        { userId, username, totalScore, updatedAt: new Date() },
        { upsert: true, new: true }
    );
    await invalidateLeaderboardCache();

    // Broadcast update via SSE
    const leaderboard = await getScoreLeaderboard();
    sseManager.broadcast('leaderboard_score', leaderboard);
}

export async function updateStreakLeaderboard(userId: string, username: string, maxStreak: number): Promise<void> {
    await LeaderboardStreak.findOneAndUpdate(
        { userId },
        { userId, username, maxStreak, updatedAt: new Date() },
        { upsert: true, new: true }
    );
    await invalidateLeaderboardCache();

    // Broadcast update via SSE
    const leaderboard = await getStreakLeaderboard();
    sseManager.broadcast('leaderboard_streak', leaderboard);
}

export async function getScoreLeaderboard(currentUserId?: string): Promise<LeaderboardResponse> {
    // Try cache first
    const cached = await getCachedLeaderboard('score');
    let entries: any[];

    if (cached) {
        entries = cached;
    } else {
        entries = await LeaderboardScore.find()
            .sort({ totalScore: -1 })
            .limit(config.leaderboardSize)
            .lean();
        await setCachedLeaderboard('score', entries);
    }

    const leaderboard: LeaderboardEntry[] = entries.map((entry: any, index: number) => ({
        rank: index + 1,
        userId: entry.userId.toString(),
        username: entry.username,
        value: entry.totalScore,
        isCurrentUser: currentUserId ? entry.userId.toString() === currentUserId : false,
    }));

    // Get current user's rank if not in top N
    let userRank: LeaderboardEntry | null = null;
    if (currentUserId) {
        const inTop = leaderboard.find(e => e.isCurrentUser);
        if (inTop) {
            userRank = inTop;
        } else {
            const userEntry = await LeaderboardScore.findOne({ userId: currentUserId }).lean();
            if (userEntry) {
                const rank = await LeaderboardScore.countDocuments({ totalScore: { $gt: userEntry.totalScore } }) + 1;
                userRank = {
                    rank,
                    userId: currentUserId,
                    username: (userEntry as any).username,
                    value: (userEntry as any).totalScore,
                    isCurrentUser: true,
                };
            }
        }
    }

    return { leaderboard, userRank };
}

export async function getStreakLeaderboard(currentUserId?: string): Promise<LeaderboardResponse> {
    const cached = await getCachedLeaderboard('streak');
    let entries: any[];

    if (cached) {
        entries = cached;
    } else {
        entries = await LeaderboardStreak.find()
            .sort({ maxStreak: -1 })
            .limit(config.leaderboardSize)
            .lean();
        await setCachedLeaderboard('streak', entries);
    }

    const leaderboard: LeaderboardEntry[] = entries.map((entry: any, index: number) => ({
        rank: index + 1,
        userId: entry.userId.toString(),
        username: entry.username,
        value: entry.maxStreak,
        isCurrentUser: currentUserId ? entry.userId.toString() === currentUserId : false,
    }));

    let userRank: LeaderboardEntry | null = null;
    if (currentUserId) {
        const inTop = leaderboard.find(e => e.isCurrentUser);
        if (inTop) {
            userRank = inTop;
        } else {
            const userEntry = await LeaderboardStreak.findOne({ userId: currentUserId }).lean();
            if (userEntry) {
                const rank = await LeaderboardStreak.countDocuments({ maxStreak: { $gt: (userEntry as any).maxStreak } }) + 1;
                userRank = {
                    rank,
                    userId: currentUserId,
                    username: (userEntry as any).username,
                    value: (userEntry as any).maxStreak,
                    isCurrentUser: true,
                };
            }
        }
    }

    return { leaderboard, userRank };
}

export async function getUserRankScore(userId: string): Promise<number> {
    const userEntry = await LeaderboardScore.findOne({ userId }).lean();
    if (!userEntry) return 0;
    return await LeaderboardScore.countDocuments({ totalScore: { $gt: (userEntry as any).totalScore } }) + 1;
}

export async function getUserRankStreak(userId: string): Promise<number> {
    const userEntry = await LeaderboardStreak.findOne({ userId }).lean();
    if (!userEntry) return 0;
    return await LeaderboardStreak.countDocuments({ maxStreak: { $gt: (userEntry as any).maxStreak } }) + 1;
}
