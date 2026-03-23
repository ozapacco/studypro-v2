import { Router } from 'express';
import * as reviewController from '../controllers/reviewController';

const router = Router();

router.get('/due', reviewController.getDueReviews);

router.get('/stats', reviewController.getCardStats);

router.get('/:cardId', reviewController.getCard);

router.post('/:cardId', reviewController.submitReview);

router.post('/batch', reviewController.batchReview);

export default router;