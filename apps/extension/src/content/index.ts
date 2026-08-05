/**
 * Content Script
 *
 * Injected into all pages at document_idle.
 * Currently sends a simple PAGE_LOADED event to the background worker.
 *
 * Phase 2 will add: click, scroll, form interaction tracking.
 *
 * IMPORTANT (from AGENT.md):
 * - Must not block the main thread
 * - Batch DOM reads with requestAnimationFrame
 * - Use chrome.runtime.sendMessage to communicate with background
 */

import type { PageLoadedMessage } from '../messaging/types.js';

/**
 * Send a PAGE_LOADED event to the background service worker.
 */
function notifyPageLoaded(): void {
  const message: PageLoadedMessage = {
    type: 'PAGE_LOADED',
    data: {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString(),
    },
  };

  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      // Extension context may be invalidated — this is expected on extension reload
      console.debug(
        '[Visual AI] Could not send PAGE_LOADED:',
        chrome.runtime.lastError.message
      );
      return;
    }
    console.debug('[Visual AI] PAGE_LOADED sent, response:', response);
  });
}

// ─── Initialize ──────────────────────────────────────────────────────────────

// Send PAGE_LOADED when content script is injected (document_idle)
notifyPageLoaded();
