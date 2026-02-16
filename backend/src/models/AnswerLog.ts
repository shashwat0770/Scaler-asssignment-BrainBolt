import mongoose, { Schema, Document } from 'mongoose';

export interface IAnswerLog extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    questionId: mongoose.Types.ObjectId;
    difficulty: number;
    answer: string;
    correct: boolean;
    scoreDelta: number;
    streakAtAnswer: number;
    answeredAt: Date;
    idempotencyKey: string;
}

const AnswerLogSchema = new Schema<IAnswerLog>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    difficulty: { type: Number, required: true },
    answer: { type: String, required: true },
    correct: { type: Boolean, required: true },
    scoreDelta: { type: Number, required: true },
    streakAtAnswer: { type: Number, required: true },
    answeredAt: { type: Date, default: Date.now },
    idempotencyKey: { type: String, required: true, unique: true },
});

AnswerLogSchema.index({ userId: 1, answeredAt: -1 });
AnswerLogSchema.index({ idempotencyKey: 1 }, { unique: true });

export const AnswerLog = mongoose.model<IAnswerLog>('AnswerLog', AnswerLogSchema);
