import type { ActivityEvent } from '@visual-ai/shared-types';
import type { EventQueryParams, PaginatedEventsResult } from '../types/index.js';
import type { EventStore } from './event-store.interface.js';

/**
 * In-memory implementation of the EventStore interface.
 */
export class InMemoryEventStore implements EventStore {
  private events: ActivityEvent[] = [];
  private eventsBySession: Map<string, ActivityEvent[]> = new Map();

  public async add(event: ActivityEvent): Promise<ActivityEvent> {
    this.events.push(event);

    const sessionList = this.eventsBySession.get(event.sessionId) || [];
    sessionList.push(event);
    this.eventsBySession.set(event.sessionId, sessionList);

    return event;
  }

  public async addBatch(eventsList: ActivityEvent[]): Promise<ActivityEvent[]> {
    const added: ActivityEvent[] = [];
    for (const event of eventsList) {
      added.push(await this.add(event));
    }
    return added;
  }

  public async query(params: EventQueryParams): Promise<PaginatedEventsResult> {
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

  public async getBySession(sessionId: string, limit: number = 100, offset: number = 0): Promise<PaginatedEventsResult> {
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

  public clear(): void {
    this.events = [];
    this.eventsBySession.clear();
  }
}
