import {
    UserResponse,
    NextQuestionResponse,
    AnswerResponse,
    MetricsResponse,
    LeaderboardResponse,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || err.message || 'API Error');
    }
    return res.json();
}

// User
export async function registerUser(username: string): Promise<UserResponse> {
    return apiFetch<UserResponse>('/v1/user/register', {
        method: 'POST',
        body: JSON.stringify({ username }),
    });
}

export async function getUser(userId: string): Promise<UserResponse> {
    return apiFetch<UserResponse>(`/v1/user/${userId}`);
}

// Quiz
export async function getNextQuestion(userId: string): Promise<NextQuestionResponse> {
    return apiFetch<NextQuestionResponse>(`/v1/quiz/next?userId=${userId}`);
}

export async function submitAnswer(
    userId: string,
    questionId: string,
    answer: string,
    stateVersion: number,
    answerIdempotencyKey: string
): Promise<AnswerResponse> {
    return apiFetch<AnswerResponse>('/v1/quiz/answer', {
        method: 'POST',
        body: JSON.stringify({ userId, questionId, answer, stateVersion, answerIdempotencyKey }),
    });
}

export async function getMetrics(userId: string): Promise<MetricsResponse> {
    return apiFetch<MetricsResponse>(`/v1/quiz/metrics?userId=${userId}`);
}

// Leaderboard
export async function getScoreLeaderboard(userId?: string): Promise<LeaderboardResponse> {
    const q = userId ? `?userId=${userId}` : '';
    return apiFetch<LeaderboardResponse>(`/v1/leaderboard/score${q}`);
}

export async function getStreakLeaderboard(userId?: string): Promise<LeaderboardResponse> {
    const q = userId ? `?userId=${userId}` : '';
    return apiFetch<LeaderboardResponse>(`/v1/leaderboard/streak${q}`);
}

// SSE Stream URL
export function getLeaderboardStreamUrl(clientId?: string): string {
    const q = clientId ? `?clientId=${clientId}` : '';
    return `${API_BASE}/v1/leaderboard/stream${q}`;
}
