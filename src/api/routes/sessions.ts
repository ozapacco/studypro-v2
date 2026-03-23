import { Router } from 'express';
import * as sessionController from '../controllers/sessionController';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

router.post(
  '/',
  validateRequest([
    { field: 'subject', type: 'string', required: true },
    { field: 'topic', type: 'string', required: true },
    { field: 'platform', type: 'string', required: true },
    { field: 'questions', type: 'array', required: true },
  ]),
  sessionController.createSession
);

router.get('/', sessionController.listSessions);

router.get('/:id', sessionController.getSession);

router.delete('/:id', sessionController.removeSession);

export default router;