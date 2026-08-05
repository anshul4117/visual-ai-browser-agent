import mongoose from 'mongoose';

const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017/visual-ai-browser-agent';

/**
 * Connect to MongoDB with graceful error handling and event listeners.
 */
export async function connectDatabase(uri?: string): Promise<typeof mongoose> {
  const mongoUri = uri || process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  mongoose.connection.on('connected', () => {
    console.log(`[Database] MongoDB connected successfully to ${mongoUri}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[Database] MongoDB connection error:`, err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn(`[Database] MongoDB disconnected`);
  });

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    return conn;
  } catch (error) {
    console.error(`[Database] Failed to connect to MongoDB at ${mongoUri}:`, error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB gracefully on server shutdown.
 */
export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] MongoDB connection closed.');
  }
}

/**
 * Check if database is connected.
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
