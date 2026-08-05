/**
 * Background Service Worker
 *
 * Central hub of the Chrome extension. Handles:
 * - Message router (content script events & popup actions)
 * - Tab activation/update listeners
 * - Local offline event queueing & screenshot queueing
 * - Real-time synchronization pipeline to Express backend API (events & screenshots)
 * - Visual context capture scheduler (30s throttled captures)
 *
 * IMPORTANT (from AGENT.md):
 * - Service workers are ephemeral — never store state in global variables
 * - All state must be in chrome.storage
 * - Use async/await, never .then() chains
 */

import type {
  ExtensionMessage,
  StatusResponse,
  GetLatestScreenshotResponse,
  SyncResponse,
  SetBackendUrlResponse,
  ClearEventsResponse,
  ExportEventsResponse,
  AckResponse,
  ConnectionStatus,
  StoredEvent,
} from '../messaging/types.js';

import {
  createEvent,
  appendEvent,
  getStoredEvents,
  removeEvents,
  getEventCount,
  getLastEvent,
  clearEvents,
} from '../storage/event-logger.js';

import {
  queueScreenshot,
  getQueuedScreenshots,
  removeScreenshots,
  getLatestQueuedScreenshot,
  clearScreenshots,
} from '../storage/screenshot-logger.js';

import {
  getBackendUrl,
  setBackendUrl,
  sendBatchEvents,
  sendScreenshot,
  checkServerHealth,
} from '../network/client.js';

import { captureVisibleTab } from '../visual/capture.js';
import { startScheduler } from '../visual/scheduler.js';
import type { CreateScreenshotRequest } from '@visual-ai/shared-types';

// ─── Constants ───────────────────────────────────────────────────────────────

const SYNC_STATE_KEY = 'vai_sync_state';

interface SyncState {
  connectionStatus: ConnectionStatus;
  lastSyncTime: string | null;
  lastCaptureTime: string | null;
  totalScreenshotsCaptured: number;
  retryAttempt: number;
}

// ─── Sync State Management ───────────────────────────────────────────────────

async function getSyncState(): Promise<SyncState> {
  const data = await chrome.storage.session.get([SYNC_STATE_KEY]);
  if (data[SYNC_STATE_KEY]) {
    return data[SYNC_STATE_KEY] as SyncState;
  }
  return {
    connectionStatus: 'offline',
    lastSyncTime: null,
    lastCaptureTime: null,
    totalScreenshotsCaptured: 0,
    retryAttempt: 0,
  };
}

async function setSyncState(patch: Partial<SyncState>): Promise<SyncState> {
  const current = await getSyncState();
  const updated: SyncState = { ...current, ...patch };
  await chrome.storage.session.set({ [SYNC_STATE_KEY]: updated });
  return updated;
}

// ─── Session Management ─────────────────────────────────────────────────────

function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `vai_${timestamp}_${random}`;
}

async function ensureSession(): Promise<string> {
  const data = await chrome.storage.session.get(['sessionId']);
  if (data.sessionId) {
    return data.sessionId as string;
  }

  const sessionId = generateSessionId();
  const now = new Date().toISOString();

  await chrome.storage.session.set({
    sessionId,
    isActive: true,
    startedAt: now,
  });

  const event = createEvent({
    sessionId,
    url: '',
    title: '',
    eventType: 'session_started',
    timestamp: now,
    metadata: {},
  });
  await queueAndSync(event);

  console.log(`[Visual AI] New session started: ${sessionId}`);
  return sessionId;
}

// ─── Visual Context Capture & Queue ─────────────────────────────────────────

async function handleScreenshotCapture(screenshot: CreateScreenshotRequest): Promise<void> {
  await queueScreenshot(screenshot);

  const state = await getSyncState();
  await setSyncState({
    lastCaptureTime: screenshot.capturedAt,
    totalScreenshotsCaptured: state.totalScreenshotsCaptured + 1,
  });

  // Trigger background flush for screenshots
  flushQueue().catch((err) => console.debug('[Visual AI] Screenshot sync flush error:', err));
}

async function triggerVisualCapture(sessionId: string, force: boolean = false): Promise<void> {
  try {
    const screenshot = await captureVisibleTab(sessionId, undefined, force);
    if (screenshot) {
      await handleScreenshotCapture(screenshot);
    }
  } catch (error) {
    console.debug('[Visual AI] Visual capture error:', error);
  }
}

// ─── Synchronization Pipeline ────────────────────────────────────────────────

let isSyncInProgress = false;

/**
 * Flush local offline event queue and screenshot queue to backend API.
 */
