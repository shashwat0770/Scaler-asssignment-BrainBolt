'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getScoreLeaderboard, getStreakLeaderboard, getLeaderboardStreamUrl } from '@/lib/api';
import { LeaderboardResponse } from '@/lib/types';
import Spinner from '@/components/Spinner/Spinner';
import styles from './leaderboard.module.css';

export default function LeaderboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [scoreBoard, setScoreBoard] = useState<LeaderboardResponse | null>(null);
    const [streakBoard, setStreakBoard] = useState<LeaderboardResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/');
        }
    }, [user, authLoading, router]);

    const fetchLeaderboards = useCallback(async () => {
        if (!user) return;
        try {
            const [s, st] = await Promise.all([
                getScoreLeaderboard(user.userId),
                getStreakLeaderboard(user.userId),
            ]);
            setScoreBoard(s);
            setStreakBoard(st);
        } catch (err) {
            console.error('Failed to fetch leaderboards:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchLeaderboards();
    }, [fetchLeaderboards]);

    // SSE real-time updates
    useEffect(() => {
        if (!user) return;
        let eventSource: EventSource | null = null;
        try {
            eventSource = new EventSource(getLeaderboardStreamUrl(user.userId));

            eventSource.addEventListener('leaderboard_score', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setScoreBoard(data);
                } catch { /* ignore parse error */ }
            });

            eventSource.addEventListener('leaderboard_streak', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setStreakBoard(data);
                } catch { /* ignore parse error */ }
            });

            eventSource.onerror = () => {
                // Reconnect after delay
                eventSource?.close();
                setTimeout(() => {
                    fetchLeaderboards();
                }, 5000);
            };
        } catch {
            // SSE not supported, fall back to polling
        }

        return () => {
            eventSource?.close();
        };
    }, [user, fetchLeaderboards]);

    if (authLoading || !user) {
        return <Spinner fullScreen text="Loading..." />;
    }

    const getRankDisplay = (rank: number) => {
        if (rank === 1) return <span className={styles.rankGold}>🥇</span>;
        if (rank === 2) return <span className={styles.rankSilver}>🥈</span>;
        if (rank === 3) return <span className={styles.rankBronze}>🥉</span>;
        return <span>#{rank}</span>;
    };

    const renderBoard = (
        title: string,
        icon: string,
        data: LeaderboardResponse | null,
        valueLabel: string
    ) => (
        <div className={styles.boardCard}>
            <div className={styles.boardHeader}>
                <span>{icon}</span>
                <span>{title}</span>
                <span className={styles.liveBadge}>
                    <span className={styles.liveDot} />
                    LIVE
                </span>
            </div>
            {loading ? (
                <Spinner text="Loading..." />
            ) : data && data.leaderboard.length > 0 ? (
                <>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Player</th>
                                <th>{valueLabel}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.leaderboard.map((entry) => (
                                <tr
                                    key={entry.userId}
                                    className={entry.isCurrentUser ? styles.currentUser : ''}
                                >
                                    <td>
                                        <span className={styles.rankBadge}>
                                            {getRankDisplay(entry.rank)}
                                        </span>
                                    </td>
                                    <td>{entry.username} {entry.isCurrentUser && '(You)'}</td>
                                    <td>{entry.value.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {data.userRank && !data.leaderboard.find(e => e.isCurrentUser) && (
                        <div className={styles.userRankCard}>
                            <span>Your Rank: #{data.userRank.rank}</span>
                            <span>{data.userRank.value.toLocaleString()}</span>
                        </div>
                    )}
                </>
            ) : (
                <div className={styles.emptyState}>
                    <p>No entries yet. Start playing to appear here!</p>
                </div>
            )}
        </div>
    );

    return (
        <div className={styles.leaderboardPage}>
            <h1 className={styles.pageTitle}>🏆 Leaderboards</h1>
            <div className={styles.boards}>
                {renderBoard('Top Scores', '⭐', scoreBoard, 'Score')}
                {renderBoard('Top Streaks', '🔥', streakBoard, 'Streak')}
            </div>
        </div>
    );
}
