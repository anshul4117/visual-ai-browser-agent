import type { ActivityEvent } from '@visual-ai/shared-types';
import type { EventQueryParams, PaginatedEventsResult } from '../types/index.js';

/**
 * Storage abstraction interface for managing activity events.
 * Enables polymorphic storage strategies (InMemory, MongoDB, etc.).
 */
export interface EventStore {
  /**
   * Store a single activity event.
   */
  add(event: ActivityEvent): Promise<ActivityEvent>;

  /**
   * Store a batch of activity events efficiently.
   */
  addBatch(events: ActivityEvent[]): Promise<ActivityEvent[]>;

  /**
   * Retrieve events for a specific session ID with pagination.
   */
  getBySession(sessionId: string, limit?: number, offset?: number): Promise<PaginatedEventsResult>;

  /**
   * Query events with filtering and pagination.
   */
  query(params: EventQueryParams): Promise<PaginatedEventsResult>;
}
