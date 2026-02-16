'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getNextQuestion, submitAnswer } from '@/lib/api';
import { NextQuestionResponse, AnswerResponse } from '@/lib/types';
import Button from '@/components/Button/Button';
import Badge from '@/components/Badge/Badge';
import StatsCard from '@/components/StatsCard/StatsCard';
import Spinner from '@/components/Spinner/Spinner';
import styles from './quiz.module.css';

function generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export default function QuizPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [question, setQuestion] = useState<NextQuestionResponse | null>(null);
    const [feedback, setFeedback] = useState<AnswerResponse | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [loadingQuestion, setLoadingQuestion] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [difficulty, setDifficulty] = useState(1);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/');
        }
    }, [user, authLoading, router]);

    const fetchQuestion = useCallback(async () => {
        if (!user) return;
        setLoadingQuestion(true);
        setFeedback(null);
        setSelectedAnswer(null);
        try {
            const q = await getNextQuestion(user.userId);
            setQuestion(q);
            setScore(q.currentScore);
            setStreak(q.currentStreak);
            setMaxStreak(q.maxStreak);
            setDifficulty(q.currentDifficulty);
        } catch (err) {
            console.error('Failed to fetch question:', err);
        } finally {
            setLoadingQuestion(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchQuestion();
        }
    }, [user, fetchQuestion]);

    const handleAnswer = async (answer: string) => {
        if (!user || !question || submitting || feedback) return;
        setSelectedAnswer(answer);
        setSubmitting(true);
        try {
            const result = await submitAnswer(
                user.userId,
                question.questionId,
                answer,
                question.stateVersion,
                generateIdempotencyKey()
            );
            setFeedback(result);
            setScore(result.totalScore);
            setStreak(result.newStreak);
            setMaxStreak(result.maxStreak);
            setDifficulty(result.newDifficulty);
        } catch (err) {
            console.error('Failed to submit answer:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading || !user) {
        return <Spinner fullScreen text="Loading..." />;
    }

    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

    const getDifficultyLabel = (d: number) => {
        if (d <= 3) return 'Easy';
        if (d <= 6) return 'Medium';
        if (d <= 8) return 'Hard';
        return 'Expert';
    };

    const getDifficultyVariant = (d: number): 'success' | 'warning' | 'danger' | 'primary' => {
        if (d <= 3) return 'success';
        if (d <= 6) return 'warning';
        if (d <= 8) return 'danger';
        return 'primary';
    };

    return (
        <div className={styles.quizPage}>
            {/* Stats Bar */}
            <div className={styles.statsBar}>
                <StatsCard label="Score" value={score.toLocaleString()} icon="⭐" />
                <StatsCard label="Streak" value={streak} icon="🔥" />
                <StatsCard label="Max Streak" value={maxStreak} icon="🏅" />
                <StatsCard label="Difficulty" value={`${difficulty}/10`} icon="📈" />
            </div>

            {loadingQuestion ? (
                <Spinner text="Loading question..." />
            ) : question ? (
                <>
                    {/* Question Card */}
                    <div className={styles.questionCard}>
                        <div className={styles.questionHeader}>
                            <Badge variant={getDifficultyVariant(question.difficulty)}>
                                {getDifficultyLabel(question.difficulty)} (Lv.{question.difficulty})
                            </Badge>
                            <div className={styles.difficulty}>
                                <div className={styles.difficultyDots}>
                                    {Array.from({ length: 10 }, (_, i) => (
                                        <div
                                            key={i}
                                            className={`${styles.dot} ${i < question.difficulty
                                                    ? question.difficulty > 7
                                                        ? styles.dotHigh
                                                        : styles.dotActive
                                                    : ''
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <p className={styles.prompt}>{question.prompt}</p>

                        <div className={styles.choices}>
                            {question.choices.map((choice, idx) => {
                                let choiceClass = styles.choice;
                                if (feedback) {
                                    choiceClass += ` ${styles.choiceDisabled}`;
                                    if (choice === feedback.correctAnswer) {
                                        choiceClass += ` ${styles.choiceCorrect}`;
                                    } else if (choice === selectedAnswer && !feedback.correct) {
                                        choiceClass += ` ${styles.choiceWrong}`;
                                    }
                                } else if (choice === selectedAnswer) {
                                    choiceClass += ` ${styles.choiceSelected}`;
                                }

                                return (
                                    <button
                                        key={idx}
                                        className={choiceClass}
                                        onClick={() => handleAnswer(choice)}
                                        disabled={!!feedback || submitting}
                                        id={`choice-${idx}`}
                                    >
                                        <span className={styles.choiceLetter}>{letters[idx]}</span>
                                        <span>{choice}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Feedback */}
                    {feedback && (
                        <div
                            className={`${styles.feedbackCard} ${feedback.correct ? styles.feedbackCorrect : styles.feedbackWrong
                                }`}
                        >
                            <div className={styles.feedbackHeader}>
                                <span>{feedback.correct ? '✅' : '❌'}</span>
                                <span>{feedback.correct ? 'Correct!' : 'Wrong!'}</span>
                            </div>
                            {!feedback.correct && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                    Correct answer: <strong>{feedback.correctAnswer}</strong>
                                </p>
                            )}
                            <div className={styles.feedbackStats}>
                                <span className={styles.feedbackStat}>
                                    ⭐ +{feedback.scoreDelta} points
                                </span>
                                <span className={styles.feedbackStat}>
                                    🎯 {feedback.streakMultiplier.toFixed(1)}x multiplier
                                </span>
                                <span className={styles.feedbackStat}>
                                    📈 Difficulty → {feedback.newDifficulty}
                                </span>
                                <span className={styles.feedbackStat}>
                                    🏆 Rank #{feedback.leaderboardRankScore || '—'}
                                </span>
                            </div>
                            <div className={styles.nextBtn}>
                                <Button onClick={fetchQuestion} size="lg" id="next-question-btn">
                                    Next Question →
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No questions available</p>
                    <Button onClick={fetchQuestion} variant="secondary" style={{ marginTop: 'var(--space-md)' }}>
                        Try Again
                    </Button>
                </div>
            )}
        </div>
    );
}
