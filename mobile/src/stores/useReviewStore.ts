import { create } from 'zustand';
import type { Card } from '../types';
import { reviewsApi } from '../services/api';

interface ReviewState {
  dueCards: Card[];
  currentCardIndex: number;
  isLoading: boolean;
  fetchDueCards: () => Promise<void>;
  submitReview: (cardId: string, rating: string) => Promise<void>;
  nextCard: () => void;
  resetReview: () => void;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  dueCards: [],
  currentCardIndex: 0,
  isLoading: false,
  
  fetchDueCards: async () => {
    set({ isLoading: true });
    try {
      const cards = await reviewsApi.getDue();
      set({ dueCards: cards, currentCardIndex: 0 });
    } catch (error) {
      console.error('Failed to fetch due cards:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  submitReview: async (cardId, rating) => {
    try {
      await reviewsApi.submit(cardId, rating);
      set((state) => ({
        dueCards: state.dueCards.filter((c) => c.id !== cardId),
      }));
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  },
  
  nextCard: () => {
    set((state) => ({
      currentCardIndex: Math.min(state.currentCardIndex + 1, state.dueCards.length - 1),
    }));
  },
  
  resetReview: () => {
    set({ currentCardIndex: 0 });
  },
}));