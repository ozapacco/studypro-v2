import type {
  Platform,
  ErrorType,
  CardState,
  CardOrigin,
  StudyPhase,
  RecoveryStatus,
  RecoveryReason,
  MissionType,
  ReviewRating,
} from '../types';

export interface Question {
  id: string;
  text: string;
  platform: Platform;
  externalId: string;
  subject: string;
  topic: string;
  correctAnswer: string;
  options: Record<string, string>;
  explanation?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionSession {
  id: string;
  subject: string;
  topic: string;
  questions: Question[];
  correctCount: number;
  incorrectCount: number;
  errorTypes: ErrorType[];
  platform: Platform;
  source: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
}

export interface Card {
  id: string;
  questionId: string;
  front: string;
  back: string;
  subject: string;
  topic: string;
  state: CardState;
  origin: CardOrigin;
  interval: number;
  ease: number;
  due: Date;
  dueInterval: number;
  dueDate: Date;
  reps: number;
  lapses: number;
  step: number;
  dueCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  color?: string;
  questionCount: number;
  accuracy: number;
  lastStudied?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecoveryEntry {
  id: string;
  subject: string;
  topic: string;
  reason: RecoveryReason;
  status: RecoveryStatus;
  cardIds: string[];
  triggerCount: number;
  accuracyHistory: number[];
  plan: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface TopicPerformance {
  id: string;
  subject: string;
  topic: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  errorTypes: Record<ErrorType, number>;
  recurrenceScore: number;
  lastStudied: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockExam {
  id: string;
  title: string;
  platform: Platform;
  externalId?: string;
  subject: string;
  questions: MockExamQuestion[];
  score?: number;
  totalQuestions: number;
  correctAnswers: number;
  duration?: number;
  takenAt: Date;
  completedAt?: Date;
  postImpactMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockExamQuestion {
  id: string;
  questionId: string;
  selectedAnswer?: string;
  isCorrect: boolean;
  isMarked: boolean;
}

export interface UserSettings {
  id: string;
  dailyGoal: number;
  studyPhase: StudyPhase;
  targetScore: number;
  preferredPlatform?: Platform;
  reviewLimit: number;
  newCardsLimit: number;
  examDate?: Date;
  selectedExams?: string[];
  theme: 'light' | 'dark';
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingProgress {
  id: string;
  step: number;
  selectedExams: string[];
  selectedSubjects: string[];
  dailyGoal: number;
  targetScore: number;
  completed: boolean;
  startedAt: Date;
  completedAt?: Date;
}

export interface TopicNormalization {
  id: string;
  rawTag: string;
  normalizedTopic: string;
  subject: string;
  confidence: number;
  createdAt: Date;
}