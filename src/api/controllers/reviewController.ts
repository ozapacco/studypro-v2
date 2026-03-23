import type { Request, Response } from 'express';
import { db } from '../../lib/db';
import { getDueCards, scheduleReview, getCardStatistics, previewReview } from '../../lib/engines/fsrs';
import type { Card, ReviewRating } from '../../types';

interface ReviewSubmission {
  rating: ReviewRating;
}

export async function getDueReviews(req: Request, res: Response): Promise<void> {
  try {
    const { limit, subject, topic } = req.query;
    
    let cards = getDueCards(limit ? parseInt(limit as string) : 50);
    
    if (subject) {
      cards = cards.filter(c => c.subject === subject);
    }
    
    if (topic) {
      cards = cards.filter(c => c.topic === topic);
    }
    
    res.json({
      cards: cards.map(c => ({
        id: c.id,
        front: c.front,
        back: c.back,
        subject: c.subject,
        topic: c.topic,
        state: c.state,
        dueDate: c.dueDate,
        interval: c.interval,
        ease: c.ease,
      })),
      total: cards.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get due reviews' });
  }
}

export async function submitReview(req: Request, res: Response): Promise<void> {
  try {
    const { cardId } = req.params;
    const { rating } = req.body as ReviewSubmission;
    
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Invalid rating (must be 1-5)' });
      return;
    }
    
    const card = db.findOne<Card>('cards', cardId);
    
    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }
    
    const updates = scheduleReview(card, rating);
    
    db.update('cards', cardId, updates);
    
    const preview = previewReview(card, rating);
    
    res.json({
      success: true,
      preview: {
        nextInterval: preview.interval,
        nextEase: preview.ease,
        nextState: preview.state,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
}

export async function batchReview(req: Request, res: Response): Promise<void> {
  try {
    const { reviews } = req.body as {
      reviews: { cardId: string; rating: ReviewRating }[];
    };
    
    if (!reviews?.length) {
      res.status(400).json({ error: 'No reviews provided' });
      return;
    }
    
    const results = [];
    
    for (const review of reviews) {
      const card = db.findOne<Card>('cards', review.cardId);
      
      if (!card) {
        results.push({ cardId: review.cardId, success: false, error: 'Not found' });
        continue;
      }
      
      const updates = scheduleReview(card, review.rating);
      db.update('cards', review.cardId, updates);
      
      results.push({ cardId: review.cardId, success: true });
    }
    
    const successCount = results.filter(r => r.success).length;
    
    res.json({
      processed: results.length,
      successful: successCount,
      failed: results.length - successCount,
      results,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process batch review' });
  }
}

export async function getCardStats(req: Request, res: Response): Promise<void> {
  try {
    const stats = getCardStatistics();
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get card statistics' });
  }
}

export async function getCard(req: Request, res: Response): Promise<void> {
  try {
    const { cardId } = req.params;
    const card = db.findOne<Card>('cards', cardId);
    
    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }
    
    res.json({ card });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get card' });
  }
}