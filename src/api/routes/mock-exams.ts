import { Router } from 'express';
import * as mockExamController from '../controllers/mockExamController';

const router = Router();

router.post('/', mockExamController.createExam);

router.get('/', mockExamController.listExams);

router.get('/stats', mockExamController.getExamStats);

router.get('/:id', mockExamController.getExam);

export default router;