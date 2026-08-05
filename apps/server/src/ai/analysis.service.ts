import fs from 'fs';
import path from 'path';
import { ScreenshotModel } from '../models/screenshot.model.js';
import { ScreenshotAnalysisModel, type IScreenshotAnalysis } from '../models/screenshot-analysis.model.js';
import { getVisionProvider } from './vision-client.js';
import { getUploadsDir } from '../controllers/screenshots.controller.js';
import { isDatabaseConnected } from '../database/connection.js';

// In-memory fallback store for offline development without MongoDB
const inMemoryAnalyses = new Map<string, IScreenshotAnalysis>();

/**
 * Service for analyzing a captured screenshot using AI Vision.
 */
export async function analyzeScreenshot(screenshotId: string): Promise<IScreenshotAnalysis | null> {
  // Check if already analyzed
  if (isDatabaseConnected()) {
    const existing = await ScreenshotAnalysisModel.findOne({ screenshotId }).exec();
    if (existing) {
      return existing;
    }
  } else if (inMemoryAnalyses.has(screenshotId)) {
    return inMemoryAnalyses.get(screenshotId)!;
  }

  // 1. Fetch screenshot metadata
  let sessionId = 'unknown_session';
  let title = '';
  let relativeFilePath = `/uploads/${screenshotId}.png`;

  if (isDatabaseConnected()) {
    const screenshotDoc = await ScreenshotModel.findOne({ screenshotId }).exec();
    if (screenshotDoc) {
      sessionId = screenshotDoc.sessionId;
      title = screenshotDoc.title;
      relativeFilePath = screenshotDoc.filePath;
    }
  }

  // 2. Resolve absolute image file path
  const fileName = path.basename(relativeFilePath);
  const absolutePath = path.join(getUploadsDir(), fileName);

  if (!fs.existsSync(absolutePath)) {
    console.warn(`[AI Vision] Image file not found at ${absolutePath} for analysis.`);
    return null;
  }

  // 3. Read image binary
  const imageBuffer = await fs.promises.readFile(absolutePath);

  // 4. Send to Vision Provider
  const visionProvider = getVisionProvider();
  const result = await visionProvider.analyzeImage(imageBuffer, 'image/png', title);

  const analysisPayload: IScreenshotAnalysis = {
    screenshotId,
    sessionId,
    summary: result.summary,
    category: result.category,
    productivityScore: result.productivityScore,
    entities: result.entities,
    confidence: result.confidence,
    analyzedAt: new Date(),
    model: result.model,
  };

  // 5. Store analysis in MongoDB if connected, or in-memory map fallback
  if (isDatabaseConnected()) {
    const analysisDoc = await ScreenshotAnalysisModel.create(analysisPayload);
    console.log(`[AI Vision] Saved AI Analysis for screenshot ${screenshotId} (${result.category}, score: ${result.productivityScore})`);
    return analysisDoc;
  }

  inMemoryAnalyses.set(screenshotId, analysisPayload);
  console.log(`[AI Vision] Stored in-memory AI Analysis for screenshot ${screenshotId} (${result.category}, score: ${result.productivityScore})`);
  return analysisPayload;
}

/**
 * Get analysis by screenshotId.
 */
export async function getAnalysisByScreenshotId(screenshotId: string): Promise<IScreenshotAnalysis | null> {
  if (isDatabaseConnected()) {
    return await ScreenshotAnalysisModel.findOne({ screenshotId }).exec();
  }
  return inMemoryAnalyses.get(screenshotId) || null;
}

/**
 * Get all analyses for a session.
 */
export async function getAnalysesBySessionId(sessionId: string): Promise<IScreenshotAnalysis[]> {
  if (isDatabaseConnected()) {
    return await ScreenshotAnalysisModel.find({ sessionId }).sort({ analyzedAt: -1 }).exec();
  }
  return Array.from(inMemoryAnalyses.values()).filter((a) => a.sessionId === sessionId);
}
