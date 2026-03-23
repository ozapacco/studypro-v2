import { Router } from 'express';
import * as statsController from '../controllers/statsController';

const router = Router();

router.get('/overview', statsController.getOverview);

router.get('/subjects', statsController.getSubjectStats);

router.get('/evolution/:subject', statsController.getEvolution);

router.get('/heatmap', statsController.getHeatmap);

export default router;