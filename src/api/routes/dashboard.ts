import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';

const router = Router();

router.get('/', dashboardController.getDashboard);

router.get('/mission', dashboardController.getMission);

router.get('/phase', dashboardController.getStudyPhase);

export default router;