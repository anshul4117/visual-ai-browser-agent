import type { Request, Response, NextFunction } from 'express';
import type { ActivityEvent, ApiErrorResponse } from '@visual-ai/shared-types';
import { AppError } from './error.middleware.js';

/**
 * Validate that an object conforms to the ActivityEvent interface.
 */
export function validateEventPayload(data: unknown): ActivityEvent {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new AppError('Event payload must be a valid JSON object', 400);
  }

  const obj = data as Record<string, unknown>;

  if (!obj.sessionId || typeof obj.sessionId !== 'string' || obj.sessionId.trim() === '') {
    throw new AppError('Missing or invalid required field: sessionId', 400);
  }

  if (typeof obj.url !== 'string') {
    throw new AppError('Missing or invalid required field: url (must be string)', 400);
  }

  if (typeof obj.title !== 'string') {
    throw new AppError('Missing or invalid required field: title (must be string)', 400);
  }

  if (!obj.eventType || typeof obj.eventType !== 'string' || obj.eventType.trim() === '') {
    throw new AppError('Missing or invalid required field: eventType', 400);
  }

  if (!obj.timestamp || typeof obj.timestamp !== 'string') {
    throw new AppError('Missing or invalid required field: timestamp', 400);
  }

  const parsedDate = new Date(obj.timestamp);
  if (isNaN(parsedDate.getTime())) {
    throw new AppError(`Invalid timestamp format: ${obj.timestamp} (must be valid ISO 8601 string)`, 400);
  }

  if (obj.metadata !== undefined && (typeof obj.metadata !== 'object' || obj.metadata === null || Array.isArray(obj.metadata))) {
    throw new AppError('Invalid field: metadata (must be an object)', 400);
  }

  return {
    sessionId: obj.sessionId,
    userId: typeof obj.userId === 'string' ? obj.userId : undefined,
    url: obj.url,
    title: obj.title,
    eventType: obj.eventType as ActivityEvent['eventType'],
    timestamp: obj.timestamp,
    metadata: (obj.metadata as ActivityEvent['metadata']) || {},
  };
}

/**
 * Middleware to validate single event creation requests (POST /api/events).
 */
export function validateSingleEvent(req: Request, _res: Response, next: NextFunction): void {
  try {
    const validatedEvent = validateEventPayload(req.body);
    req.body = validatedEvent;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to validate batch event creation requests (POST /api/events/batch).
 */
export function validateBatchEvents(req: Request, res: Response, next: NextFunction): void {
  try {
    const body = req.body;

    let rawEvents: unknown[];
    if (Array.isArray(body)) {
      rawEvents = body;
    } else if (body && typeof body === 'object' && Array.isArray(body.events)) {
      rawEvents = body.events;
    } else {
      const errorResp: ApiErrorResponse = {
        success: false,
        error: 'Batch payload must be an array of events or an object with an "events" array property',
      };
      res.status(400).json(errorResp);
      return;
    }

    if (rawEvents.length === 0) {
      const errorResp: ApiErrorResponse = {
        success: false,
        error: 'Batch array cannot be empty',
      };
      res.status(400).json(errorResp);
      return;
    }

    const validatedEvents: ActivityEvent[] = [];
    for (let i = 0; i < rawEvents.length; i++) {
      try {
        validatedEvents.push(validateEventPayload(rawEvents[i]));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid event object';
        throw new AppError(`Event at index ${i} is invalid: ${msg}`, 400);
      }
    }

    req.body = validatedEvents;
    next();
  } catch (error) {
    next(error);
  }
}
