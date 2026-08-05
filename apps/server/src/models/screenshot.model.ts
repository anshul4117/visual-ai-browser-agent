import { Schema, model, type Document } from 'mongoose';

/**
 * Mongoose document interface for Screenshot visual context.
 */
export interface IScreenshotDocument extends Document {
  screenshotId: string;
  sessionId: string;
  eventId?: string;
  url: string;
  title: string;
  capturedAt: Date;
  filePath: string;
  width?: number;
  height?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for Screenshots.
 * Matches docs/database.md specification.
 */
const ScreenshotSchema = new Schema<IScreenshotDocument>(
  {
    screenshotId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    eventId: {
      type: String,
      required: false,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    capturedAt: {
      type: Date,
      required: true,
      index: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    width: {
      type: Number,
      default: 0,
    },
    height: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'screenshots',
  }
);

// Index for session visual queries
ScreenshotSchema.index({ sessionId: 1, capturedAt: -1 });

export const ScreenshotModel = model<IScreenshotDocument>('Screenshot', ScreenshotSchema);
