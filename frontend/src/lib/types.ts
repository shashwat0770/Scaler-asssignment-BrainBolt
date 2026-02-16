export interface UserResponse {
  userId: string;
  username: string;
  createdAt: string;
}

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
