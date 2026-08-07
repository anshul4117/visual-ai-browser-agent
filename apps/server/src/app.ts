import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { loggerMiddleware } from './middleware/logger.middleware.js';
import { errorMiddleware, notFoundHandler } from './middleware/error.middleware.js';
import healthRouter from './routes/health.routes.js';
import eventsRouter from './routes/events.routes.js';
import screenshotsRouter from './routes/screenshots.routes.js';
import analysisRouter from './routes/analysis.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import { getUploadsDir } from './controllers/screenshots.controller.js';
import { config } from './config/env.js';

export function createApp(): Express {
  const app: Express = express();

  // Enable trust proxy for reverse proxies (Render, Railway, Heroku, Vercel)
  app.set('trust proxy', 1);

  // Security headers with Helmet (allow cross-origin resource sharing for static uploads)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    })
  );

  // Response compression middleware (gzip)
  app.use(compression());

  // Rate Limiting (1000 requests per 15-minute window)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests from this IP, please try again later.' },
  });
  app.use('/api', apiLimiter);

  // CORS configuration
  const allowedOrigins = config.corsOrigin === '*' ? '*' : [config.corsOrigin, config.dashboardUrl];
  app.use(
    cors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    })
  );

  // Body parser (50mb limit for base64 screenshot data URLs)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Serve static uploaded screenshot images
  app.use('/uploads', express.static(getUploadsDir()));

  // Request logger
  app.use(loggerMiddleware);

  // API Routes
  app.use('/api', healthRouter);
  app.use('/api', eventsRouter);
  app.use('/api', screenshotsRouter);
  app.use('/api', analysisRouter);
  app.use('/api/dashboard', dashboardRouter);

  // Root fallback
  app.get('/', (_req, res) => {
    res.json({
      name: 'Visual AI Browser Agent Backend API',
      version: config.version,
      environment: config.nodeEnv,
      docs: '/api/health',
    });
  });

  // 404 Not Found handler
  app.use(notFoundHandler);

  // Global Error handler
  app.use(errorMiddleware);

  return app;
}
