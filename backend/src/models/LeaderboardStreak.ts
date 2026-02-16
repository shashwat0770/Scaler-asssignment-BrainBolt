import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaderboardStreak extends Document {
    userId: mongoose.Types.ObjectId;
    username: string;
    maxStreak: number;
    updatedAt: Date;
}

const LeaderboardStreakSchema = new Schema<ILeaderboardStreak>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    username: { type: String, required: true },
    maxStreak: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
});

LeaderboardStreakSchema.index({ maxStreak: -1 });
LeaderboardStreakSchema.index({ userId: 1 }, { unique: true });

export const LeaderboardStreak = mongoose.model<ILeaderboardStreak>('LeaderboardStreak', LeaderboardStreakSchema);
