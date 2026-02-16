import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaderboardScore extends Document {
    userId: mongoose.Types.ObjectId;
    username: string;
    totalScore: number;
    updatedAt: Date;
}

const LeaderboardScoreSchema = new Schema<ILeaderboardScore>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    username: { type: String, required: true },
    totalScore: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
});

LeaderboardScoreSchema.index({ totalScore: -1 });
LeaderboardScoreSchema.index({ userId: 1 }, { unique: true });

export const LeaderboardScore = mongoose.model<ILeaderboardScore>('LeaderboardScore', LeaderboardScoreSchema);
