import type { Request, Response, NextFunction } from 'express';

/**
 * Request logging middleware.
 * Logs HTTP method, URL path, status code, and duration in ms.
 */
export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const logPrefix = `[HTTP] ${new Date().toISOString()} | ${method} ${originalUrl} | ${statusCode} | ${duration}ms`;

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
