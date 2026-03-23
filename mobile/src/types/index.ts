export interface Session {
  id: string;
  subject: string;
  topic: string;
  platform: string;
  questionsTotal: number;
  questionsCorrect: number;
  difficulty: number;
  errorTypes: string[];
  tags: string[];
  createdAt: string;
}

export interface Card {
  id: string;
  front: string;
  back: string;
  context: string;
  subject: string;
  topic: string;
  dueDate: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
}

export interface Mission {
  id: string;
  type: 'review' | 'practice' | 'weak_topic' | 'recovery';
  subject: string;
  topic: string;
  platform: string;
  estimatedTime: number;
  reason: string;
  priority: number;
}

export interface HealthMetrics {
  accuracyRate: number;
  accuracyTrend: 'up' | 'down' | 'stable';
  weakestSubject: string;
  criticalTopic: string;
  consistency: number;
}

export interface StatsOverview {
  projectedScore: number;
  subjectEvolution: {
    subject: string;
    accuracy: number;
    trend: number;
  }[];
  criticalTopics: {
    topic: string;
    accuracy: number;
    reviewCount: number;
  }[];
  consistencyHeatmap: {
    day: string;
    value: number;
  }[];
}

export interface ReviewRating {
  rating: 'again' | 'hard' | 'good' | 'easy';
  nextInterval: number;
}

export type Platform = 'questoes' | 'tec' | 'aprova' | 'gran' | 'simulado' | 'estrategia' | 'other';

export type ErrorType = 'interpretacao' | 'cálculo' | 'conceito' | 'memória' | 'desatenção' | 'metodo' | 'outro';