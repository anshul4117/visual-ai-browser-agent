/**
 * Periodic Visual Context Scheduler
 *
 * Runs a 30-second interval timer that triggers visual context capture
 * for active focused browser tabs.
 */

import { captureVisibleTab } from './capture.js';
import type { CreateScreenshotRequest } from '@visual-ai/shared-types';

const SCHEDULER_INTERVAL_MS = 30000; // 30 seconds

type CaptureHandler = (screenshot: CreateScreenshotRequest) => Promise<void>;

let timerId: ReturnType<typeof setInterval> | null = null;

/**
 * Start periodic 30-second visual context capture scheduler.
 */
export function startScheduler(
  getSessionId: () => Promise<string>,
  onCapture: CaptureHandler
): void {
  if (timerId !== null) return;

  timerId = setInterval(async () => {
    try {
      const sessionId = await getSessionId();
      const screenshot = await captureVisibleTab(sessionId, undefined, false);
      if (screenshot) {
        await onCapture(screenshot);
      }
    } catch (error) {
      console.debug('[Visual AI] Scheduler capture check error:', error);
    }
  }, SCHEDULER_INTERVAL_MS);

  console.log('[Visual AI] Visual capture scheduler started (30s interval)');
}

/**
 * Stop periodic visual context capture scheduler.
 */
export function stopScheduler(): void {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
    console.log('[Visual AI] Visual capture scheduler stopped');
  }
}
