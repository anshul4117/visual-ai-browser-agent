/**
 * Screenshot Queue & Offline Logger
 *
 * Manages the temporary offline screenshot queue in chrome.storage.local.
 * Screenshots are stored locally as CreateScreenshotRequest objects and removed
 * upon successful transmission to POST /api/screenshots.
 */

import type { CreateScreenshotRequest } from '@visual-ai/shared-types';

const SCREENSHOT_STORAGE_KEY = 'vai_screenshots';
const MAX_STORED_SCREENSHOTS = 100; // Cap to prevent storage quota exceed

/**
 * Append a screenshot to the local queue.
 */
export async function queueScreenshot(screenshot: CreateScreenshotRequest): Promise<number> {
  const data = await chrome.storage.local.get([SCREENSHOT_STORAGE_KEY]);
  const screenshots: CreateScreenshotRequest[] = (data[SCREENSHOT_STORAGE_KEY] as CreateScreenshotRequest[] | undefined) || [];

  screenshots.push(screenshot);

  // Trim oldest if over limit
  if (screenshots.length > MAX_STORED_SCREENSHOTS) {
    screenshots.splice(0, screenshots.length - MAX_STORED_SCREENSHOTS);
  }

  await chrome.storage.local.set({ [SCREENSHOT_STORAGE_KEY]: screenshots });
  return screenshots.length;
}

/**
 * Get all queued screenshots.
 */
export async function getQueuedScreenshots(): Promise<CreateScreenshotRequest[]> {
  const data = await chrome.storage.local.get([SCREENSHOT_STORAGE_KEY]);
  return (data[SCREENSHOT_STORAGE_KEY] as CreateScreenshotRequest[] | undefined) || [];
}

/**
 * Remove specific uploaded screenshots from queue.
 */
export async function removeScreenshots(syncedIds: string[]): Promise<number> {
  if (syncedIds.length === 0) return await getQueuedScreenshotCount();

  const idSet = new Set(syncedIds);
  const current = await getQueuedScreenshots();
  const remaining = current.filter((s) => !idSet.has(s.screenshotId));

  await chrome.storage.local.set({ [SCREENSHOT_STORAGE_KEY]: remaining });
  return remaining.length;
}

/**
 * Get total screenshot queue count.
 */
export async function getQueuedScreenshotCount(): Promise<number> {
  const list = await getQueuedScreenshots();
  return list.length;
}

/**
 * Get latest screenshot object.
 */
export async function getLatestQueuedScreenshot(): Promise<CreateScreenshotRequest | null> {
  const list = await getQueuedScreenshots();
  return list.length > 0 ? list[list.length - 1]! : null;
}

/**
 * Clear queued screenshots.
 */
export async function clearScreenshots(): Promise<void> {
  await chrome.storage.local.remove([SCREENSHOT_STORAGE_KEY]);
}
