/**
 * Background Service Worker
 *
 * Central hub of the Chrome extension. Handles:
 * - Messages from content scripts (PAGE_LOADED, CLICK, SCROLL, VISIBILITY_CHANGED)
 * - Tab activation/update events from Chrome APIs
 * - Session management via chrome.storage.session
 * - Event persistence via event-logger module
 * - Popup requests (GET_STATUS, CLEAR_EVENTS, EXPORT_EVENTS)
 *
 * IMPORTANT (from AGENT.md):
 * - Service workers are ephemeral — never store state in global variables
 * - All state must be in chrome.storage
 * - Use async/await, never .then() chains
 */

import type {
  ExtensionMessage,
  StatusResponse,
  ClearEventsResponse,
  ExportEventsResponse,
  AckResponse,
  StoredEvent,
} from '../messaging/types.js';

import {
  createEvent,
  appendEvent,
  getStoredEvents,
  getEventCount,
  getLastEvent,
  clearEvents,
} from '../storage/event-logger.js';

// ─── Session Management ─────────────────────────────────────────────────────

/**
 * Generate a unique session ID.
 * Format: vai_<timestamp>_<random>
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `vai_${timestamp}_${random}`;
}

/**
 * Ensure a session exists in chrome.storage.session.
 * Creates one if none exists, and logs a SESSION_STARTED event.
 */
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
  await appendEvent(event);

  console.log(`[Visual AI] New session started: ${sessionId}`);
  return sessionId;
}

// ─── Event Logging Helpers ───────────────────────────────────────────────────

/**
 * Log an event and update the session metadata in chrome.storage.session.
 */
async function logEvent(
  sessionId: string,
  eventType: string,
  url: string,
  title: string,
  metadata: Record<string, unknown>
): Promise<void> {
  const event = createEvent({
    sessionId,
    url,
    title,
    eventType,
    timestamp: new Date().toISOString(),
    metadata,
  });

  const count = await appendEvent(event);

  // Update session metadata (last event type for popup display)
  await chrome.storage.session.set({
    lastEventType: eventType,
    lastEventCount: count,
  });
}

// ─── Deduplication ───────────────────────────────────────────────────────────

/**
 * Track last PAGE_LOADED URL to avoid duplicate events when content script
 * fires multiple times on the same page (e.g., SPA navigation).
 */
async function isDuplicatePageLoad(url: string): Promise<boolean> {
  const data = await chrome.storage.session.get(['lastPageLoadedUrl']);
  if (data.lastPageLoadedUrl === url) {
    return true;
  }
  await chrome.storage.session.set({ lastPageLoadedUrl: url });
  return false;
}

// ─── Message Handler ─────────────────────────────────────────────────────────

type MessageResponse = StatusResponse | ClearEventsResponse | ExportEventsResponse | AckResponse;

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
              await logEvent(
                sessionId,
                'page_load',
                message.data.url,
                message.data.title,
                {}
              );
              console.log(`[Visual AI] PAGE_LOADED | ${message.data.url}`);
            }
            sendResponse({ received: true });
            break;
          }

          case 'CLICK': {
            await logEvent(
              sessionId,
              'click',
              message.data.url,
              message.data.title,
              {
                selector: message.data.selector,
                tagName: message.data.tagName,
                innerText: message.data.innerText,
              }
            );
            sendResponse({ received: true });
            break;
          }

          case 'SCROLL': {
            await logEvent(
              sessionId,
              'scroll',
              message.data.url,
              message.data.title,
              {
                scrollPercentage: message.data.scrollPercentage,
              }
            );
            sendResponse({ received: true });
            break;
          }

          case 'VISIBILITY_CHANGED': {
            await logEvent(
              sessionId,
              'visibility_changed',
              message.data.url,
              message.data.title,
              {
                visibilityState: message.data.visibilityState,
              }
            );
            sendResponse({ received: true });
            break;
          }

          case 'GET_STATUS': {
            const count = await getEventCount();
            const lastEvent = await getLastEvent();
            const sessionData = await chrome.storage.session.get(['isActive']);

            const response: StatusResponse = {
              isActive: (sessionData.isActive as boolean) ?? true,
              sessionId,
              eventCount: count,
              lastEventType: lastEvent?.eventType ?? null,
            };
            sendResponse(response);
            break;
          }

          case 'CLEAR_EVENTS': {
            await clearEvents();
            console.log('[Visual AI] Events cleared');
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

/**
 * Detect tab activation (user switches between tabs).
 * Logs a TAB_ACTIVATED event with the new tab's URL.
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const sessionId = await ensureSession();
    const tab = await chrome.tabs.get(activeInfo.tabId);

    if (tab.url && !tab.url.startsWith('chrome://')) {
      await logEvent(
        sessionId,
        'tab_switch',
        tab.url,
        tab.title || '',
        {
          previousTabId: activeInfo.tabId,
        }
      );
      console.log(`[Visual AI] TAB_ACTIVATED | ${tab.url}`);
    }
  } catch (error) {
    console.error('[Visual AI] Error on tab activation:', error);
  }
});

/**
 * Detect tab URL/title updates.
 * Only fires when the tab has fully loaded (status === 'complete').
 */
chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  // Only track completed loads with a real URL
  if (changeInfo.status !== 'complete') return;
  if (!tab.url || tab.url.startsWith('chrome://')) return;

  try {
    const sessionId = await ensureSession();

    await logEvent(
      sessionId,
      'url_change',
      tab.url,
      tab.title || '',
      {
        previousUrl: '',
      }
    );
    console.log(`[Visual AI] TAB_UPDATED | ${tab.url}`);
  } catch (error) {
    console.error('[Visual AI] Error on tab update:', error);
  }
});

// ─── Lifecycle ───────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  const sessionId = await ensureSession();
  console.log(`[Visual AI] Extension installed. Session: ${sessionId}`);
});

// Ensure session on service worker startup (after idle termination)
(async () => {
  await ensureSession();
})();
