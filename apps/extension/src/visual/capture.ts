/**
 * Visual Context Capture Module
 *
 * Captures browser visible area using official chrome.tabs.captureVisibleTab API.
 * Enforces 30-second throttling interval and browser window focus check.
 */

import type { CreateScreenshotRequest } from '@visual-ai/shared-types';
import { getDataUrlDimensions } from './image-utils.js';

const MIN_CAPTURE_INTERVAL_MS = 30000; // 30 seconds
const LAST_CAPTURE_KEY = 'vai_last_capture_time';

/**
 * Generate a unique screenshot ID.
 * Format: scr_<timestamp36>_<random>
 */
function generateScreenshotId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `scr_${timestamp}_${random}`;
}

/**
 * Check if the current browser window is focused.
 */
export async function isWindowFocused(): Promise<boolean> {
  try {
    const window = await chrome.windows.getLastFocused();
    return window?.focused ?? false;
  } catch {
    return false;
  }
}

/**
 * Check if capture is allowed based on 30-second throttling interval.
 */
async function canCaptureNow(): Promise<boolean> {
  const data = await chrome.storage.session.get([LAST_CAPTURE_KEY]);
  const lastCaptureTime = (data[LAST_CAPTURE_KEY] as number) || 0;
  return Date.now() - lastCaptureTime >= MIN_CAPTURE_INTERVAL_MS;
}

/**
 * Capture visible tab screenshot if window is focused and throttle interval has elapsed.
 */
export async function captureVisibleTab(
  sessionId: string,
  eventId?: string,
  force: boolean = false
): Promise<CreateScreenshotRequest | null> {
  // 1. Check window focus
  const focused = await isWindowFocused();
  if (!focused) {
    console.debug('[Visual AI] Window unfocused — skipping screenshot');
    return null;
  }

  // 2. Check throttling interval unless forced (e.g. significant navigation event)
  if (!force && !(await canCaptureNow())) {
    console.debug('[Visual AI] Screenshot throttled (< 30s since last capture)');
    return null;
  }

  try {
    // 3. Query active tab
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab || !activeTab.id || !activeTab.url || activeTab.url.startsWith('chrome://')) {
      return null;
    }

    // 4. Capture visible tab using official API
    const dataUrl = await chrome.tabs.captureVisibleTab({ format: 'png' });
    if (!dataUrl) return null;

    // Record capture timestamp to enforce throttling
    const now = Date.now();
    await chrome.storage.session.set({ [LAST_CAPTURE_KEY]: now });

    const dimensions = await getDataUrlDimensions(dataUrl);
    const screenshotId = generateScreenshotId();
    const capturedAt = new Date().toISOString();

    console.log(`[Visual AI] Screenshot captured: ${screenshotId} | ${activeTab.url}`);

    return {
      screenshotId,
      sessionId,
      eventId,
      url: activeTab.url,
      title: activeTab.title || '',
      capturedAt,
      dataUrl,
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch (error) {
    console.debug('[Visual AI] Screenshot capture skipped/failed:', error);
    return null;
  }
}
