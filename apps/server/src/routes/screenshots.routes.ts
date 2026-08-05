import { Router } from 'express';
import {
  createScreenshot,
  getScreenshots,
  getLatestScreenshot,
} from '../controllers/screenshots.controller.js';

const router = Router();

router.post('/screenshots', createScreenshot);
router.get('/screenshots', getScreenshots);
router.get('/screenshots/latest', getLatestScreenshot);

export default router;
