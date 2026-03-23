import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Card } from '../types';
import { formatAccuracy, getAccuracyColor } from '../utils';

interface ReviewCardProps {
  card: Card;
  onRating: (rating: 'again' | 'hard' | 'good' | 'easy') => void;
}

const { width } = Dimensions.get('window');

export const ReviewCard: React.FC<ReviewCardProps> = ({ card, onRating }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;

  const flipCard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(flipAnimation, {
      toValue: isFlipped ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  const handleRating = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onRating(rating);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.9} onPress={flipCard}>
        <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
          <Text style={styles.cardLabel}>PERGUNTA</Text>
          <Text style={styles.cardText}>{card.front}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.hint}>Toque para revelar resposta</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
        <Text style={styles.cardLabel}>RESPOSTA</Text>
        <Text style={styles.cardText}>{card.back}</Text>
        {card.context && (
          <View style={styles.contextContainer}>
            <Text style={styles.contextLabel}>Contexto:</Text>
            <Text style={styles.contextText}>{card.context}</Text>
          </View>
        )}
        <Text style={styles.subjectText}>{card.subject} • {card.topic}</Text>
      </Animated.View>

      <View style={styles.ratingContainer}>
        <Text style={styles.ratingLabel}>Como você acertou?</Text>
        <View style={styles.ratingButtons}>
          <TouchableOpacity style={styles.ratingButton} onPress={() => handleRating('again')}>
            <Text style={styles.ratingEmoji}>😓</Text>
            <Text style={styles.ratingText}>Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ratingButton} onPress={() => handleRating('hard')}>
            <Text style={styles.ratingEmoji}>🤔</Text>
            <Text style={styles.ratingText}>Hard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ratingButton} onPress={() => handleRating('good')}>
            <Text style={styles.ratingEmoji}>😊</Text>
            <Text style={styles.ratingText}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ratingButton} onPress={() => handleRating('easy')}>
            <Text style={styles.ratingEmoji}>🎯</Text>
            <Text style={styles.ratingText}>Easy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    width: width - 32,
    minHeight: 200,
    borderRadius: 16,
    padding: 20,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    backgroundColor: '#1E293B',
  },
  cardBack: {
    backgroundColor: '#334155',
    position: 'absolute',
    top: 16,
    left: 16,
  },
  cardLabel: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  cardText: {
    color: '#F1F5F9',
    fontSize: 18,
    lineHeight: 26,
  },
  cardFooter: {
    marginTop: 20,
    alignItems: 'center',
  },
  hint: {
    color: '#64748B',
    fontSize: 14,
  },
  contextContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#475569',
    borderRadius: 8,
  },
  contextLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
  },
  contextText: {
    color: '#F1F5F9',
    fontSize: 14,
  },
  subjectText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 16,
  },
  ratingContainer: {
    marginTop: 24,
  },
  ratingLabel: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  ratingEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  ratingText: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '500',
  },
});