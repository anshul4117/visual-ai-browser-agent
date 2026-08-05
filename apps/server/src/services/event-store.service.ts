import type { ActivityEvent } from '@visual-ai/shared-types';
import type { EventQueryParams, PaginatedEventsResult } from '../types/index.js';
import type { EventStore } from './event-store.interface.js';
import { InMemoryEventStore } from './in-memory-event-store.js';
import { MongoEventStore } from './mongo-event-store.js';
import { isDatabaseConnected } from '../database/connection.js';

export * from './event-store.interface.js';
export * from './in-memory-event-store.js';
export * from './mongo-event-store.js';

/**
 * Delegating EventStore implementation.
 *
 * Automatically delegates to MongoEventStore when MongoDB is connected,
 * or falls back to InMemoryEventStore when database is offline/unconnected.
 */
class DelegatingEventStore implements EventStore {
  private inMemoryStore = new InMemoryEventStore();
  private mongoStore = new MongoEventStore();

  /**
   * Get the active storage strategy based on database connection state.
   */
  private getActiveStore(): EventStore {
    if (isDatabaseConnected()) {
      return this.mongoStore;
    }
    return this.inMemoryStore;
  }

  public async add(event: ActivityEvent): Promise<ActivityEvent> {
    return this.getActiveStore().add(event);
  }

  public async addBatch(events: ActivityEvent[]): Promise<ActivityEvent[]> {
    return this.getActiveStore().addBatch(events);
  }

  public async getBySession(sessionId: string, limit?: number, offset?: number): Promise<PaginatedEventsResult> {
    return this.getActiveStore().getBySession(sessionId, limit, offset);
  }

  public async query(params: EventQueryParams): Promise<PaginatedEventsResult> {
    return this.getActiveStore().query(params);
  }
}

/**
 * Singleton instance of EventStore used by controllers.
 */
export const eventStore: EventStore = new DelegatingEventStore();
