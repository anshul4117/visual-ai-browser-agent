/**
 * Messaging layer for communication between extension components.
 *
 * Defines a typed message protocol for content script ↔ background ↔ popup.
 */

import type { ActivityEvent, CreateScreenshotRequest, ScreenshotAnalysisRecord } from '@visual-ai/shared-types';

// ─── Message Types ───────────────────────────────────────────────────────────

export type MessageType =
  | 'PAGE_LOADED'
  | 'CLICK'
  | 'SCROLL'
  | 'VISIBILITY_CHANGED'
  | 'GET_STATUS'
  | 'GET_SYNC_STATUS'
  | 'GET_LATEST_SCREENSHOT'
  | 'ANALYZE_LATEST'
  | 'SYNC_NOW'
  | 'SET_BACKEND_URL'
  | 'CLEAR_EVENTS'
  | 'EXPORT_EVENTS';

export interface BaseMessage {
  type: MessageType;
}

// ─── Content → Background Messages ──────────────────────────────────────────

export interface PageLoadedMessage extends BaseMessage {
  type: 'PAGE_LOADED';
  data: {
    url: string;
    title: string;
    timestamp: string;
  };
}

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

export interface ScrollMessage extends BaseMessage {
  type: 'SCROLL';
  data: {
    url: string;
    title: string;
    timestamp: string;
    scrollPercentage: number;
  };
}

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

export interface GetStatusMessage extends BaseMessage {
  type: 'GET_STATUS';
}

export interface GetSyncStatusMessage extends BaseMessage {
  type: 'GET_SYNC_STATUS';
}

export interface GetLatestScreenshotMessage extends BaseMessage {
  type: 'GET_LATEST_SCREENSHOT';
}

export interface AnalyzeLatestMessage extends BaseMessage {
  type: 'ANALYZE_LATEST';
}

export interface SyncNowMessage extends BaseMessage {
  type: 'SYNC_NOW';
}

export interface SetBackendUrlMessage extends BaseMessage {
  type: 'SET_BACKEND_URL';
  url: string;
}

export interface ClearEventsMessage extends BaseMessage {
  type: 'CLEAR_EVENTS';
}

export interface ExportEventsMessage extends BaseMessage {
  type: 'EXPORT_EVENTS';
}

export type ExtensionMessage =
  | PageLoadedMessage
  | ClickMessage
  | ScrollMessage
  | VisibilityChangedMessage
  | GetStatusMessage
  | GetSyncStatusMessage
  | GetLatestScreenshotMessage
  | AnalyzeLatestMessage
  | SyncNowMessage
  | SetBackendUrlMessage
  | ClearEventsMessage
  | ExportEventsMessage;

// ─── Response Types ──────────────────────────────────────────────────────────

export type ConnectionStatus = 'connected' | 'syncing' | 'offline' | 'error';

export interface StatusResponse {
  isActive: boolean;
  sessionId: string;
  eventCount: number;
  lastEventType: string | null;
  connectionStatus: ConnectionStatus;
  queuedCount: number;
  lastSyncTime: string | null;
  backendUrl: string;
  screenshotCount: number;
  lastCaptureTime: string | null;
  latestScreenshotDataUrl: string | null;
  latestAnalysis: ScreenshotAnalysisRecord | null;
}

export interface GetLatestScreenshotResponse {
  success: boolean;
  screenshot: CreateScreenshotRequest | null;
}

export interface AnalyzeLatestResponse {
  success: boolean;
  analysis: ScreenshotAnalysisRecord | null;
  error?: string;
}

export interface SyncResponse {
  success: boolean;
  syncedCount: number;
  error?: string;
}

export interface SetBackendUrlResponse {
  success: boolean;
  url: string;
}

export interface ClearEventsResponse {
  success: boolean;
}

export interface ExportEventsResponse {
  success: boolean;
  data: StoredEvent[];
}

export interface AckResponse {
  received: boolean;
}

// ─── Stored Event ────────────────────────────────────────────────────────────

export type StoredEvent = ActivityEvent;
