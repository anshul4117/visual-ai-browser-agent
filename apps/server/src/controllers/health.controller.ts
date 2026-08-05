import type { Request, Response } from 'express';
import { isDatabaseConnected } from '../database/connection.js';
import { analysisQueue } from '../ai/queue.service.js';
import { config } from '../config/env.js';

const startTime = Date.now();

/**
 * Enhanced Health check controller.
 * GET /api/health
 */
export function getHealth(_req: Request, res: Response): void {
  const dbConnected = isDatabaseConnected();
  const queueMetrics = analysisQueue.getMetrics();
  const aiProvider = config.geminiApiKey ? 'gemini-2.5-flash' : 'mock_fallback';

  const status = 'ok';

  res.status(200).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: config.version,
    environment: config.nodeEnv,
    services: {
      database: dbConnected ? 'connected' : 'in_memory_fallback',
      queue: queueMetrics,
      aiProvider,
    },
  });
}
