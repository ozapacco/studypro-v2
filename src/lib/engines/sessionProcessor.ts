import { db } from '../db';
import type { Question, QuestionSession, Card, ErrorType } from '../models';
import { normalize } from './topic';
import { triggerRecovery } from './recovery';
import type { Platform, CardOrigin, ErrorType } from '../types';

interface SessionInput {
  subject: string;
  topic: string;
  platform: Platform;
  source?: string;
  questions: QuestionInput[];
}

interface QuestionInput {
  text: string;
  externalId?: string;
  correctAnswer: string;
  options: Record<string, string>;
  explanation?: string;
  selectedAnswer?: string;
  isCorrect: boolean;
  errorType?: ErrorType;
}

interface ProcessedResult {
  session: QuestionSession;
  newCards: Card[];
  errors: ErrorInfo[];
}

interface ErrorInfo {
  questionId: string;
  topic: string;
  errorType: ErrorType;
}

export function process(input: SessionInput): ProcessedResult {
  const now = new Date().toISOString();
  
  const session = db.create('sessions', {
    subject: input.subject,
    topic: input.topic,
    correctCount: 0,
    incorrectCount: 0,
    errorTypes: [] as unknown as string,
    platform: input.platform,
    source: input.source || 'manual',
    startedAt: now,
  }) as unknown as QuestionSession;
  
  let correctCount = 0;
  let incorrectCount = 0;
  const errorTypes: ErrorType[] = [];
  const errors: ErrorInfo[] = [];
  const newCards: Card[] = [];
  
  for (const q of input.questions) {
    const question = db.create('questions', {
      text: q.text,
      platform: input.platform,
      externalId: q.externalId || '',
      subject: input.subject,
      topic: input.topic,
      correctAnswer: q.correctAnswer,
      options: JSON.stringify(q.options),
      explanation: q.explanation,
      createdAt: now,
      updatedAt: now,
    }) as unknown as Question;
    
    if (q.isCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
      
      const errorType = q.errorType || determineErrorType(q);
      errorTypes.push(errorType);
      
      errors.push({
        questionId: question.id,
        topic: input.topic,
        errorType,
      });
      
      const card = generateCard(question, 'session_error');
      newCards.push(card);
    }
  }
  
  db.update('sessions', session.id, {
    correctCount,
    incorrectCount,
    errorTypes: errorTypes as unknown as string,
    completedAt: now,
    duration: 0,
  });
  
  const updatedSession = db.findOne<QuestionSession>('sessions', session.id) as QuestionSession;
  
  const recovery = triggerRecovery(updatedSession);
  
  return {
    session: updatedSession,
    newCards,
    errors,
  };
}

function determineErrorType(question: QuestionInput): ErrorType {
  if (question.selectedAnswer && question.correctAnswer) {
    return 'confused';
  }
  return 'forgot';
}

export function generateCard(question: Question, origin: CardOrigin): Card {
  const now = new Date();
  const nowStr = now.toISOString();
  
  const card = db.create('cards', {
    questionId: question.id,
    front: question.text.substring(0, 200),
    back: question.explanation || question.correctAnswer,
    subject: question.subject,
    topic: question.topic,
    state: 'new',
    origin,
    interval: 0,
    ease: 2.5,
    due: nowStr,
    dueInterval: 0,
    dueDate: nowStr,
    reps: 0,
    lapses: 0,
    step: 0,
    dueCount: 0,
    createdAt: nowStr,
    updatedAt: nowStr,
  }) as unknown as Card;
  
  return card;
}

export function generateCardsFromErrors(sessionId: string): Card[] {
  const session = db.findOne<QuestionSession>('sessions', sessionId);
  if (!session) return [];
  
  const questions = db.findAll<Question>('questions', { id: sessionId });
  const cards: Card[] = [];
  
  for (const q of questions) {
    const existingCard = db.find<Card>('cards', { questionId: q.id });
    
    if (!existingCard) {
      const card = generateCard(q, 'session_error');
      cards.push(card);
    }
  }
  
  return cards;
}

export function importQuestions(questions: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>[]): Question[] {
  const now = new Date().toISOString();
  const imported: Question[] = [];
  
  for (const q of questions) {
    const question = db.create('questions', {
      ...q,
      options: typeof q.options === 'string' ? q.options : JSON.stringify(q.options),
      createdAt: now,
      updatedAt: now,
    }) as unknown as Question;
    
    imported.push(question);
  }
  
  return imported;
}

export function getSessionById(id: string): QuestionSession | null {
  const session = db.findOne<QuestionSession>('sessions', id);
  if (!session) return null;
  
  return session;
}

export function getSessionsBySubject(subject: string): QuestionSession[] {
  return db.findAll<QuestionSession>('sessions', { subject });
}

export function getRecentSessions(limit: number = 10): QuestionSession[] {
  const sessions = db.findAll<QuestionSession>('sessions');
  return sessions
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, limit);
}

export function deleteSession(id: string): boolean {
  const questions = db.findAll<{ id: string }>('session_questions', { sessionId: id });
  for (const sq of questions) {
    db.delete('questions', sq.id);
  }
  
  return db.delete('sessions', id);
}