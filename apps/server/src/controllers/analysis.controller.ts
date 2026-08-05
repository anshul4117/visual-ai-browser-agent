import type { Request, Response, NextFunction } from 'express';
import {
  getAnalysisByScreenshotId,
  getAnalysesBySessionId,
  analyzeScreenshot,
} from '../ai/analysis.service.js';
import { analysisQueue } from '../ai/queue.service.js';

/**
 * GET /api/analysis/:screenshotId
 */
export async function getAnalysisByScreenshotIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { screenshotId } = req.params;
    if (!screenshotId) {
      res.status(400).json({ success: false, error: 'screenshotId parameter is required' });
      return;
    }

    const analysis = await getAnalysisByScreenshotId(screenshotId);
    if (!analysis) {
      // If not yet analyzed in DB, attempt to run analysis on the fly
      const result = await analyzeScreenshot(screenshotId);
      if (result) {
        res.status(200).json({ success: true, data: result });
        return;
      }

      res.status(404).json({ success: false, error: `No analysis found for screenshot ${screenshotId}` });
      return;
    }

    res.status(200).json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/analysis/session/:sessionId
 */
export async function getAnalysesBySessionIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      res.status(400).json({ success: false, error: 'sessionId parameter is required' });
      return;
    }

    const analyses = await getAnalysesBySessionId(sessionId);
    res.status(200).json({
      success: true,
      data: analyses,
      total: analyses.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/analysis/trigger/:screenshotId
 */
export async function triggerAnalysisHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { screenshotId } = req.params;
    if (!screenshotId) {
      res.status(400).json({ success: false, error: 'screenshotId parameter is required' });
      return;
    }

    analysisQueue.enqueue(screenshotId);
    const result = await analyzeScreenshot(screenshotId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
