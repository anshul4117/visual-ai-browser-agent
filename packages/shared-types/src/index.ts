/**
 * @visual-ai/shared-types
 *
 * Shared TypeScript interfaces for the Visual AI Browser Agent.
 * These types are the contract between the Chrome extension and the backend server.
 *
 * All fields must match docs/database.md — do not add undocumented fields.
 */

// ─── Event Types ─────────────────────────────────────────────────────────────

/**
 * All supported activity event types.
 * Matches docs/database.md eventType field.
 */
export type EventType =
  | 'session_started'
  | 'page_load'
  | 'url_change'
  | 'tab_switch'
  | 'click'
  | 'scroll'
  | 'form_interaction'
  | 'visibility_changed'
  | 'time_on_page';

/**
 * Metadata varies by event type.
 * Each event type may attach different contextual data.
 */
export interface EventMetadata {
  /** CSS selector of the interacted element (click, form) */
  selector?: string;
  /** Tag name of the interacted element */
  tagName?: string;
  /** Inner text of the clicked element (truncated) */
  innerText?: string;
  /** Scroll position as percentage */
  scrollPercentage?: number;
  /** Document visibility state */
  visibilityState?: string;
  /** Duration in milliseconds (time_on_page) */
  duration?: number;
  /** Previous URL (url_change) */
  previousUrl?: string;
  /** Previous tab ID (tab_switch) */
  previousTabId?: number;
  /** Form field name (form_interaction) */
  fieldName?: string;
  /** Form field type (form_interaction) */
  fieldType?: string;
}

// ─── Activity Event ──────────────────────────────────────────────────────────

/**
 * A single browser activity event.
 * Matches docs/database.md events collection.
 */
export interface ActivityEvent {
  /** Unique session identifier */
  sessionId: string;
  /** Optional user identifier */
  userId?: string;
  /** URL where the event occurred */
  url: string;
  /** Page title */
  title: string;
  /** Type of activity event */
  eventType: EventType;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Additional event-specific metadata */
  metadata: EventMetadata;
}

// ─── Session ─────────────────────────────────────────────────────────────────

/**
 * A browsing session.
 * Matches docs/database.md sessions collection.
 */
export interface Session {
  /** Unique session identifier */
  sessionId: string;
  /** ISO 8601 timestamp — session start */
  startedAt: string;
  /** ISO 8601 timestamp — session end (null if active) */
  endedAt: string | null;
  /** Session duration in milliseconds */
  duration: number;
}

// ─── Screenshot / Visual Context ──────────────────────────────────────────────

/**
 * Visual context screenshot object.
 * Matches docs/database.md screenshots collection.
 */
export interface ScreenshotRecord {
  screenshotId: string;
  sessionId: string;
  eventId?: string;
  url: string;
  title: string;
  capturedAt: string;
  filePath: string;
  width?: number;
  height?: number;
}

/**
 * Request payload for POST /api/screenshots
 */
export interface CreateScreenshotRequest {
  screenshotId: string;
  sessionId: string;
  eventId?: string;
  url: string;
  title: string;
  capturedAt: string;
  dataUrl: string;
  width?: number;
  height?: number;
}

// ─── API Contracts ───────────────────────────────────────────────────────────

/**
 * Request body for POST /api/events
 * Matches docs/api-spec.md
 */
export interface CreateEventRequest {
  sessionId: string;
  url: string;
  title: string;
  eventType: EventType;
  timestamp: string;
  metadata: EventMetadata;
}

/**
 * Standard API success response.
 */
export interface ApiSuccessResponse {
  success: true;
}

/**
 * Standard API error response.
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
}

/**
 * Health check response for GET /api/health
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
}
