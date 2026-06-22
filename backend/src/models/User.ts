import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  authProviderId?: string;
  telegramUsername?: string;
  telegramChatId?: string;
  preferences: {
    dailyReminderTime?: string;
    roastModeEnabled: boolean;
    theme: 'dark' | 'light';
    focusModeDefaults: string[];
    contestRemindersEnabled?: boolean;
  };
  stats: {
    currentStreak: number;
    longestStreak: number;
    totalSolved: number;
    problemsPerDayGoal: number;
    codingHours: number;
  };
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  authProviderId: String,
  telegramUsername: String,
  telegramChatId: String,
  preferences: {
    dailyReminderTime: { type: String, default: '18:00' },
    roastModeEnabled: { type: Boolean, default: false },
    theme: { type: String, default: 'dark' },
    focusModeDefaults: { type: [String], default: [] },
    contestRemindersEnabled: { type: Boolean, default: true }
  },
  stats: {
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalSolved: { type: Number, default: 0 },
    problemsPerDayGoal: { type: Number, default: 3 },
    codingHours: { type: Number, default: 0 }
  }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
