import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './database/connection.js';
import { config } from './config/env.js';

async function startServer(): Promise<void> {
  try {
    await connectDatabase(config.mongoUri);
  } catch (error) {
    console.warn('[Server] Starting server with fallback storage (MongoDB offline/unreachable)');
  }

  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log(`==================================================`);
    console.log(`🚀 Visual AI Browser Agent API Server v${config.version}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`📡 Base URL:    http://localhost:${config.port}/api`);
    console.log(`🤖 AI Provider: ${config.geminiApiKey ? 'Gemini 2.5 Flash API' : 'Mock Vision Provider'}`);
    console.log(`==================================================`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
