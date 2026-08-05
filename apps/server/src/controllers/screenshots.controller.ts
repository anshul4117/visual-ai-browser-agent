import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import type { CreateScreenshotRequest } from '@visual-ai/shared-types';
import { ScreenshotModel } from '../models/screenshot.model.js';
import { isDatabaseConnected } from '../database/connection.js';
import { analysisQueue } from '../ai/queue.service.js';

export function getUploadsDir(): string {
  const cwd = process.cwd();
  if (cwd.endsWith('apps/server')) {
    return path.join(cwd, 'uploads');
  }
  return path.join(cwd, 'apps/server/uploads');
}

const UPLOADS_DIR = getUploadsDir();

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Controller for creating/uploading a screenshot visual context.
 * POST /api/screenshots
 */
export async function createScreenshot(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload: CreateScreenshotRequest = req.body;

    if (!payload.screenshotId || !payload.sessionId || !payload.dataUrl) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: screenshotId, sessionId, and dataUrl are required.',
      });
      return;
    }

    // Extract Base64 binary data from Data URL
    const base64Data = payload.dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Save image to local uploads directory
    const dir = getUploadsDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const fileName = `${payload.screenshotId}.png`;
    const absolutePath = path.join(dir, fileName);
    const relativePath = `/uploads/${fileName}`;

    await fs.promises.writeFile(absolutePath, buffer);
    console.log(`[Server] Saved screenshot file: ${relativePath} (${buffer.length} bytes)`);

    // Store metadata in MongoDB if connected
    if (isDatabaseConnected()) {
      await ScreenshotModel.create({
        screenshotId: payload.screenshotId,
        sessionId: payload.sessionId,
        eventId: payload.eventId || undefined,
        url: payload.url || '',
        title: payload.title || '',
        capturedAt: new Date(payload.capturedAt || Date.now()),
        filePath: relativePath,
        width: payload.width || 0,
        height: payload.height || 0,
      });
    }

    // Enqueue screenshot for background AI vision analysis
    analysisQueue.enqueue(payload.screenshotId);

    res.status(201).json({
      success: true,
      screenshotId: payload.screenshotId,
      filePath: relativePath,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for querying screenshots.
 * GET /api/screenshots
 */
export async function getScreenshots(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = req.query.sessionId as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);
    const offset = Math.max(parseInt(req.query.offset as string, 10) || 0, 0);

    if (isDatabaseConnected()) {
      const filter: Record<string, unknown> = {};
      if (sessionId) filter.sessionId = sessionId;

      const [docs, total] = await Promise.all([
        ScreenshotModel.find(filter).sort({ capturedAt: -1 }).skip(offset).limit(limit).exec(),
        ScreenshotModel.countDocuments(filter).exec(),
      ]);

      res.status(200).json({
        success: true,
        data: docs,
        total,
        limit,
        offset,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: [],
      total: 0,
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for getting the latest screenshot.
 * GET /api/screenshots/latest
 */
export async function getLatestScreenshot(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (isDatabaseConnected()) {
      const latest = await ScreenshotModel.findOne().sort({ capturedAt: -1 }).exec();
      if (latest) {
        res.status(200).json({
          success: true,
          data: latest,
        });
        return;
      }
    }

    res.status(404).json({
      success: false,
      error: 'No screenshots found',
    });
  } catch (error) {
    next(error);
  }
}
