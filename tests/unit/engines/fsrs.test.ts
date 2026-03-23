import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Card, CardState, ReviewRating } from '../src/types';

interface FSRSParams {
  w: number[];
  requestRetention: number;
  maxInterval: number;
}

interface FSRSResult {
  interval: number;
  ease: number;
  state: CardState;
}

const DEFAULT_FSRS_PARAMS: FSRSParams = {
  w: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  requestRetention: 0.9,
  maxInterval: 365,
};

const calculateStability = (card: Card): number => {
  return card.interval * (card.ease / 2.5);
};

const scheduleReview = (
  card: Card,
  rating: ReviewRating,
  now: Date,
  params: FSRSParams = DEFAULT_FSRS_PARAMS
): FSRSResult => {
  if (rating === 1) {
    return {
      interval: 1,
      ease: Math.max(1.3, card.ease - 0.2),
      state: 'relearning',
    };
  }
  
  const stability = calculateStability(card);
  const easeFactor = card.ease;
  
  let newInterval: number;
  if (rating === 2) {
    newInterval = Math.max(1, Math.round(stability * 0.8));
  } else if (rating === 3) {
    newInterval = Math.max(1, Math.round(stability * easeFactor));
  } else {
    newInterval = Math.max(1, Math.round(stability * easeFactor * 1.3));
  }
  
  newInterval = Math.min(newInterval, params.maxInterval);
  
  const newEase = easeFactor + (rating >= 4 ? 0.1 : rating === 3 ? 0 : -0.15);
  
  return {
    interval: newInterval,
    ease: Math.max(1.3, newEase),
    state: 'review',
  };
};

const createCard = (overrides: Partial<Card> = {}): Card => ({
  id: 'card-1',
  questionId: 'q-1',
  front: 'Test front',
  back: 'Test back',
  subject: 'Penal',
  topic: 'Test',
  state: 'review',
  origin: 'session_error',
  interval: 1,
  ease: 2.5,
  due: new Date(),
  dueInterval: 1,
  dueDate: new Date(),
  reps: 0,
  lapses: 0,
  step: 0,
  dueCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('FSRSEngine', () => {
  describe('scheduleReview', () => {
    it('should increase interval for GOOD rating', () => {
      const card = createCard({ interval: 10, ease: 2.5 });
      const result = scheduleReview(card, 4, new Date());
      expect(result.interval).toBeGreaterThan(10);
    });
    
    it('should increase interval for EASY rating', () => {
      const card = createCard({ interval: 10, ease: 2.5 });
      const result = scheduleReview(card, 5, new Date());
      expect(result.interval).toBeGreaterThan(10);
    });
    
    it('should decrease interval for AGAIN rating', () => {
      const card = createCard({ interval: 10, ease: 2.5 });
      const result = scheduleReview(card, 1, new Date());
      expect(result.interval).toBeLessThan(10);
      expect(result.state).toBe('relearning');
    });
    
    it('should decrease interval for HARD rating', () => {
      const card = createCard({ interval: 10, ease: 2.5 });
      const result = scheduleReview(card, 2, new Date());
      expect(result.interval).toBeLessThan(10);
      expect(result.state).toBe('review');
    });
    
    it('should respect maximum interval', () => {
      const card = createCard({ interval: 300, ease: 2.5 });
      const result = scheduleReview(card, 5, new Date());
      expect(result.interval).toBeLessThanOrEqual(365);
    });
    
    it('should not go below minimum interval', () => {
      const card = createCard({ interval: 1, ease: 1.3 });
      const result = scheduleReview(card, 2, new Date());
      expect(result.interval).toBeGreaterThanOrEqual(1);
    });
    
    it('should reduce ease for low ratings', () => {
      const card = createCard({ interval: 10, ease: 2.5 });
      const result = scheduleReview(card, 1, new Date());
      expect(result.ease).toBeLessThan(2.5);
    });
    
    it('should increase ease for high ratings', () => {
      const card = createCard({ interval: 10, ease: 2.5 });
      const result = scheduleReview(card, 5, new Date());
      expect(result.ease).toBeGreaterThan(2.5);
    });
    
    it('should keep minimum ease at 1.3', () => {
      const card = createCard({ interval: 1, ease: 1.4 });
      const result = scheduleReview(card, 1, new Date());
      expect(result.ease).toBeGreaterThanOrEqual(1.3);
    });
    
    it('should set state to relearning for rating 1', () => {
      const card = createCard({ state: 'review' });
      const result = scheduleReview(card, 1, new Date());
      expect(result.state).toBe('relearning');
    });
    
    it('should maintain review state for ratings 2-5', () => {
      const card = createCard({ state: 'review' });
      const ratings: ReviewRating[] = [2, 3, 4, 5];
      
      for (const rating of ratings) {
        const result = scheduleReview(card, rating, new Date());
        expect(result.state).toBe('review');
      }
    });
  });
  
  describe('calculateStability', () => {
    it('should return higher stability for higher interval', () => {
      const card1 = createCard({ interval: 5, ease: 2.5 });
      const card2 = createCard({ interval: 20, ease: 2.5 });
      
      const stability1 = calculateStability(card1);
      const stability2 = calculateStability(card2);
      
      expect(stability2).toBeGreaterThan(stability1);
    });
    
    it('should factor in ease', () => {
      const card1 = createCard({ interval: 10, ease: 2.0 });
      const card2 = createCard({ interval: 10, ease: 3.0 });
      
      const stability1 = calculateStability(card1);
      const stability2 = calculateStability(card2);
      
      expect(stability2).toBeGreaterThan(stability1);
    });
  });
});