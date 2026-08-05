/**
 * Event Logger & Offline Storage Queue
 *
 * Manages the temporary offline event queue in chrome.storage.local.
 * Events are queued locally and removed upon successful synchronization to the backend.
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
    eventType: params.eventType as StoredEvent['eventType'],
    timestamp: params.timestamp,
    metadata: params.metadata,
  };
}

// ─── Storage Operations ──────────────────────────────────────────────────────

/**
 * Append an event to the offline queue in chrome.storage.local.
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
 * Retrieve all queued events.
 */
export async function getStoredEvents(): Promise<StoredEvent[]> {
  const data = await chrome.storage.local.get([STORAGE_KEY]);
  return (data[STORAGE_KEY] as StoredEvent[] | undefined) || [];
}

/**
 * Remove specific synced events from the offline queue.
 * Matches events by unique composite key: sessionId + timestamp + eventType + url.
 */
export async function removeEvents(syncedEvents: StoredEvent[]): Promise<number> {
  if (syncedEvents.length === 0) return await getEventCount();

  const currentEvents = await getStoredEvents();
  const syncedSet = new Set(
    syncedEvents.map((e) => `${e.sessionId}|${e.timestamp}|${e.eventType}|${e.url}`)
  );

  const remainingEvents = currentEvents.filter(
    (e) => !syncedSet.has(`${e.sessionId}|${e.timestamp}|${e.eventType}|${e.url}`)
  );

  await chrome.storage.local.set({ [STORAGE_KEY]: remainingEvents });
  return remainingEvents.length;
}

/**
 * Get the count of stored events in queue.
 */
export async function getEventCount(): Promise<number> {
  const events = await getStoredEvents();
  return events.length;
}

/**
 * Get the most recently stored event.
 */
export async function getLastEvent(): Promise<StoredEvent | null> {
  const events = await getStoredEvents();
  return events.length > 0 ? events[events.length - 1]! : null;
}

/**
 * Clear all stored events from queue.
 */
export async function clearEvents(): Promise<void> {
  await chrome.storage.local.remove([STORAGE_KEY]);
}
