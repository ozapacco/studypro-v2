import type { Request, Response } from 'express';
import { process, getSessionById, getSessionsBySubject, getRecentSessions, deleteSession } from '../../lib/engines/sessionProcessor';
import type { Platform } from '../../types';

interface CreateSessionBody {
  subject: string;
  topic: string;
  platform: Platform;
  source?: string;
  questions: {
    text: string;
    externalId?: string;
    correctAnswer: string;
    options: Record<string, string>;
    explanation?: string;
    selectedAnswer?: string;
    isCorrect: boolean;
    errorType?: 'forgot' | 'confused' | 'never_learned';
  }[];
}

export async function createSession(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as CreateSessionBody;
    
    if (!body.subject || !body.topic || !body.platform || !body.questions?.length) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    const result = process(body);
    
    res.status(201).json({
      session: result.session,
      cardsCreated: result.newCards.length,
      errors: result.errors,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session' });
  }
}

export async function listSessions(req: Request, res: Response): Promise<void> {
  try {
    const { subject, limit } = req.query;
    let sessions;
    
    if (subject) {
      sessions = getSessionsBySubject(subject as string);
    } else {
      sessions = getRecentSessions(limit ? parseInt(limit as string) : 10);
    }
    
    res.json({
      sessions: sessions.map(s => ({
        id: s.id,
        subject: s.subject,
        topic: s.topic,
        correctCount: s.correctCount,
        incorrectCount: s.incorrectCount,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        duration: s.duration,
      })),
      total: sessions.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list sessions' });
  }
}

export async function getSession(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const session = getSessionById(id);
    
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    
    res.json({ session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get session' });
  }
}

export async function removeSession(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const deleted = deleteSession(id);
    
    if (!deleted) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
}