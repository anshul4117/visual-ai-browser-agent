/**
 * Event Logger
 *
 * Reusable module for creating and persisting structured activity events.
 * Stores events in chrome.storage.local as an append-only timeline.
 *
 * IMPORTANT (from AGENT.md):
 * - No global state — all state in chrome.storage
 * - Event fields must match docs/database.md
 */

import type { StoredEvent } from '../messaging/types.js';

// ─── Storage Keys ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'vai_events';
const MAX_STORED_EVENTS = 10000;

// ─── Event Creation ──────────────────────────────────────────────────────────

/**
 * Build a structured event object ready for storage.
 * All parameters map directly to docs/database.md fields.
 */
export function createEvent(params: {
  sessionId: string;
  url: string;
  title: string;
  eventType: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}): StoredEvent {
  return {
    sessionId: params.sessionId,
    url: params.url,
    title: params.title,
    eventType: params.eventType,
    timestamp: params.timestamp,
    metadata: params.metadata,
  };
}

// ─── Storage Operations ──────────────────────────────────────────────────────

/**
 * Append an event to the stored timeline in chrome.storage.local.
 * Trims oldest events if the timeline exceeds MAX_STORED_EVENTS.
 *
 * Returns the new total event count.
 */
export async function appendEvent(event: StoredEvent): Promise<number> {
  const data = await chrome.storage.local.get([STORAGE_KEY]);
  const events: StoredEvent[] = (data[STORAGE_KEY] as StoredEvent[] | undefined) || [];

  events.push(event);

  // Trim oldest if over limit
  if (events.length > MAX_STORED_EVENTS) {
    events.splice(0, events.length - MAX_STORED_EVENTS);
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: events });
  return events.length;
}

/**
 * Retrieve all stored events.
 */
export async function getStoredEvents(): Promise<StoredEvent[]> {
  const data = await chrome.storage.local.get([STORAGE_KEY]);
  return (data[STORAGE_KEY] as StoredEvent[] | undefined) || [];
}

/**
 * Get the count of stored events without loading all data.
 */
export async function getEventCount(): Promise<number> {
  const events = await getStoredEvents();
  return events.length;
}

/**
 * Get the most recently stored event (last in the timeline).
 */
export async function getLastEvent(): Promise<StoredEvent | null> {
  const events = await getStoredEvents();
  return events.length > 0 ? events[events.length - 1]! : null;
}

/**
 * Clear all stored events.
 */
export async function clearEvents(): Promise<void> {
  await chrome.storage.local.remove([STORAGE_KEY]);
}
