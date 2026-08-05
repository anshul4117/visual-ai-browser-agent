import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Request logging & Request ID tracking middleware.
 * Attaches x-request-id and logs HTTP method, URL, status code, request ID, and duration.
 */
export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();

  // Attach request ID to response header
  res.setHeader('x-request-id', requestId);

  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const logPrefix = `[HTTP] ${new Date().toISOString()} | reqId=${requestId} | ${method} ${originalUrl} | ${statusCode} | ${duration}ms`;

    if (statusCode >= 500) {
      console.error(logPrefix);
    } else if (statusCode >= 400) {
      console.warn(logPrefix);
    } else {
      console.log(logPrefix);
    }
  });

  next();
}
