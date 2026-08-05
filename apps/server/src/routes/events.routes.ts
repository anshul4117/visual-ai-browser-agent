import { Router } from 'express';
import {
  createEvent,
  createBatchEvents,
  getEvents,
  getEventsBySession,
} from '../controllers/events.controller.js';
import {
  validateSingleEvent,
  validateBatchEvents,
} from '../middleware/validate.middleware.js';

const router = Router();

// Single event creation
router.post('/events', validateSingleEvent, createEvent);

// Batch events creation
router.post('/events/batch', validateBatchEvents, createBatchEvents);

// Query events with filters
router.get('/events', getEvents);

// Get events for a specific session ID
router.get('/events/:sessionId', getEventsBySession);

export default router;
