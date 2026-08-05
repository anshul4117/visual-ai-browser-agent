import type { ActivityEvent } from '@visual-ai/shared-types';
import type { EventQueryParams, PaginatedEventsResult } from '../types/index.js';
import type { EventStore } from './event-store.interface.js';
import { EventModel, type IEventDocument } from '../models/event.model.js';
import { SessionModel } from '../models/session.model.js';

/**
 * MongoDB-backed implementation of the EventStore interface using Mongoose.
 */
export class MongoEventStore implements EventStore {
  /**
   * Helper to format a Mongoose document to clean ActivityEvent.
   */
  private formatDocument(doc: IEventDocument): ActivityEvent {
    return {
      sessionId: doc.sessionId,
      userId: doc.userId || undefined,
      url: doc.url,
      title: doc.title,
      eventType: doc.eventType as ActivityEvent['eventType'],
      timestamp: doc.timestamp instanceof Date ? doc.timestamp.toISOString() : doc.timestamp,
      metadata: doc.metadata || {},
    };
  }

  /**
   * Upsert session metadata whenever events are added.
   */
  private async updateSessionMetadata(sessionId: string, timestampISO: string, incrementCount: number = 1): Promise<void> {
    const eventTime = new Date(timestampISO);

    await SessionModel.findOneAndUpdate(
      { sessionId },
      {
        $setOnInsert: { startedAt: eventTime },
        $set: { lastSeenAt: eventTime },
        $inc: { eventCount: incrementCount },
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Store a single activity event in MongoDB.
   */
  public async add(event: ActivityEvent): Promise<ActivityEvent> {
    const doc = new EventModel({
      sessionId: event.sessionId,
      userId: event.userId,
      url: event.url,
      title: event.title,
      eventType: event.eventType,
      timestamp: new Date(event.timestamp),
      metadata: event.metadata || {},
    });

    const savedDoc = await doc.save();
    await this.updateSessionMetadata(event.sessionId, event.timestamp, 1);

    return this.formatDocument(savedDoc);
  }

  /**
   * Store a batch of activity events using efficient insertMany.
   */
  public async addBatch(eventsList: ActivityEvent[]): Promise<ActivityEvent[]> {
    if (eventsList.length === 0) return [];

    const documents = eventsList.map((e) => ({
      sessionId: e.sessionId,
      userId: e.userId,
      url: e.url,
      title: e.title,
      eventType: e.eventType,
      timestamp: new Date(e.timestamp),
      metadata: e.metadata || {},
    }));

    const savedDocs = await EventModel.insertMany(documents, { ordered: false });

    // Group counts by sessionId for bulk session metadata update
    const sessionCounts = new Map<string, { count: number; lastTimestamp: string }>();

    for (const e of eventsList) {
      const existing = sessionCounts.get(e.sessionId);
      if (!existing) {
        sessionCounts.set(e.sessionId, { count: 1, lastTimestamp: e.timestamp });
      } else {
        existing.count += 1;
        if (new Date(e.timestamp) > new Date(existing.lastTimestamp)) {
          existing.lastTimestamp = e.timestamp;
        }
      }
    }

    for (const [sessionId, data] of sessionCounts.entries()) {
      await this.updateSessionMetadata(sessionId, data.lastTimestamp, data.count);
    }

    return (savedDocs as unknown as IEventDocument[]).map((doc) => this.formatDocument(doc));
  }

  /**
   * Query events with filtering and pagination from MongoDB.
   */
  public async query(params: EventQueryParams): Promise<PaginatedEventsResult> {
    const filter: Record<string, unknown> = {};

    if (params.sessionId) {
      filter.sessionId = params.sessionId;
    }

    if (params.eventType) {
      filter.eventType = params.eventType;
    }

    if (params.url) {
      filter.url = { $regex: params.url, $options: 'i' };
    }

    if (params.from || params.to) {
      const timestampFilter: Record<string, Date> = {};
      if (params.from) {
        const fromDate = new Date(params.from);
        if (!isNaN(fromDate.getTime())) timestampFilter.$gte = fromDate;
      }
      if (params.to) {
        const toDate = new Date(params.to);
        if (!isNaN(toDate.getTime())) timestampFilter.$lte = toDate;
      }
      if (Object.keys(timestampFilter).length > 0) {
        filter.timestamp = timestampFilter;
      }
    }

    const limit = Math.min(Math.max(params.limit || 100, 1), 1000);
    const offset = Math.max(params.offset || 0, 0);

    const [docs, total] = await Promise.all([
      EventModel.find(filter).sort({ timestamp: -1 }).skip(offset).limit(limit).exec(),
      EventModel.countDocuments(filter).exec(),
    ]);

    return {
      data: docs.map((doc) => this.formatDocument(doc)),
      total,
      limit,
      offset,
    };
  }

  /**
   * Retrieve events for a specific session ID with pagination.
   */
  public async getBySession(sessionId: string, limit: number = 100, offset: number = 0): Promise<PaginatedEventsResult> {
    const safeLimit = Math.min(Math.max(limit, 1), 1000);
    const safeOffset = Math.max(offset, 0);

    const filter = { sessionId };

    const [docs, total] = await Promise.all([
      EventModel.find(filter).sort({ timestamp: -1 }).skip(safeOffset).limit(safeLimit).exec(),
      EventModel.countDocuments(filter).exec(),
    ]);

    return {
      data: docs.map((doc) => this.formatDocument(doc)),
      total,
      limit: safeLimit,
      offset: safeOffset,
    };
  }
}
