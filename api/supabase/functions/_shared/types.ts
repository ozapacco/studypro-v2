export type Platform = 'qconcursos' | 'tec' | 'other';
export type ErrorType = 'forgot' | 'confused' | 'never_learned';
export type CardState = 'new' | 'learning' | 'review' | 'relearning';
export type StudyPhase = 'base' | 'intensification' | 'final';

export interface Session {
  id: string;
  user_id: string;
  subject: string;
  platform: Platform;
  total_questions: number;
  correct_answers: number;
  error_rate: number;
  error_tags: string[];
  canonical_topics: string[];
  perceived_difficulty?: number;
  error_type?: ErrorType;
  session_date: string;
  created_at: string;
}

export interface Card {
  id: string;
  user_id: string;
  subject: string;
  topic?: string;
  front: string;
  back?: string;
  state: CardState;
  stability: number;
  difficulty: number;
  interval: number;
  due_date: string;
  lapses: number;
  origin: string;
  auto_generated: boolean;
  error_context?: string;
}

export interface MockExam {
  id: string;
  user_id: string;
  name: string;
  exam_date: string;
  total_score: number;
  max_score: number;
  cutoff_score?: number;
  by_subject: { subject: string; score: number; maxScore: number }[];
  analysis: { strong: string[]; attention: string[]; critical: string[] };
  created_at: string;
}