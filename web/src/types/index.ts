export interface Session {
  id: string
  title: string
  subject: string
  duration: number
  date: string
  status: 'completed' | 'in-progress' | 'scheduled'
  score?: number
  topics: string[]
}

export interface Review {
  id: string
  sessionId: string
  sessionTitle: string
  date: string
  accuracy: number
  correct: number
  total: number
  timeSpent: number
  criticalTopics: string[]
}

export interface MockExam {
  id: string
  title: string
  date: string
  score: number
  duration: number
  questionsCount: number
  status: 'completed' | 'in-progress' | 'scheduled'
}

export interface Stats {
  totalSessions: number
  totalReviews: number
  totalStudyTime: number
  averageAccuracy: number
  weeklyProgress: { day: string; hours: number }[]
  topicPerformance: { topic: string; accuracy: number }[]
}

export interface DashboardData {
  mission: {
    current: number
    target: number
    streak: number
  }
  health: {
    focusLevel: number
   疲劳度: number
    memoryStrength: number
  }
  recentSessions: Session[]
  upcomingReviews: Review[]
}

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
  explanation?: string;
}

export interface TopicPerformance {
  id: string;
  user_id: string;
  subject: string;
  topic: string;
  canonical_topic: string;
  attempts: number;
  errors: number;
  accuracy: number;
  recurrenceScore: number;
  last_seen_at: string;
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}
