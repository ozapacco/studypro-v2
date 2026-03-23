import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import { useReviews } from '../hooks/useReviews';
import { ReviewCard } from '../components';
import { formatAccuracy, getAccuracyColor } from '../utils';
import * as Haptics from 'expo-haptics';

const mockCards = [
  {
    id: '1',
    front: 'O que é princípio da legalidade?',
    back: 'Princípio que determina que o Estado só pode agir mediante lei prévia, formal e abstrata.',
    context: 'Direito Constitucional - Princípios Fundamentais',
    subject: 'Direito Constitucional',
    topic: 'Princípios Fundamentais',
    dueDate: new Date().toISOString(),
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
  },
  {
    id: '2',
    front: 'Qual o prazo para recursos administrativos?',
    back: 'O prazo é de 30 dias, podendo ser reduzido por legislação específica.',
    context: 'Direito Administrativo - Recursos',
    subject: 'Direito Administrativo',
    topic: 'Recursos Administrativos',
    dueDate: new Date().toISOString(),
    interval: 3,
    easeFactor: 2.3,
    repetitions: 1,
  },
];

export const ReviewScreen: React.FC = () => {
  const { currentCard, progress, remainingCards, submit, isLoading, refresh } = useReviews();
  const [timer, setTimer] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  const cards = mockCards.length > 0 ? mockCards : [];
  const card = cards[0];

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const handleRating = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (card) {
      submit(card.id, rating);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (remainingCards === 0) {
        setIsComplete(true);
      } else {
        setStartTime(Date.now());
      }
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isComplete) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={styles.completeContainer}>
          <Text style={styles.completeIcon}>🎉</Text>
          <Text style={styles.completeTitle}>Revisão Completa!</Text>
          <Text style={styles.completeSubtitle}>Você revisou todos os cartões do dia</Text>
          <View style={styles.completeStats}>
            <Text style={styles.completeTime}>{formatTimer(timer)}</Text>
            <Text style={styles.completeLabel}>Tempo total</Text>
          </View>
          <TouchableOpacity style={styles.completeButton} onPress={() => { setIsComplete(false); refresh(); setStartTime(Date.now()); }}>
            <Text style={styles.completeButtonText}>Nova Sessão</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando cartões...</Text>
        </View>
      </View>
    );
  }

  if (!card) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>✨</Text>
          <Text style={styles.emptyTitle}>Tudo em dia!</Text>
          <Text style={styles.emptySubtitle}>Não há cartões para revisar</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{cards.length - remainingCards}/{cards.length}</Text>
        </View>
        <Text style={styles.timer}>{formatTimer(timer)}</Text>
      </View>

      <ScrollView style={styles.cardContainer} contentContainerStyle={styles.cardContent}>
        <ReviewCard card={card} onRating={handleRating} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
  },
  progressContainer: {
    flex: 1,
    marginRight: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  progressText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  timer: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  cardContainer: {
    flex: 1,
  },
  cardContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748B',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#F1F5F9',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 16,
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingTop: 100,
  },
  completeIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  completeTitle: {
    color: '#F1F5F9',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  completeSubtitle: {
    color: '#64748B',
    fontSize: 16,
    marginBottom: 32,
  },
  completeStats: {
    alignItems: 'center',
    marginBottom: 32,
  },
  completeTime: {
    color: '#3B82F6',
    fontSize: 36,
    fontWeight: '700',
  },
  completeLabel: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 4,
  },
  completeButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});