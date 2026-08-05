import { Schema, model } from 'mongoose';

/**
 * Interface for Screenshot AI Analysis document fields.
 */
export interface IScreenshotAnalysis {
  screenshotId: string;
  sessionId: string;
  summary: string;
  category: string;
  productivityScore: number;
  entities: string[];
  confidence: number;
  analyzedAt: Date;
  model: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Mongoose schema for Screenshot AI Analysis.
 * Matches docs/database.md specification.
 */
const ScreenshotAnalysisSchema = new Schema<IScreenshotAnalysis>(
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
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    productivityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    entities: {
      type: [String],
      default: [],
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    analyzedAt: {
      type: Date,
      required: true,
      index: true,
    },
    model: {
      type: String,
      required: true,
      default: 'gemini-2.5-flash',
    },
  },
  {
    timestamps: true,
    collection: 'screenshot_analyses',
  }
);

// Compound index for session analysis timeline
ScreenshotAnalysisSchema.index({ sessionId: 1, analyzedAt: -1 });

export const ScreenshotAnalysisModel = model<IScreenshotAnalysis>(
  'ScreenshotAnalysis',
  ScreenshotAnalysisSchema
);