async function flushQueue(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
  if (isSyncInProgress) {
    return { success: false, syncedCount: 0, error: 'Sync already in progress' };
  }

  isSyncInProgress = true;
  await setSyncState({ connectionStatus: 'syncing' });

  try {
    const backendUrl = await getBackendUrl();
    const eventQueue = await getStoredEvents();
    let totalSynced = 0;

    // 1. Sync Activity Events
    if (eventQueue.length > 0) {
      const eventResult = await sendBatchEvents(eventQueue, backendUrl);
      if (eventResult.success) {
        await removeEvents(eventQueue);
        totalSynced += eventQueue.length;
      } else {
        const currentState = await getSyncState();
        const nextAttempt = currentState.retryAttempt + 1;
        await setSyncState({
          connectionStatus: 'offline',
          retryAttempt: nextAttempt,
        });
        scheduleRetry(nextAttempt);
        isSyncInProgress = false;
        return { success: false, syncedCount: 0, error: eventResult.error };
      }
    }

    // 2. Sync Screenshots
    const screenshotQueue = await getQueuedScreenshots();
    if (screenshotQueue.length > 0) {
      const syncedScreenshotIds: string[] = [];
      for (const scr of screenshotQueue) {
        const scrResult = await sendScreenshot(scr, backendUrl);
        if (scrResult.success) {
          syncedScreenshotIds.push(scr.screenshotId);
        }
      }
      if (syncedScreenshotIds.length > 0) {
        await removeScreenshots(syncedScreenshotIds);
      }
    }

    const now = new Date().toISOString();
    await setSyncState({
      connectionStatus: 'connected',
      lastSyncTime: now,
      retryAttempt: 0,
    });

    isSyncInProgress = false;
    return { success: true, syncedCount: totalSynced };

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown sync error';
    await setSyncState({ connectionStatus: 'error' });
    isSyncInProgress = false;
    return { success: false, syncedCount: 0, error: msg };
  }
}

function scheduleRetry(attempt: number): void {
  const delayMs = Math.min(Math.pow(2, attempt) * 1000, 60000);
  setTimeout(() => {
    (async () => {
      console.log(`[Visual AI] Retrying sync (attempt #${attempt})...`);
      await flushQueue();
    })();
  }, delayMs);
}

async function queueAndSync(event: StoredEvent): Promise<void> {
  await appendEvent(event);
  flushQueue().catch((err) => console.debug('[Visual AI] Background flush error:', err));
}

// ─── Deduplication ───────────────────────────────────────────────────────────

async function isDuplicatePageLoad(url: string): Promise<boolean> {
  const data = await chrome.storage.session.get(['lastPageLoadedUrl']);
  if (data.lastPageLoadedUrl === url) {
    return true;
  }
  await chrome.storage.session.set({ lastPageLoadedUrl: url });
  return false;
}

// ─── Message Handler ─────────────────────────────────────────────────────────

