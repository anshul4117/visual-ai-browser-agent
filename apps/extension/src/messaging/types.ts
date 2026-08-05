/**
 * Messaging layer for communication between extension components.
 *
 * Defines a typed message protocol for content script ↔ background service worker
 * communication.
 *
 * All messages use chrome.runtime.sendMessage / chrome.runtime.onMessage.
 */

// ─── Message Types ───────────────────────────────────────────────────────────

/**
 * All supported message types in the extension.
 */
export type MessageType =
  | 'PAGE_LOADED'
  | 'CLICK'
  | 'SCROLL'
  | 'VISIBILITY_CHANGED'
  | 'GET_STATUS'
  | 'CLEAR_EVENTS'
  | 'EXPORT_EVENTS';

/**
 * Base message structure.
 * Every message sent between extension components must extend this.
 */
export interface BaseMessage {
  type: MessageType;
}

// ─── Content → Background Messages ──────────────────────────────────────────

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
 * Sent by the content script when the user clicks an element.
 */
export interface ClickMessage extends BaseMessage {
  type: 'CLICK';
  data: {
    url: string;
    title: string;
    timestamp: string;
    selector: string;
    tagName: string;
    innerText: string;
  };
}

/**
 * Sent by the content script when the user scrolls (throttled).
 */
export interface ScrollMessage extends BaseMessage {
  type: 'SCROLL';
  data: {
    url: string;
    title: string;
    timestamp: string;
    scrollPercentage: number;
  };
}

/**
 * Sent by the content script when page visibility changes.
 */
export interface VisibilityChangedMessage extends BaseMessage {
  type: 'VISIBILITY_CHANGED';
  data: {
    url: string;
    title: string;
    timestamp: string;
    visibilityState: string;
  };
}

// ─── Popup → Background Messages ────────────────────────────────────────────

/**
 * Sent by the popup to request current extension status.
 */
export interface GetStatusMessage extends BaseMessage {
  type: 'GET_STATUS';
}

/**
 * Sent by the popup to clear all stored events.
 */
export interface ClearEventsMessage extends BaseMessage {
  type: 'CLEAR_EVENTS';
}

/**
 * Sent by the popup to export all stored events as JSON.
 */
export interface ExportEventsMessage extends BaseMessage {
  type: 'EXPORT_EVENTS';
}

/**
 * Union of all possible messages.
 */
export type ExtensionMessage =
  | PageLoadedMessage
  | ClickMessage
  | ScrollMessage
  | VisibilityChangedMessage
  | GetStatusMessage
  | ClearEventsMessage
  | ExportEventsMessage;

// ─── Response Types ──────────────────────────────────────────────────────────

/**
 * Response to GET_STATUS message.
 */
export interface StatusResponse {
  isActive: boolean;
  sessionId: string;
  eventCount: number;
  lastEventType: string | null;
}

/**
 * Response to CLEAR_EVENTS message.
 */
export interface ClearEventsResponse {
  success: boolean;
}

/**
 * Response to EXPORT_EVENTS message.
 */
export interface ExportEventsResponse {
  success: boolean;
  data: StoredEvent[];
}

/**
 * Acknowledgment response for content script messages.
 */
export interface AckResponse {
  received: boolean;
}

// ─── Stored Event ────────────────────────────────────────────────────────────

/**
 * The shape of an event stored in chrome.storage.local.
 * Matches the structure destined for docs/database.md events collection.
 */
export interface StoredEvent {
  /** Unique session identifier */
  sessionId: string;
  /** URL where the event occurred */
  url: string;
  /** Page title at time of event */
  title: string;
  /** Event type — maps to database eventType enum */
  eventType: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Event-specific metadata */
  metadata: Record<string, unknown>;
}
