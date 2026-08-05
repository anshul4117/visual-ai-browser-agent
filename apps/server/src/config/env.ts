import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  mongoUri: string;
  geminiApiKey: string | undefined;
  version: string;
}

export function getConfig(): AppConfig {
  const port = parseInt(process.env.PORT || '3000', 10);
  const nodeEnv = process.env.NODE_ENV || 'development';
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/visual-ai-browser-agent';
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const version = process.env.npm_package_version || '1.0.0';

  if (!geminiApiKey) {
    console.log('[Config] ℹ️ GEMINI_API_KEY is not configured. AI Vision will operate using MockVisionProvider.');
  }

  return {
    port,
    nodeEnv,
    corsOrigin,
    mongoUri,
    geminiApiKey,
    version,
  };
}

export const config = getConfig();
