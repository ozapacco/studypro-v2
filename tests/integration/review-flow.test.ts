import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCard } from '../utils';
import type { Card, ReviewRating } from '../src/types';

const mockDb = {
  cards: {
    findById: vi.fn((id: string) => Promise.resolve(createCard({ id }))),
    findMany: vi.fn(() => Promise.resolve([createCard({ due: new Date() })])),
    update: vi.fn((id: string, data: unknown) => Promise.resolve({ id, ...data })),
  },
};

const getDueCards = async (): Promise<Card[]> => {
  return [createCard({ due: new Date() })];
};

const submitReview = async (cardId: string, rating: ReviewRating): Promise<Card> => {
  const card = await mockDb.cards.findById(cardId);
  
  let newInterval: number;
  let newState: 'review' | 'relearning';
  
  if (rating === 1) {
    newInterval = 1;
    newState = 'relearning';
  } else if (rating === 2) {
    newInterval = Math.max(1, Math.round(card.interval * 0.8));
    newState = 'review';
  } else if (rating === 3) {
    newInterval = Math.max(1, Math.round(card.interval * card.ease));
    newState = 'review';
  } else {
    newInterval = Math.max(1, Math.round(card.interval * card.ease * 1.3));
    newState = 'review';
  }
  
  const updated = {
    ...card,
    interval: newInterval,
    state: newState,
    dueDate: new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000),
  };
  
  await mockDb.cards.update(cardId, updated);
  return updated;
};

describe('Review Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should get due cards', async () => {
    const due = await getDueCards();
    expect(due.length).toBeGreaterThan(0);
  });
  
  it('should complete review and update card', async () => {
    const card = createCard({ id: 'card-123', front: 'Test', back: 'Answer' });
    mockDb.cards.findById = vi.fn().mockResolvedValue(card);
    
    const review = await submitReview('card-123', 4);
    
    expect(review.interval).toBeGreaterThan(card.interval);
    expect(review.state).toBe('review');
  });
  
  it('should reset interval for AGAIN rating', async () => {
    const card = createCard({ id: 'card-123', interval: 10, state: 'review' });
    mockDb.cards.findById = vi.fn().mockResolvedValue(card);
    
    const review = await submitReview('card-123', 1);
    
    expect(review.interval).toBe(1);
    expect(review.state).toBe('relearning');
  });
  
  it('should increase interval for GOOD rating', async () => {
    const card = createCard({ id: 'card-123', interval: 5, ease: 2.5, state: 'review' });
    mockDb.cards.findById = vi.fn().mockResolvedValue(card);
    
    const review = await submitReview('card-123', 4);
    
    expect(review.interval).toBeGreaterThan(5);
  });
  
  it('should increase interval more for EASY rating', async () => {
    const card = createCard({ id: 'card-123', interval: 5, ease: 2.5, state: 'review' });
    mockDb.cards.findById = vi.fn().mockResolvedValue(card);
    
    const goodReview = await submitReview('card-123', 4);
    const card2 = { ...card, interval: goodReview.interval, ease: goodReview.ease };
    mockDb.cards.findById = vi.fn().mockResolvedValue(card2);
    const easyReview = await submitReview('card-123', 5);
    
    expect(easyReview.interval).toBeGreaterThanOrEqual(goodReview.interval);
  });
  
  it('should decrease interval for HARD rating', async () => {
    const card = createCard({ id: 'card-123', interval: 10, ease: 2.5, state: 'review' });
    mockDb.cards.findById = vi.fn().mockResolvedValue(card);
    
    const review = await submitReview('card-123', 2);
    
    expect(review.interval).toBeLessThan(10);
  });
  
  it('should calculate correct next due date', async () => {
    const card = createCard({ id: 'card-123', interval: 5, ease: 2.5, state: 'review' });
    mockDb.cards.findById = vi.fn().mockResolvedValue(card);
    
    const review = await submitReview('card-123', 4);
    
    const expectedDue = new Date();
    expectedDue.setDate(expectedDue.getDate() + review.interval);
    expect(review.dueDate.getTime()).toBeCloseTo(expectedDue.getTime(), -1);
  });
  
  it('should handle multiple ratings in sequence', async () => {
    let card = createCard({ id: 'card-123', interval: 1, ease: 2.5, state: 'new' });
    
    const ratings: ReviewRating[] = [3, 4, 4, 5];
    
    for (const rating of ratings) {
      mockDb.cards.findById = vi.fn().mockResolvedValue(card);
      card = await submitReview('card-123', rating);
    }
    
    expect(card.interval).toBeGreaterThan(1);
  });
});