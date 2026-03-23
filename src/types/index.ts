export type Platform = 'qconcursos' | 'tec' | 'other';

export type ErrorType = 'forgot' | 'confused' | 'never_learned';

export type CardState = 'new' | 'learning' | 'review' | 'relearning';

export type CardOrigin = 'manual' | 'session_error' | 'imported' | 'mock_exam_error';

export type StudyPhase = 'base' | 'intensification' | 'final';

export type RecoveryStatus = 'open' | 'in_progress' | 'done' | 'archived';

export type RecoveryReason = 'recurrent_error' | 'mock_exam' | 'never_learned' | 'low_accuracy';

export type MissionType = 'questions' | 'review' | 'mock' | 'recovery';

export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export interface StudyStats {
  totalCards: number;
  dueCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  averageAccuracy: number;
  streakDays: number;
}

export interface Mission {
  id: string;
  type: MissionType;
  subject: string;
  topic: string | null;
  targetCount: number;
  completedCount: number;
  dueDate: Date;
}

export interface DailyMission {
  date: string;
  missions: Mission[];
  estimatedMinutes: number;
  totalQuestions: number;
  totalReviews: number;
}

export interface TopicScore {
  topic: string;
  correct: number;
  total: number;
  accuracy: number;
  lastStudied: Date | null;
}

export interface SubjectProgress {
  subject: string;
  topics: TopicScore[];
  overallAccuracy: number;
  totalQuestions: number;
}