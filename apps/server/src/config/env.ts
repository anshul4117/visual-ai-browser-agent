import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  dashboardUrl: string;
  mongoUri: string;
  geminiApiKey: string | undefined;
  version: string;
}

export function getConfig(): AppConfig {
  const port = parseInt(process.env.PORT || '3000', 10);
  const nodeEnv = process.env.NODE_ENV || 'development';
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:5173';
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/visual-ai-browser-agent';
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const version = process.env.npm_package_version || '1.0.0';

  console.log(`[Config] Initializing server environment: ${nodeEnv}`);
  console.log(`[Config] MongoDB URI: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`);

  if (!geminiApiKey) {
    console.log('[Config] ℹ️ GEMINI_API_KEY is not configured. AI Vision will operate using MockVisionProvider.');
  } else {
    console.log('[Config] 🤖 GEMINI_API_KEY detected. Gemini 2.5 Flash Vision Provider enabled.');
  }

  return {
    port,
    nodeEnv,
    corsOrigin,
    dashboardUrl,
    mongoUri,
    geminiApiKey,
    version,
  };
}

export const config = getConfig();
