import { Router } from 'express';
import {
  getOverview,
  getSessions,
  getEvents,
  getScreenshots,
  getAnalytics,
} from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/overview', getOverview);
router.get('/sessions', getSessions);
router.get('/events', getEvents);
router.get('/screenshots', getScreenshots);
router.get('/analytics', getAnalytics);

export default router;
