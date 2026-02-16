import mongoose, { Schema, Document } from 'mongoose';

export interface IUserState extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    currentDifficulty: number;
    streak: number;
    maxStreak: number;
    totalScore: number;
    totalAnswered: number;
    totalCorrect: number;
    lastQuestionId: mongoose.Types.ObjectId | null;
    lastAnswerAt: Date | null;
    stateVersion: number;
    momentum: number;
    recentAnswers: boolean[];
}

const UserStateSchema = new Schema<IUserState>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    currentDifficulty: { type: Number, default: 1, min: 1, max: 10 },
    streak: { type: Number, default: 0 },
    maxStreak: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    totalAnswered: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    lastQuestionId: { type: Schema.Types.ObjectId, ref: 'Question', default: null },
    lastAnswerAt: { type: Date, default: null },
    stateVersion: { type: Number, default: 0 },
    momentum: { type: Number, default: 0 },
    recentAnswers: { type: [Boolean], default: [] },
});

UserStateSchema.index({ userId: 1 }, { unique: true });

export const UserState = mongoose.model<IUserState>('UserState', UserStateSchema);
