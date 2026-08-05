/**
 * Popup Script
 *
 * Displays extension status, session ID, event count, and current tab URL.
 * Communicates with the background service worker via chrome.runtime.sendMessage.
 *
 * IMPORTANT (from AGENT.md):
 * - No inline scripts in extension HTML
 * - Use async/await, no .then() chains
 * - tab.url requires "tabs" permission (configured in manifest.json)
 */

import type { GetStatusMessage, StatusResponse } from '../messaging/types.js';

// ─── DOM Elements ────────────────────────────────────────────────────────────

const statusIndicator = document.getElementById('status-indicator') as HTMLSpanElement;
const sessionIdElement = document.getElementById('session-id') as HTMLSpanElement;
const eventCountElement = document.getElementById('event-count') as HTMLSpanElement;
const currentUrlElement = document.getElementById('current-url') as HTMLSpanElement;

// ─── Data Fetching ───────────────────────────────────────────────────────────

/**
 * Request status from the background service worker.
 */
async function fetchStatus(): Promise<StatusResponse> {
  return new Promise((resolve, reject) => {
    const message: GetStatusMessage = { type: 'GET_STATUS' };
    chrome.runtime.sendMessage(message, (response: StatusResponse) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

/**
 * Get the currently active tab's URL.
 * Requires "tabs" permission in manifest.json.
 */
async function getActiveTabUrl(): Promise<string> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url || '—';
}

// ─── UI Rendering ────────────────────────────────────────────────────────────

/**
 * Truncate a URL for display purposes.
 */
function truncateUrl(url: string, maxLength: number = 40): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + '...';
}

/**
 * Update the popup UI with current data.
 */
async function updateUI(): Promise<void> {
  try {
    // Fetch status from background
    const status = await fetchStatus();

    // Update status badge
    statusIndicator.textContent = status.isActive ? 'Active' : 'Inactive';
    statusIndicator.className = status.isActive
      ? 'status-badge status-active'
      : 'status-badge status-inactive';

    // Update session ID (show last 12 chars for readability)
    const displayId = status.sessionId.length > 16
      ? '...' + status.sessionId.slice(-12)
      : status.sessionId;
    sessionIdElement.textContent = displayId;
    sessionIdElement.title = status.sessionId;

    // Update event count
    eventCountElement.textContent = String(status.eventCount);

    // Update current tab URL
    const url = await getActiveTabUrl();
    currentUrlElement.textContent = truncateUrl(url);
    currentUrlElement.title = url;

  } catch (error) {
    console.error('[Visual AI] Popup error:', error);
    statusIndicator.textContent = 'Error';
    statusIndicator.className = 'status-badge status-inactive';
  }
}

// ─── Initialize ──────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await updateUI();
});
