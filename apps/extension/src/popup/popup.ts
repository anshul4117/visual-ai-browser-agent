/**
 * Popup Script
 *
 * Displays extension status, session ID, connection status, queued count, last sync time.
 * Provides controls to change Backend Server URL, trigger Sync Now, export JSON, and clear queue.
 *
 * IMPORTANT (from AGENT.md):
 * - No inline scripts in extension HTML
 * - Use async/await, no .then() chains
 */

import type {
  GetStatusMessage,
  SyncNowMessage,
  SetBackendUrlMessage,
  ClearEventsMessage,
  ExportEventsMessage,
  StatusResponse,
  SyncResponse,
  SetBackendUrlResponse,
  ClearEventsResponse,
  ExportEventsResponse,
  StoredEvent,
} from '../messaging/types.js';

// ─── DOM Elements ────────────────────────────────────────────────────────────

const statusIndicator = document.getElementById('status-indicator') as HTMLSpanElement;
const connectionIndicator = document.getElementById('connection-indicator') as HTMLSpanElement;
const backendUrlInput = document.getElementById('backend-url-input') as HTMLInputElement;
const btnSaveUrl = document.getElementById('btn-save-url') as HTMLButtonElement;
const sessionIdElement = document.getElementById('session-id') as HTMLSpanElement;
const queuedCountElement = document.getElementById('queued-count') as HTMLSpanElement;
const lastSyncTimeElement = document.getElementById('last-sync-time') as HTMLSpanElement;
const currentUrlElement = document.getElementById('current-url') as HTMLSpanElement;
const btnSyncNow = document.getElementById('btn-sync-now') as HTMLButtonElement;
const btnExport = document.getElementById('btn-export') as HTMLButtonElement;
const btnClear = document.getElementById('btn-clear') as HTMLButtonElement;

// ─── Messaging Helper ────────────────────────────────────────────────────────

async function sendMessage<T>(
  message: GetStatusMessage | SyncNowMessage | SetBackendUrlMessage | ClearEventsMessage | ExportEventsMessage
): Promise<T> {
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

// ─── Helper Functions ────────────────────────────────────────────────────────

async function getActiveTabUrl(): Promise<string> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url || '—';
}

function truncateUrl(url: string, maxLength: number = 36): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + '...';
}

function formatSyncTime(isoString: string | null): string {
  if (!isoString) return 'Never';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'Never';

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── UI Rendering ────────────────────────────────────────────────────────────

async function updateUI(): Promise<void> {
  try {
    const status = await sendMessage<StatusResponse>({ type: 'GET_STATUS' });

    // Active status
    statusIndicator.textContent = status.isActive ? 'Active' : 'Inactive';
    statusIndicator.className = status.isActive
      ? 'status-badge status-active'
      : 'status-badge status-inactive';

    // Connection badge
    const connClassMap: Record<string, string> = {
      connected: 'status-badge connection-connected',
      syncing: 'status-badge connection-syncing',
      offline: 'status-badge connection-offline',
      error: 'status-badge connection-error',
    };
    const connTextMap: Record<string, string> = {
      connected: 'Connected',
      syncing: 'Syncing...',
      offline: 'Offline',
      error: 'Error',
    };

    connectionIndicator.textContent = connTextMap[status.connectionStatus] || 'Offline';
    connectionIndicator.className = connClassMap[status.connectionStatus] || 'status-badge connection-offline';

    // Backend URL input (only set if not actively focused by user)
    if (document.activeElement !== backendUrlInput) {
      backendUrlInput.value = status.backendUrl || 'http://localhost:3000';
    }

    // Session ID
    const displayId = status.sessionId.length > 16
      ? '...' + status.sessionId.slice(-12)
      : status.sessionId;
    sessionIdElement.textContent = displayId;
    sessionIdElement.title = status.sessionId;

    // Queued count
    queuedCountElement.textContent = `${status.queuedCount} item${status.queuedCount === 1 ? '' : 's'}`;

    // Last sync time
    lastSyncTimeElement.textContent = formatSyncTime(status.lastSyncTime);

    // Active Tab URL
    const url = await getActiveTabUrl();
    currentUrlElement.textContent = truncateUrl(url);
    currentUrlElement.title = url;

  } catch (error) {
    console.error('[Visual AI] Popup update error:', error);
    statusIndicator.textContent = 'Error';
    statusIndicator.className = 'status-badge status-inactive';
    connectionIndicator.textContent = 'Offline';
    connectionIndicator.className = 'status-badge connection-offline';
  }
}

// ─── User Actions ────────────────────────────────────────────────────────────

/**
 * Handle manual Sync Now button.
 */
async function handleSyncNow(): Promise<void> {
  try {
    btnSyncNow.disabled = true;
    btnSyncNow.textContent = 'Syncing...';

    const res = await sendMessage<SyncResponse>({ type: 'SYNC_NOW' });

    if (res.success) {
      console.log(`[Visual AI] Manual sync complete: ${res.syncedCount} items uploaded`);
    } else {
      console.warn('[Visual AI] Manual sync error:', res.error);
    }
  } catch (error) {
    console.error('[Visual AI] Manual sync failed:', error);
  } finally {
    btnSyncNow.disabled = false;
    btnSyncNow.textContent = 'Sync Now';
    await updateUI();
  }
}

/**
 * Handle saving new Backend URL configuration.
 */
async function handleSaveBackendUrl(): Promise<void> {
  const newUrl = backendUrlInput.value.trim();
  if (!newUrl) return;

  try {
    btnSaveUrl.disabled = true;
    btnSaveUrl.textContent = 'Saving...';

    const res = await sendMessage<SetBackendUrlResponse>({
      type: 'SET_BACKEND_URL',
      url: newUrl,
    });

    if (res.success) {
      backendUrlInput.value = res.url;
    }
  } catch (error) {
    console.error('[Visual AI] Save URL error:', error);
  } finally {
    btnSaveUrl.disabled = false;
    btnSaveUrl.textContent = 'Save';
    await updateUI();
  }
}

/**
 * Export JSON download of queued events.
 */
async function handleExport(): Promise<void> {
  try {
    const response = await sendMessage<ExportEventsResponse>({ type: 'EXPORT_EVENTS' });
    if (!response.success) return;

    const events: StoredEvent[] = response.data;
    const json = JSON.stringify(events, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `visual-ai-queue-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[Visual AI] Export error:', error);
  }
}

/**
 * Clear offline queue.
 */
async function handleClear(): Promise<void> {
  try {
    await sendMessage<ClearEventsResponse>({ type: 'CLEAR_EVENTS' });
    await updateUI();
  } catch (error) {
    console.error('[Visual AI] Clear error:', error);
  }
}

// ─── Event Listeners ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await updateUI();

  btnSyncNow.addEventListener('click', handleSyncNow);
  btnSaveUrl.addEventListener('click', handleSaveBackendUrl);
  btnExport.addEventListener('click', handleExport);
  btnClear.addEventListener('click', handleClear);

  // Press Enter in backend URL input to save
  backendUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSaveBackendUrl();
    }
  });
});
