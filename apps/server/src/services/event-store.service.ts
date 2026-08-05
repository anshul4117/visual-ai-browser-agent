import type { ActivityEvent } from '@visual-ai/shared-types';
import type { EventQueryParams, PaginatedEventsResult } from '../types/index.js';

/**
 * In-memory append-only event store service.
 *
 * Preserves event ordering in a master timeline array while maintaining
 * an index map grouped by sessionId for fast retrieval.
 */
export class EventStoreService {
  private static instance: EventStoreService;

  /** Master timeline of all events (append-only) */
  private events: ActivityEvent[] = [];

  /** Events indexed by sessionId */
  private eventsBySession: Map<string, ActivityEvent[]> = new Map();

  private constructor() {}

  /**
   * Get singleton instance of EventStoreService.
   */
  public static getInstance(): EventStoreService {
    if (!EventStoreService.instance) {
      EventStoreService.instance = new EventStoreService();
    }
    return EventStoreService.instance;
  }

  /**
   * Add a single event to the in-memory store.
   */
  public addEvent(event: ActivityEvent): ActivityEvent {
    this.events.push(event);

    const sessionList = this.eventsBySession.get(event.sessionId) || [];
    sessionList.push(event);
    this.eventsBySession.set(event.sessionId, sessionList);

    return event;
  }

  /**
   * Add a batch of events to the in-memory store.
   */
  public addBatch(eventsList: ActivityEvent[]): ActivityEvent[] {
    const added: ActivityEvent[] = [];
    for (const event of eventsList) {
      added.push(this.addEvent(event));
    }
    return added;
  }

  /**
   * Query events with filtering and pagination.
   */
  public queryEvents(params: EventQueryParams): PaginatedEventsResult {
    let filtered = [...this.events];

    if (params.sessionId) {
      filtered = filtered.filter((e) => e.sessionId === params.sessionId);
    }

    if (params.eventType) {
      filtered = filtered.filter((e) => e.eventType === params.eventType);
    }

    if (params.url) {
      const searchUrl = params.url.toLowerCase();
      filtered = filtered.filter((e) => e.url.toLowerCase().includes(searchUrl));
    }

    if (params.from) {
      const fromTime = new Date(params.from).getTime();
      if (!isNaN(fromTime)) {
        filtered = filtered.filter((e) => new Date(e.timestamp).getTime() >= fromTime);
      }
    }

    if (params.to) {
      const toTime = new Date(params.to).getTime();
      if (!isNaN(toTime)) {
        filtered = filtered.filter((e) => new Date(e.timestamp).getTime() <= toTime);
      }
    }

    const total = filtered.length;
    const limit = Math.min(Math.max(params.limit || 100, 1), 1000);
    const offset = Math.max(params.offset || 0, 0);

    const paginatedData = filtered.slice(offset, offset + limit);

    return {
      data: paginatedData,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get all events for a specific session ID with optional pagination.
   */
  public getBySessionId(sessionId: string, limit: number = 100, offset: number = 0): PaginatedEventsResult {
    const sessionEvents = this.eventsBySession.get(sessionId) || [];
    const total = sessionEvents.length;

    const safeLimit = Math.min(Math.max(limit, 1), 1000);
    const safeOffset = Math.max(offset, 0);

    const paginatedData = sessionEvents.slice(safeOffset, safeOffset + safeLimit);

    return {
      data: paginatedData,
      total,
      limit: safeLimit,
      offset: safeOffset,
    };
  }

  /**
   * Reset store (primarily for unit testing).
   */
  public clear(): void {
    this.events = [];
    this.eventsBySession.clear();
  }
}

export const eventStore = EventStoreService.getInstance();
