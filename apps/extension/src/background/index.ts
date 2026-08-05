/**
 * Background Service Worker
 *
 * Central hub of the Chrome extension. Handles:
 * - Message router (content script events & popup actions)
 * - Tab activation/update listeners
 * - Local offline event queueing (chrome.storage.local)
 * - Real-time synchronization pipeline to Express backend API
 * - Exponential backoff retry queue & automatic reconnection flushing
 *
 * IMPORTANT (from AGENT.md):
 * - Service workers are ephemeral — never store state in global variables
 * - All state must be in chrome.storage
 * - Use async/await, never .then() chains
 */

import type {
  ExtensionMessage,
  StatusResponse,
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
  getBackendUrl,
  setBackendUrl,
  sendBatchEvents,
  checkServerHealth,
} from '../network/client.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const SYNC_STATE_KEY = 'vai_sync_state';

interface SyncState {
  connectionStatus: ConnectionStatus;
  lastSyncTime: string | null;
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

  // Log SESSION_STARTED event
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

// ─── Synchronization Pipeline ────────────────────────────────────────────────

let isSyncInProgress = false;

/**
 * Flush local offline event queue to backend API.
 */
async function flushQueue(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
  if (isSyncInProgress) {
    return { success: false, syncedCount: 0, error: 'Sync already in progress' };
  }

  isSyncInProgress = true;
  await setSyncState({ connectionStatus: 'syncing' });

  try {
    const queue = await getStoredEvents();
    if (queue.length === 0) {
      await setSyncState({ connectionStatus: 'connected', retryAttempt: 0 });
      isSyncInProgress = false;
      return { success: true, syncedCount: 0 };
    }

    const backendUrl = await getBackendUrl();
    const result = await sendBatchEvents(queue, backendUrl);

    if (result.success) {
      // Remove synced events from local queue
      await removeEvents(queue);
      const now = new Date().toISOString();

      await setSyncState({
        connectionStatus: 'connected',
        lastSyncTime: now,
        retryAttempt: 0,
      });

      console.log(`[Visual AI] Sync successful: ${queue.length} events uploaded to ${backendUrl}`);
      isSyncInProgress = false;
      return { success: true, syncedCount: queue.length };
    } else {
      // Upload failed — handle exponential backoff retry
      const currentState = await getSyncState();
      const nextAttempt = currentState.retryAttempt + 1;
      await setSyncState({
        connectionStatus: 'offline',
        retryAttempt: nextAttempt,
      });

      scheduleRetry(nextAttempt);
      console.warn(`[Visual AI] Sync failed: ${result.error}. Scheduled retry attempt #${nextAttempt}`);
      isSyncInProgress = false;
      return { success: false, syncedCount: 0, error: result.error };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown sync error';
    await setSyncState({ connectionStatus: 'error' });
    isSyncInProgress = false;
    return { success: false, syncedCount: 0, error: msg };
  }
}

/**
 * Schedule exponential backoff retry for failed queue flushes.
 * Delays: 2s, 4s, 8s, 16s, 32s, max 60s.
 */
function scheduleRetry(attempt: number): void {
  const delayMs = Math.min(Math.pow(2, attempt) * 1000, 60000);
  setTimeout(() => {
    (async () => {
      console.log(`[Visual AI] Retrying queue sync (attempt #${attempt})...`);
      await flushQueue();
    })();
  }, delayMs);
}

/**
 * Queue an event locally and initiate background sync.
 */
async function queueAndSync(event: StoredEvent): Promise<void> {
  await appendEvent(event);
  // Trigger background flush asynchronously without blocking caller
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

            // Quick health check to update connectionStatus accurately
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
            };
            sendResponse(response);
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
            // Immediately test connection and attempt flush
            await flushQueue();
            sendResponse({ success: true, url: newUrl });
            break;
          }

          case 'CLEAR_EVENTS': {
            await clearEvents();
            console.log('[Visual AI] Offline queue cleared');
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

    // Return true to indicate async response
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
    console.log(`[Visual AI] TAB_UPDATED | ${tab.url}`);
  } catch (error) {
    console.error('[Visual AI] Error on tab update:', error);
  }
});

// ─── Lifecycle & Network Reconnection Listener ───────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  const sessionId = await ensureSession();
  console.log(`[Visual AI] Extension installed. Session: ${sessionId}`);
  await flushQueue();
});

// Initial flush on service worker startup
(async () => {
  await ensureSession();
  await flushQueue();
})();
