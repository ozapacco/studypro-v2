import type { Card, QuestionSession, Subject, CardState, Platform } from '../src/types';

const randomId = () => Math.random().toString(36).substring(2, 15);

const randomSentence = () => {
  const words = ['teste', 'questão', 'resposta', 'erro', 'acerto', 'processo', 'direito', 'penal', 'civil', 'constitucional'];
  return words[Math.floor(Math.random() * words.length)] + ' ' + Math.floor(Math.random() * 100);
};

export const createCard = (overrides: Partial<Card> = {}): Card => ({
  id: randomId(),
  questionId: randomId(),
  front: randomSentence(),
  back: randomSentence(),
  subject: 'Penal',
  topic: 'Legítima Defesa',
  state: 'review' as CardState,
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

export const createSession = (overrides: Partial<QuestionSession> = {}): QuestionSession => ({
  id: randomId(),
  subject: 'Penal',
  topic: 'Legítima Defesa',
  questions: [],
  correctCount: 14,
  incorrectCount: 6,
  errorTypes: ['forgot'],
  platform: 'qconcursos' as Platform,
  source: 'qconcursos',
  startedAt: new Date(),
  completedAt: new Date(),
  duration: 1800,
  ...overrides,
});

export const createSubject = (overrides: Partial<Subject> = {}): Subject => ({
  id: randomId(),
  name: 'Penal',
  description: 'Direito Penal',
  color: '#FF0000',
  questionCount: 100,
  accuracy: 65,
  lastStudied: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMission = (overrides: object = {}) => ({
  id: randomId(),
  type: 'questions' as const,
  subject: 'Penal',
  topic: null,
  targetCount: 20,
  completedCount: 0,
  dueDate: new Date(),
  ...overrides,
});

export const createTopicScore = (overrides: object = {}) => ({
  topic: 'Legítima Defesa',
  correct: Math.floor(Math.random() * 10),
  total: 20,
  accuracy: 70,
  lastStudied: new Date(),
  ...overrides,
});

export const createRecoveryEntry = (overrides: object = {}) => ({
  id: randomId(),
  subject: 'Penal',
  topic: 'Legítima Defesa',
  reason: 'recurrent_error' as const,
  status: 'in_progress' as const,
  cardIds: [randomId()],
  triggerCount: 3,
  accuracyHistory: [60, 50, 40],
  plan: 'Estudar tópicos relacionados',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockExam = (overrides: object = {}) => ({
  id: randomId(),
  title: 'Simulado Penal 1',
  platform: 'qconcursos' as Platform,
  externalId: randomId(),
  subject: 'Penal',
  questions: [],
  score: 55,
  totalQuestions: 100,
  correctAnswers: 55,
  duration: 7200,
  takenAt: new Date(),
  completedAt: new Date(),
  postImpactMode: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});