type MessageResponse =
  | StatusResponse
  | GetLatestScreenshotResponse
  | SyncResponse
  | SetBackendUrlResponse
  | ClearEventsResponse
  | ExportEventsResponse
  | AckResponse;

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ): boolean => {
    (async () => {
      try {
        const sessionId = await ensureSession();

        switch (message.type) {
          case 'PAGE_LOADED': {
            const isDupe = await isDuplicatePageLoad(message.data.url);
            if (!isDupe) {
              const event = createEvent({
                sessionId,
                url: message.data.url,
                title: message.data.title,
                eventType: 'page_load',
                timestamp: message.data.timestamp,
                metadata: {},
              });
              await queueAndSync(event);

              // Trigger visual capture on navigation
              await triggerVisualCapture(sessionId, true);
              console.log(`[Visual AI] PAGE_LOADED | ${message.data.url}`);
            }
            sendResponse({ received: true });
            break;
          }

          case 'CLICK': {
            const event = createEvent({
              sessionId,
              url: message.data.url,
              title: message.data.title,
              eventType: 'click',
              timestamp: message.data.timestamp,
              metadata: {
                selector: message.data.selector,
                tagName: message.data.tagName,
                innerText: message.data.innerText,
              },
            });
            await queueAndSync(event);
            sendResponse({ received: true });
            break;
          }

          case 'SCROLL': {
            const event = createEvent({
              sessionId,
              url: message.data.url,
              title: message.data.title,
              eventType: 'scroll',
              timestamp: message.data.timestamp,
              metadata: {
                scrollPercentage: message.data.scrollPercentage,
              },
            });
            await queueAndSync(event);
            sendResponse({ received: true });
            break;
          }

          case 'VISIBILITY_CHANGED': {
            const event = createEvent({
              sessionId,
              url: message.data.url,
              title: message.data.title,
              eventType: 'visibility_changed',
              timestamp: message.data.timestamp,
              metadata: {
                visibilityState: message.data.visibilityState,
              },
            });
            await queueAndSync(event);
            sendResponse({ received: true });
            break;
          }

          case 'GET_STATUS':
          case 'GET_SYNC_STATUS': {
            const count = await getEventCount();
            const lastEvent = await getLastEvent();
            const syncState = await getSyncState();
            const backendUrl = await getBackendUrl();
            const sessionData = await chrome.storage.session.get(['isActive']);
            const latestScreenshot = await getLatestQueuedScreenshot();

            const isHealthy = await checkServerHealth(backendUrl);
            const currentStatus: ConnectionStatus = isHealthy ? 'connected' : 'offline';

            const response: StatusResponse = {
              isActive: (sessionData.isActive as boolean) ?? true,
              sessionId,
              eventCount: count,
              lastEventType: lastEvent?.eventType ?? null,
              connectionStatus: isSyncInProgress ? 'syncing' : currentStatus,
              queuedCount: count,
              lastSyncTime: syncState.lastSyncTime,
              backendUrl,
              screenshotCount: syncState.totalScreenshotsCaptured,
              lastCaptureTime: syncState.lastCaptureTime,
              latestScreenshotDataUrl: latestScreenshot?.dataUrl || null,
            };
            sendResponse(response);
            break;
          }

          case 'GET_LATEST_SCREENSHOT': {
            const latest = await getLatestQueuedScreenshot();
            sendResponse({
              success: latest !== null,
              screenshot: latest,
            });
            break;
          }

          case 'SYNC_NOW': {
            const result = await flushQueue();
            sendResponse({
              success: result.success,
              syncedCount: result.syncedCount,
              error: result.error,
            });
            break;
          }

          case 'SET_BACKEND_URL': {
            const newUrl = await setBackendUrl(message.url);
            await flushQueue();
            sendResponse({ success: true, url: newUrl });
            break;
          }

          case 'CLEAR_EVENTS': {
            await clearEvents();
            await clearScreenshots();
            console.log('[Visual AI] Queues cleared');
            sendResponse({ success: true });
            break;
          }

          case 'EXPORT_EVENTS': {
            const events: StoredEvent[] = await getStoredEvents();
            sendResponse({ success: true, data: events });
            break;
          }

          default: {
            console.warn(`[Visual AI] Unknown message type`);
            sendResponse({ received: false });
          }
        }
      } catch (error) {
        console.error('[Visual AI] Error handling message:', error);
        sendResponse({ received: false });
      }
    })();

    return true;
  }
);

// ─── Tab Events ──────────────────────────────────────────────────────────────

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const sessionId = await ensureSession();
    const tab = await chrome.tabs.get(activeInfo.tabId);

    if (tab.url && !tab.url.startsWith('chrome://')) {
      const event = createEvent({
        sessionId,
        url: tab.url,
        title: tab.title || '',
        eventType: 'tab_switch',
        timestamp: new Date().toISOString(),
        metadata: {
          previousTabId: activeInfo.tabId,
        },
      });
      await queueAndSync(event);

      // Capture screenshot on tab activation
      await triggerVisualCapture(sessionId, true);
      console.log(`[Visual AI] TAB_ACTIVATED | ${tab.url}`);
    }
  } catch (error) {
    console.error('[Visual AI] Error on tab activation:', error);
  }
});

chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  if (!tab.url || tab.url.startsWith('chrome://')) return;

  try {
    const sessionId = await ensureSession();
    const event = createEvent({
      sessionId,
      url: tab.url,
      title: tab.title || '',
      eventType: 'url_change',
      timestamp: new Date().toISOString(),
      metadata: {
        previousUrl: '',
      },
    });
    await queueAndSync(event);

    // Capture screenshot on URL change
    await triggerVisualCapture(sessionId, true);
    console.log(`[Visual AI] TAB_UPDATED | ${tab.url}`);
  } catch (error) {
    console.error('[Visual AI] Error on tab update:', error);
  }
});

// ─── Start Periodic Visual Capture Scheduler ──────────────────────────────────

startScheduler(ensureSession, handleScreenshotCapture);

// ─── Lifecycle Startup ────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  const sessionId = await ensureSession();
  console.log(`[Visual AI] Extension installed. Session: ${sessionId}`);
  await flushQueue();
});

(async () => {
  await ensureSession();
  await flushQueue();
})();
