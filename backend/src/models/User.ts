import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    username: string;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true, trim: true, minlength: 1, maxlength: 30 },
    createdAt: { type: Date, default: Date.now },
});

UserSchema.index({ username: 1 }, { unique: true });

export const User = mongoose.model<IUser>('User', UserSchema);
