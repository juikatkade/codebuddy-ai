import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  platform: string;
  problemId: string;
  problemTitle: string;
  difficulty: string;
  topics: string[];
  timeSpent: number; // in minutes
  solvedAt: Date;
  revisionSchedule: Date[];
}

const ActivitySchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  platform: { type: String, required: true },
  problemId: { type: String, required: true },
  problemTitle: { type: String, required: true },
  difficulty: { type: String, default: 'Medium' },
  topics: { type: [String], default: [] },
  timeSpent: { type: Number, default: 0 },
  solvedAt: { type: Date, default: Date.now },
  revisionSchedule: { type: [Date], default: [] }
});

export default mongoose.model<IActivity>('Activity', ActivitySchema);
