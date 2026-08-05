import { Router } from 'express';
import {
  getAnalysisByScreenshotIdHandler,
  getAnalysesBySessionIdHandler,
  triggerAnalysisHandler,
} from '../controllers/analysis.controller.js';

const router = Router();

router.get('/analysis/session/:sessionId', getAnalysesBySessionIdHandler);
router.get('/analysis/:screenshotId', getAnalysisByScreenshotIdHandler);
router.post('/analysis/trigger/:screenshotId', triggerAnalysisHandler);

export default router;
