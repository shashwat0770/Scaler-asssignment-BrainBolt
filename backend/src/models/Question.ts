import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
    _id: mongoose.Types.ObjectId;
    difficulty: number;
    prompt: string;
    choices: string[];
    correctAnswer: string;
    correctAnswerHash: string;
    tags: string[];
}

const QuestionSchema = new Schema<IQuestion>({
    difficulty: { type: Number, required: true, min: 1, max: 10 },
    prompt: { type: String, required: true },
    choices: { type: [String], required: true },
    correctAnswer: { type: String, required: true },
    correctAnswerHash: { type: String, required: true },
    tags: { type: [String], default: [] },
});

QuestionSchema.index({ difficulty: 1 });
QuestionSchema.index({ tags: 1 });

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);
