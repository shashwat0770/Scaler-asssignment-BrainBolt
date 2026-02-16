'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getMetrics } from '@/lib/api';
import { MetricsResponse } from '@/lib/types';
import StatsCard from '@/components/StatsCard/StatsCard';
import Spinner from '@/components/Spinner/Spinner';
import ProgressBar from '@/components/ProgressBar/ProgressBar';
import styles from './metrics.module.css';

export default function MetricsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/');
        }
    }, [user, authLoading, router]);

    const fetchMetrics = useCallback(async () => {
        if (!user) return;
        try {
            const m = await getMetrics(user.userId);
            setMetrics(m);
        } catch (err) {
            console.error('Failed to fetch metrics:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    if (authLoading || !user) {
        return <Spinner fullScreen text="Loading..." />;
    }

    if (loading) {
        return <Spinner fullScreen text="Loading metrics..." />;
    }

    if (!metrics) {
        return (
            <div className={styles.metricsPage}>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-2xl)' }}>
                    No metrics available. Start playing to see your stats!
                </p>
            </div>
        );
    }

    const accuracyPercent = Math.round(metrics.accuracy * 100);
    const recentPercent = Math.round(metrics.recentPerformance * 100);

    // Build histogram data for difficulties 1-10
    const maxHistCount = Math.max(1, ...Object.values(metrics.difficultyHistogram));
    const histogramData = Array.from({ length: 10 }, (_, i) => ({
        difficulty: i + 1,
        count: metrics.difficultyHistogram[i + 1] || 0,
    }));

    return (
        <div className={styles.metricsPage}>
            <h1 className={styles.pageTitle}>📊 Your Performance</h1>

            {/* Summary Stats */}
            <div className={styles.statsGrid}>
                <StatsCard label="Total Score" value={metrics.totalScore.toLocaleString()} icon="⭐" />
                <StatsCard label="Current Streak" value={metrics.streak} icon="🔥" />
                <StatsCard label="Max Streak" value={metrics.maxStreak} icon="🏅" />
                <StatsCard label="Difficulty" value={`${metrics.currentDifficulty}/10`} icon="📈" />
                <StatsCard label="Answered" value={metrics.totalAnswered} icon="📝" />
                <StatsCard label="Correct" value={metrics.totalCorrect} icon="✅" />
            </div>

            {/* Performance Cards */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <span>🎯</span> Accuracy & Performance
                </h2>
                <div className={styles.performanceCards}>
                    <div className={styles.perfCard}>
                        <span className={styles.perfLabel}>Overall Accuracy</span>
                        <span className={styles.perfValue}>{accuracyPercent}%</span>
                        <ProgressBar
                            value={accuracyPercent}
                            variant={accuracyPercent >= 70 ? 'success' : accuracyPercent >= 40 ? 'default' : 'danger'}
                        />
                        <span className={styles.perfDesc}>
                            {metrics.totalCorrect} correct out of {metrics.totalAnswered} answers
                        </span>
                    </div>
                    <div className={styles.perfCard}>
                        <span className={styles.perfLabel}>Recent Performance</span>
                        <span className={styles.perfValue}>{recentPercent}%</span>
                        <ProgressBar
                            value={recentPercent}
                            variant={recentPercent >= 70 ? 'success' : recentPercent >= 40 ? 'default' : 'danger'}
                        />
                        <span className={styles.perfDesc}>
                            Based on your last 20 answers (rolling window)
                        </span>
                    </div>
                    <div className={styles.perfCard}>
                        <span className={styles.perfLabel}>Momentum</span>
                        <span className={styles.perfValue}>
                            {metrics.momentum > 0 ? '+' : ''}{metrics.momentum.toFixed(2)}
                        </span>
                        <ProgressBar
                            value={Math.abs(metrics.momentum) * 50}
                            variant={metrics.momentum > 0 ? 'success' : 'danger'}
                        />
                        <span className={styles.perfDesc}>
                            {metrics.momentum > 0.5
                                ? 'Strong upward trend — difficulty increasing'
                                : metrics.momentum < -0.5
                                    ? 'Downward trend — difficulty decreasing'
                                    : 'Stable — difficulty holding steady'}
                        </span>
                    </div>
                    <div className={styles.perfCard}>
                        <span className={styles.perfLabel}>Streak Multiplier</span>
                        <span className={styles.perfValue}>
                            {Math.min(1 + metrics.streak * 0.1, 3.0).toFixed(1)}x
                        </span>
                        <ProgressBar
                            value={(Math.min(1 + metrics.streak * 0.1, 3.0) / 3) * 100}
                            variant="success"
                        />
                        <span className={styles.perfDesc}>
                            Max 3.0x multiplier (at 20 streak)
                        </span>
                    </div>
                </div>
            </div>

            {/* Difficulty Histogram */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <span>📊</span> Difficulty Distribution
                </h2>
                <div className={styles.histogramCard}>
                    <div className={styles.histogram}>
                        {histogramData.map((item) => (
                            <div key={item.difficulty} className={styles.histogramBar}>
                                <span className={styles.barCount}>{item.count || ''}</span>
                                <div
                                    className={styles.barFill}
                                    style={{
                                        height: `${(item.count / maxHistCount) * 100}%`,
                                    }}
                                    title={`Difficulty ${item.difficulty}: ${item.count} questions`}
                                />
                                <span className={styles.barLabel}>Lv.{item.difficulty}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
