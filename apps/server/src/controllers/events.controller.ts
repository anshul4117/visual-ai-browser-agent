import type { Request, Response, NextFunction } from 'express';
import type { ActivityEvent, ApiSuccessResponse } from '@visual-ai/shared-types';
import { eventStore } from '../services/event-store.service.js';
import type { EventQueryParams } from '../types/index.js';

/**
 * Controller for creating a single event.
 * POST /api/events
 */
export function createEvent(req: Request, res: Response, next: NextFunction): void {
  try {
    const event: ActivityEvent = req.body;
    eventStore.addEvent(event);

    const response: ApiSuccessResponse = {
      success: true,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for creating a batch of events.
 * POST /api/events/batch
 */
export function createBatchEvents(req: Request, res: Response, next: NextFunction): void {
  try {
    const events: ActivityEvent[] = req.body;
    const added = eventStore.addBatch(events);

    res.status(201).json({
      success: true,
      count: added.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for querying events with filters and pagination.
 * GET /api/events
 */
export function getEvents(req: Request, res: Response, next: NextFunction): void {
  try {
    const params: EventQueryParams = {
      sessionId: req.query.sessionId as string | undefined,
      eventType: req.query.eventType as string | undefined,
      url: req.query.url as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
    };

    const result = eventStore.queryEvents(params);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for retrieving events for a specific session ID.
 * GET /api/events/:sessionId
 */
export function getEventsBySession(req: Request, res: Response, next: NextFunction): void {
  try {
    const { sessionId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Missing required parameter: sessionId',
      });
      return;
    }

    const result = eventStore.getBySessionId(sessionId, limit, offset);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}
