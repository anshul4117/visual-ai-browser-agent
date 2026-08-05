import { GoogleGenAI } from '@google/genai';
import { VISION_SYSTEM_PROMPT } from './prompt.js';

export interface VisionAnalysisResult {
  summary: string;
  category: string;
  productivityScore: number;
  entities: string[];
  confidence: number;
  model: string;
}

export interface IVisionProvider {
  analyzeImage(imageBuffer: Buffer, mimeType: string, contextTitle?: string): Promise<VisionAnalysisResult>;
}

/**
 * Gemini Vision API Provider using @google/genai SDK
 */
export class GeminiVisionProvider implements IVisionProvider {
  private ai: GoogleGenAI;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-2.5-flash') {
    this.ai = new GoogleGenAI({ apiKey });
    this.modelName = modelName;
  }

  async analyzeImage(imageBuffer: Buffer, mimeType: string, contextTitle?: string): Promise<VisionAnalysisResult> {
    const base64Image = imageBuffer.toString('base64');
    const promptText = contextTitle
      ? `${VISION_SYSTEM_PROMPT}\nPage Title Context: "${contextTitle}"`
      : VISION_SYSTEM_PROMPT;

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: [
          promptText,
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType || 'image/png',
            },
          },
        ],
      });

      const responseText = response.text || '';
      const cleanedJson = responseText.replace(/```json\s*/g, '').replace(/```/g, '').trim();

      const parsed = JSON.parse(cleanedJson);

      return {
        summary: parsed.summary || 'Browser visual activity recorded.',
        category: parsed.category || 'Productivity',
        productivityScore: typeof parsed.productivityScore === 'number' ? parsed.productivityScore : 75,
        entities: Array.isArray(parsed.entities) ? parsed.entities : [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
        model: this.modelName,
      };
    } catch (error) {
      console.warn(`[AI Vision] Gemini API call failed, falling back to heuristic analysis:`, error);
      throw error;
    }
  }
}

/**
 * Fallback Mock Vision Provider (used when GEMINI_API_KEY is not configured)
 */
export class MockVisionProvider implements IVisionProvider {
  async analyzeImage(_imageBuffer: Buffer, _mimeType: string, contextTitle?: string): Promise<VisionAnalysisResult> {
    const title = contextTitle || '';
    let category = 'Productivity';
    let score = 80;
    let entities = ['Browser', 'Web Page'];

    if (title.toLowerCase().includes('github') || title.toLowerCase().includes('code') || title.toLowerCase().includes('stack')) {
      category = 'Development';
      score = 95;
      entities = ['GitHub', 'Code Editor', 'Repository'];
    } else if (title.toLowerCase().includes('youtube') || title.toLowerCase().includes('netflix')) {
      category = 'Entertainment';
      score = 25;
      entities = ['Video Player', 'Streaming Service'];
    } else if (title.toLowerCase().includes('twitter') || title.toLowerCase().includes('reddit')) {
      category = 'Social Media';
      score = 40;
      entities = ['Social Feed', 'Community'];
    }

    return {
      summary: title ? `User is interacting with "${title}".` : 'User is navigating browser pages.',
      category,
      productivityScore: score,
      entities,
      confidence: 0.88,
      model: 'mock-vision-v1',
    };
  }
}

/**
 * Vision Provider Factory
 */
export function getVisionProvider(): IVisionProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim() !== '') {
    return new GeminiVisionProvider(apiKey);
  }
  console.log('[AI Vision] GEMINI_API_KEY not found in environment — using MockVisionProvider');
  return new MockVisionProvider();
}
