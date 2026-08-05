import { Schema, model, type Document } from 'mongoose';

/**
 * Mongoose document interface for Activity Event.
 */
export interface IEventDocument extends Document {
  sessionId: string;
  userId?: string;
  url: string;
  title: string;
  eventType: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for Activity Events.
 * Matches docs/database.md specification.
 */
const EventSchema = new Schema<IEventDocument>(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    userId: {
      type: String,
      required: false,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'events',
  }
);

// Compound index for querying events by session sorted by timestamp
EventSchema.index({ sessionId: 1, timestamp: -1 });

export const EventModel = model<IEventDocument>('Event', EventSchema);
