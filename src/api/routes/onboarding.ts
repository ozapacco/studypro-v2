import { Router } from 'express';
import * as onboardingController from '../controllers/onboardingController';

const router = Router();

router.get('/exams', onboardingController.getExams);

router.get('/progress', onboardingController.getProgress);

router.post('/start', onboardingController.startOnboarding);

router.put('/step/:step', onboardingController.updateStep);

router.post('/complete', onboardingController.completeOnboarding);

export default router;