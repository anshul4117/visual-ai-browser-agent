/**
 * Messaging layer for communication between extension components.
 *
 * Defines a typed message protocol for content script ↔ background service worker
 * communication. Extensible for future event types (Phase 2+).
 *
 * All messages use chrome.runtime.sendMessage / chrome.runtime.onMessage.
 */

// ─── Message Types ───────────────────────────────────────────────────────────

/**
 * All supported message types in the extension.
 * Add new types here as the extension grows.
 */
export type MessageType =
  | 'PAGE_LOADED'
  | 'GET_STATUS';

/**
 * Base message structure.
 * Every message sent between extension components must extend this.
 */
export interface BaseMessage {
  type: MessageType;
}

/**
 * Sent by the content script when a page finishes loading.
 */
export interface PageLoadedMessage extends BaseMessage {
  type: 'PAGE_LOADED';
  data: {
    url: string;
    title: string;
    timestamp: string;
  };
}

/**
 * Sent by the popup to request current extension status.
 */
export interface GetStatusMessage extends BaseMessage {
  type: 'GET_STATUS';
}

/**
 * Union of all possible messages.
 */
export type ExtensionMessage =
  | PageLoadedMessage
  | GetStatusMessage;

// ─── Response Types ──────────────────────────────────────────────────────────

/**
 * Response to GET_STATUS message.
 */
export interface StatusResponse {
  isActive: boolean;
  sessionId: string;
  eventCount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Type-safe wrapper to send a message to the background service worker.
 * Returns a promise that resolves with the response.
 */
export async function sendMessageToBackground<T>(
  message: ExtensionMessage
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
