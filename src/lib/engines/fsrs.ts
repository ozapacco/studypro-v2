import { db } from '../db';
import type { Card } from '../../models';
import type { CardState, ReviewRating } from '../../types';

interface FSRSParams {
  w: number[];
  requestRetention: number;
}

const DEFAULT_FSRS_PARAMS: FSRSParams = {
  w: [0.4, 0.6, 2.4, 10.9, 5.8, 4.9, 0.9, 0.9, 0.9, 0.9],
  requestRetention: 0.9,
};

const STEPS = [1, 10];

export function scheduleReview(card: Card, rating: ReviewRating): Partial<Card> {
  const now = new Date();
  const interval = calculateInterval(card, rating);
  
  let newState: CardState = card.state;
  let newStep = card.step;
  let newReps = card.reps;
  let newLapses = card.lapses;
  let newEase = card.ease;
  
  if (rating <= 2) {
    newLapses++;
    newStep = 0;
    newState = 'relearning';
  } else {
    newStep++;
    newReps++;
    
    if (card.state === 'new' || card.state === 'learning') {
      if (newStep >= STEPS.length) {
        newState = 'review';
      } else {
        newState = 'learning';
      }
    }
  }
  
  newEase = calculateNewEase(card.ease, rating);
  
  const dueDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
  
  return {
    state: newState,
    step: newStep,
    reps: newReps,
    lapses: newLapses,
    ease: newEase,
    interval,
    dueInterval: interval,
    due: now.toISOString(),
    dueDate: dueDate.toISOString(),
    dueCount: card.dueCount + 1,
    updatedAt: now.toISOString(),
  };
}

function calculateInterval(card: Card, rating: ReviewRating): number {
  const w = DEFAULT_FSRS_PARAMS.w;
  
  if (card.state === 'new' || card.state === 'learning') {
    return STEPS[Math.min(card.step, STEPS.length - 1)];
  }
  
  let interval: number;
  
  if (rating === 1) {
    interval = 1;
  } else if (rating === 2) {
    interval = card.interval * w[3];
  } else if (rating === 3) {
    interval = card.interval * w[4] * card.ease;
  } else {
    interval = card.interval * w[5] * card.ease * card.ease;
  }
  
  if (card.lapses > 0) {
    const lapsedInterval = card.interval * w[6];
    interval = Math.max(interval, lapsedInterval);
  }
  
  if (interval < 1) interval = 1;
  if (interval > 365) interval = 365;
  
  return Math.round(interval);
}

function calculateNewEase(currentEase: number, rating: ReviewRating): number {
  const w = DEFAULT_FSRS_PARAMS.w;
  
  let newEase = currentEase + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
  
  if (rating === 1) {
    newEase = Math.max(1.3, newEase - w[7]);
  }
  
  newEase = Math.max(1.3, Math.min(3.0, newEase));
  
  return Math.round(newEase * 100) / 100;
}

export function getDueCards(limit: number = 50): Card[] {
  const now = new Date().toISOString();
  
  const newCards = db.findAll<Card>('cards', { state: 'new' })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, 10);
  
  const learningCards = db.query<Card>(
    `SELECT * FROM cards WHERE state = 'learning' ORDER BY due_date ASC LIMIT ?`,
    [limit]
  );
  
  const reviewCards = db.query<Card>(
    `SELECT * FROM cards WHERE state = 'review' AND due_date <= ? ORDER BY due_date ASC LIMIT ?`,
    [now, limit]
  );
  
  const relearningCards = db.query<Card>(
    `SELECT * FROM cards WHERE state = 'relearning' ORDER BY due_date ASC LIMIT ?`,
    [limit]
  );
  
  const allDue = [...learningCards, ...reviewCards, ...relearningCards, ...newCards];
  
  return allDue.slice(0, limit);
}

export function getCardsBySubject(subject: string): Card[] {
  return db.findAll<Card>('cards', { subject });
}

export function getCardsByTopic(subject: string, topic: string): Card[] {
  return db.findAll<Card>('cards', { subject, topic });
}

export function getCardStatistics(): {
  new: number;
  learning: number;
  review: number;
  relearning: number;
  dueToday: number;
  total: number;
} {
  const now = new Date().toISOString();
  
  const allCards = db.findAll<Card>('cards');
  
  return {
    new: allCards.filter(c => c.state === 'new').length,
    learning: allCards.filter(c => c.state === 'learning').length,
    review: allCards.filter(c => c.state === 'review').length,
    relearning: allCards.filter(c => c.state === 'relearning').length,
    dueToday: allCards.filter(c => new Date(c.dueDate) <= new Date()).length,
    total: allCards.length,
  };
}

export function previewReview(card: Card, rating: ReviewRating): { interval: number; ease: number; state: CardState } {
  const result = scheduleReview(card, rating);
  
  return {
    interval: result.interval || card.interval,
    ease: result.ease || card.ease,
    state: result.state || card.state,
  };
}