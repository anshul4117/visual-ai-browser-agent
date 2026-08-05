import express, { type Express } from 'express';
import cors from 'cors';
import { loggerMiddleware } from './middleware/logger.middleware.js';
import { errorMiddleware, notFoundHandler } from './middleware/error.middleware.js';
import healthRouter from './routes/health.routes.js';
import eventsRouter from './routes/events.routes.js';

export function createApp(): Express {
  const app: Express = express();

  // CORS configuration
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  app.use(
    cors({
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logger
  app.use(loggerMiddleware);

  // API Routes
  app.use('/api', healthRouter);
  app.use('/api', eventsRouter);

  // Root fallback
  app.get('/', (_req, res) => {
    res.json({
      name: 'Visual AI Browser Agent Backend API',
      version: '1.0.0',
      docs: '/api/health',
    });
  });

  // 404 Not Found handler
  app.use(notFoundHandler);

  // Global Error handler
  app.use(errorMiddleware);

  return app;
}
