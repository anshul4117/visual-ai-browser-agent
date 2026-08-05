/**
 * Popup Script
 *
 * Displays extension status, event count, last event type, current tab URL.
 * Provides buttons to clear events and export events as JSON.
 *
 * IMPORTANT (from AGENT.md):
 * - No inline scripts in extension HTML
 * - Use async/await, no .then() chains
 * - tab.url requires "tabs" permission (configured in manifest.json)
 */

import type {
  GetStatusMessage,
  ClearEventsMessage,
  ExportEventsMessage,
  StatusResponse,
  ClearEventsResponse,
  ExportEventsResponse,
  StoredEvent,
} from '../messaging/types.js';

// ─── DOM Elements ────────────────────────────────────────────────────────────

const statusIndicator = document.getElementById('status-indicator') as HTMLSpanElement;
const sessionIdElement = document.getElementById('session-id') as HTMLSpanElement;
const eventCountElement = document.getElementById('event-count') as HTMLSpanElement;
const lastEventTypeElement = document.getElementById('last-event-type') as HTMLSpanElement;
const currentUrlElement = document.getElementById('current-url') as HTMLSpanElement;
const btnExport = document.getElementById('btn-export') as HTMLButtonElement;
const btnClear = document.getElementById('btn-clear') as HTMLButtonElement;

// ─── Messaging Helpers ───────────────────────────────────────────────────────

async function sendMessage<T>(message: GetStatusMessage | ClearEventsMessage | ExportEventsMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: T) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

// ─── Data Fetching ───────────────────────────────────────────────────────────

async function fetchStatus(): Promise<StatusResponse> {
  return sendMessage<StatusResponse>({ type: 'GET_STATUS' });
}

async function getActiveTabUrl(): Promise<string> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url || '—';
}

// ─── UI Rendering ────────────────────────────────────────────────────────────

function truncateUrl(url: string, maxLength: number = 40): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + '...';
}

async function updateUI(): Promise<void> {
  try {
    const status = await fetchStatus();

    // Status badge
    statusIndicator.textContent = status.isActive ? 'Active' : 'Inactive';
    statusIndicator.className = status.isActive
      ? 'status-badge status-active'
      : 'status-badge status-inactive';

    // Session ID
    const displayId = status.sessionId.length > 16
      ? '...' + status.sessionId.slice(-12)
      : status.sessionId;
    sessionIdElement.textContent = displayId;
    sessionIdElement.title = status.sessionId;

    // Event count
    eventCountElement.textContent = String(status.eventCount);

    // Last event type
    lastEventTypeElement.textContent = status.lastEventType || '—';

    // Current tab URL
    const url = await getActiveTabUrl();
    currentUrlElement.textContent = truncateUrl(url);
    currentUrlElement.title = url;

  } catch (error) {
    console.error('[Visual AI] Popup error:', error);
    statusIndicator.textContent = 'Error';
    statusIndicator.className = 'status-badge status-inactive';
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Export all stored events as a JSON file download.
 */
async function handleExport(): Promise<void> {
  try {
    const response = await sendMessage<ExportEventsResponse>({ type: 'EXPORT_EVENTS' });

    if (!response.success) {
      console.error('[Visual AI] Export failed');
      return;
    }

    const events: StoredEvent[] = response.data;
    const json = JSON.stringify(events, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create a download link and trigger it
    const a = document.createElement('a');
    a.href = url;
    a.download = `visual-ai-events-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('[Visual AI] Export error:', error);
  }
}

/**
 * Clear all stored events after confirmation.
 */
async function handleClear(): Promise<void> {
  try {
    await sendMessage<ClearEventsResponse>({ type: 'CLEAR_EVENTS' });
    await updateUI();
  } catch (error) {
    console.error('[Visual AI] Clear error:', error);
  }
}

// ─── Initialize ──────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await updateUI();

  // Attach button handlers (no inline event handlers per AGENT.md)
  btnExport.addEventListener('click', handleExport);
  btnClear.addEventListener('click', handleClear);
});
