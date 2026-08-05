import { Schema, model, type Document } from 'mongoose';

/**
 * Mongoose document interface for Browsing Session.
 */
export interface ISessionDocument extends Document {
  sessionId: string;
  startedAt: Date;
  endedAt?: Date | null;
  duration?: number;
  eventCount: number;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for Sessions.
 * Matches docs/database.md specification.
 */
const SessionSchema = new Schema<ISessionDocument>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    startedAt: {
      type: Date,
      required: true,
      index: true,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
    eventCount: {
      type: Number,
      default: 0,
    },
    lastSeenAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'sessions',
  }
);

// Index for listing recent sessions
SessionSchema.index({ startedAt: -1 });

export const SessionModel = model<ISessionDocument>('Session', SessionSchema);
