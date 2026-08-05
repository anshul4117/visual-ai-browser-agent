import dotenv from 'dotenv';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './database/connection.js';

// Load environment variables from .env if present
dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer(): Promise<void> {
  // Connect to MongoDB (fallback to in-memory store if connection fails or unconfigured)
  try {
    await connectDatabase();
  } catch (error) {
    console.warn('[Server] Starting server with fallback InMemoryEventStore (MongoDB offline)');
  }

  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Visual AI Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`📡 Base URL: http://localhost:${PORT}/api`);
    console.log(`==================================================`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down server gracefully...`);
    server.close(async () => {
      console.log('HTTP server closed.');
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
