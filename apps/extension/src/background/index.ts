/**
 * Background Service Worker
 *
 * Central hub of the Chrome extension. Receives messages from content scripts
 * and the popup. Manages session state via chrome.storage.session.
 *
 * IMPORTANT (from AGENT.md):
 * - Service workers are ephemeral — never store state in global variables
 * - All state must be in chrome.storage
 * - Use async/await, never .then() chains
 */

import type {
  ExtensionMessage,
  StatusResponse,
} from '../messaging/types.js';

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
 * Creates one if none exists.
 */
async function ensureSession(): Promise<string> {
  const data = await chrome.storage.session.get(['sessionId']);
  if (data.sessionId) {
    return data.sessionId as string;
  }

  const sessionId = generateSessionId();
  await chrome.storage.session.set({
    sessionId,
    eventCount: 0,
    isActive: true,
    startedAt: new Date().toISOString(),
  });

  console.log(`[Visual AI] New session started: ${sessionId}`);
  return sessionId;
}

// ─── Message Handler ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: StatusResponse | { received: boolean }) => void
  ): boolean => {
    // Wrap in async IIFE — onMessage requires `return true` for async responses
    (async () => {
      try {
        switch (message.type) {
          case 'PAGE_LOADED': {
            const sessionId = await ensureSession();

            // Increment event count
            const data = await chrome.storage.session.get(['eventCount']);
            const eventCount = ((data.eventCount as number) || 0) + 1;
            await chrome.storage.session.set({ eventCount });

            console.log(
              `[Visual AI] PAGE_LOADED | session=${sessionId} | url=${message.data.url} | count=${eventCount}`
            );

            sendResponse({ received: true });
            break;
          }

          case 'GET_STATUS': {
            const sessionId = await ensureSession();
            const data = await chrome.storage.session.get([
              'isActive',
              'eventCount',
            ]);

            const response: StatusResponse = {
              isActive: (data.isActive as boolean) ?? true,
              sessionId,
              eventCount: (data.eventCount as number) || 0,
            };

            sendResponse(response);
            break;
          }

          default: {
            console.warn(
              `[Visual AI] Unknown message type: ${(message as ExtensionMessage).type}`
            );
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

// ─── Lifecycle ───────────────────────────────────────────────────────────────

// Initialize session when service worker starts
chrome.runtime.onInstalled.addListener(async () => {
  const sessionId = await ensureSession();
  console.log(`[Visual AI] Extension installed. Session: ${sessionId}`);
});

// Also ensure session on service worker startup (after idle termination)
(async () => {
  await ensureSession();
})();
