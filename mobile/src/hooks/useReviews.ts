import { useEffect } from 'react';
import { useReviewStore } from '../stores/useReviewStore';

export const useReviews = () => {
  const { dueCards, currentCardIndex, isLoading, fetchDueCards, submitReview, nextCard, resetReview } = useReviewStore();

  useEffect(() => {
    fetchDueCards();
  }, []);

  const currentCard = dueCards[currentCardIndex];
  const progress = dueCards.length > 0 ? (currentCardIndex + 1) / dueCards.length : 0;

  return {
    cards: dueCards,
    currentCard,
    currentIndex: currentCardIndex,
    progress,
    isLoading,
    refresh: fetchDueCards,
    submit: submitReview,
    next: nextCard,
    reset: resetReview,
    totalCards: dueCards.length,
    remainingCards: dueCards.length - currentCardIndex - 1,
  };
};