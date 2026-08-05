import dotenv from 'dotenv';
import { createApp } from './app.js';

// Load environment variables from .env if present
dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Visual AI Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`📡 Base URL: http://localhost:${PORT}/api`);
  console.log(`==================================================`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down server gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
