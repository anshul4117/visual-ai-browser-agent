/**
 * Popup Script
 *
 * Displays extension status, session ID, connection status, screenshot stats, and AI Vision insights.
 * Provides controls for AI screenshot analysis, manual sync, backend URL configuration, JSON export, and clearing queues.
 */

import type {
  GetStatusMessage,
  GetLatestScreenshotMessage,
  AnalyzeLatestMessage,
  SyncNowMessage,
  SetBackendUrlMessage,
  ClearEventsMessage,
  ExportEventsMessage,
  StatusResponse,
  GetLatestScreenshotResponse,
  AnalyzeLatestResponse,
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
const screenshotCountElement = document.getElementById('screenshot-count') as HTMLSpanElement;
const lastCaptureTimeElement = document.getElementById('last-capture-time') as HTMLSpanElement;
const queuedCountElement = document.getElementById('queued-count') as HTMLSpanElement;

// AI Vision Card Elements
const aiCategoryBadge = document.getElementById('ai-category-badge') as HTMLSpanElement;
const aiSummaryText = document.getElementById('ai-summary-text') as HTMLParagraphElement;
const aiScoreValue = document.getElementById('ai-score-value') as HTMLSpanElement;
const aiScoreBar = document.getElementById('ai-score-bar') as HTMLDivElement;

// Action Buttons
const btnAnalyze = document.getElementById('btn-analyze') as HTMLButtonElement;
const btnViewScreenshot = document.getElementById('btn-view-screenshot') as HTMLButtonElement;
const btnSyncNow = document.getElementById('btn-sync-now') as HTMLButtonElement;
const btnExport = document.getElementById('btn-export') as HTMLButtonElement;
const btnClear = document.getElementById('btn-clear') as HTMLButtonElement;

// Modal Elements
const screenshotModal = document.getElementById('screenshot-modal') as HTMLDivElement;
const btnCloseModal = document.getElementById('btn-close-modal') as HTMLButtonElement;
const screenshotPreviewImg = document.getElementById('screenshot-preview-img') as HTMLImageElement;
const screenshotMetaText = document.getElementById('screenshot-meta-text') as HTMLParagraphElement;

// ─── Messaging Helper ────────────────────────────────────────────────────────

async function sendMessage<T>(
  message:
    | GetStatusMessage
    | GetLatestScreenshotMessage
    | AnalyzeLatestMessage
    | SyncNowMessage
    | SetBackendUrlMessage
    | ClearEventsMessage
    | ExportEventsMessage
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

function formatRelativeTime(isoString: string | null): string {
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

    // Backend URL input
    if (document.activeElement !== backendUrlInput) {
      backendUrlInput.value = status.backendUrl || 'http://localhost:3000';
    }

    // Session ID
    const displayId = status.sessionId.length > 16
      ? '...' + status.sessionId.slice(-12)
      : status.sessionId;
    sessionIdElement.textContent = displayId;
    sessionIdElement.title = status.sessionId;

    // Screenshot stats
    screenshotCountElement.textContent = String(status.screenshotCount);
    lastCaptureTimeElement.textContent = formatRelativeTime(status.lastCaptureTime);
    queuedCountElement.textContent = `${status.queuedCount} item${status.queuedCount === 1 ? '' : 's'}`;

    // AI Analysis card
    if (status.latestAnalysis) {
      const { summary, category, productivityScore } = status.latestAnalysis;
      aiSummaryText.textContent = summary || 'No summary available.';
      aiCategoryBadge.textContent = category || 'General';
      aiScoreValue.textContent = `${productivityScore} / 100`;
      aiScoreBar.style.width = `${Math.min(Math.max(productivityScore, 0), 100)}%`;
    } else {
      aiSummaryText.textContent = 'No AI analysis completed yet for this session.';
      aiCategoryBadge.textContent = 'Pending';
      aiScoreValue.textContent = '— / 100';
      aiScoreBar.style.width = '0%';
    }

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
 * Handle Analyze Latest Screenshot button.
 */
async function handleAnalyzeLatest(): Promise<void> {
  try {
    btnAnalyze.disabled = true;
    btnAnalyze.textContent = 'Analyzing with AI...';

    const res = await sendMessage<AnalyzeLatestResponse>({ type: 'ANALYZE_LATEST' });

    if (res.success && res.analysis) {
      aiSummaryText.textContent = res.analysis.summary;
      aiCategoryBadge.textContent = res.analysis.category;
      aiScoreValue.textContent = `${res.analysis.productivityScore} / 100`;
      aiScoreBar.style.width = `${res.analysis.productivityScore}%`;
    } else {
      alert(res.error || 'Failed to generate AI analysis.');
    }
  } catch (error) {
    console.error('[Visual AI] AI analysis error:', error);
    alert('AI analysis failed. Please verify backend connectivity.');
  } finally {
    btnAnalyze.disabled = false;
    btnAnalyze.textContent = 'Analyze Latest Screenshot';
    await updateUI();
  }
}

/**
 * Handle View Latest Screenshot button.
 */
async function handleViewScreenshot(): Promise<void> {
  try {
    const res = await sendMessage<GetLatestScreenshotResponse>({ type: 'GET_LATEST_SCREENSHOT' });

    if (res.success && res.screenshot && res.screenshot.dataUrl) {
      screenshotPreviewImg.src = res.screenshot.dataUrl;
      screenshotMetaText.textContent = `${res.screenshot.title} (${res.screenshot.width}x${res.screenshot.height})`;
      screenshotModal.classList.remove('hidden');
    } else {
      alert('No screenshot currently available in queue or session.');
    }
  } catch (error) {
    console.error('[Visual AI] View screenshot error:', error);
    alert('Failed to retrieve latest screenshot.');
  }
}

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
 * Handle saving Backend URL configuration.
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
 * Clear offline queues.
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

  btnAnalyze.addEventListener('click', handleAnalyzeLatest);
  btnViewScreenshot.addEventListener('click', handleViewScreenshot);
  btnSyncNow.addEventListener('click', handleSyncNow);
  btnSaveUrl.addEventListener('click', handleSaveBackendUrl);
  btnExport.addEventListener('click', handleExport);
  btnClear.addEventListener('click', handleClear);

  btnCloseModal.addEventListener('click', () => {
    screenshotModal.classList.add('hidden');
  });

  backendUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSaveBackendUrl();
    }
  });
});
