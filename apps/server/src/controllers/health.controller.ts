import type { Request, Response } from 'express';
import type { HealthCheckResponse } from '@visual-ai/shared-types';

const startTime = Date.now();

/**
 * Health check controller.
 * GET /api/health
 */
export function getHealth(_req: Request, res: Response): void {
  const response: HealthCheckResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  res.status(200).json(response);
}
