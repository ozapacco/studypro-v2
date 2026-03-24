import { db } from '../db';
import type { MockExam, MockExamQuestion, Question } from '../models';
import type { Platform } from '../types';

interface DiagnosisResult {
  overallAccuracy: number;
  weakTopics: { topic: string; accuracy: number; errorCount: number }[];
  strongTopics: { topic: string; accuracy: number }[];
  recommendations: string[];
  postImpactMode: boolean;
}

interface TopicStats {
  topic: string;
  total: number;
  correct: number;
  accuracy: number;
}

const IMPACT_THRESHOLD = 0.6;
const POST_IMPACT_DURATION_DAYS = 7;

export function diagnose(mockExamId: string): DiagnosisResult {
  const mockExam = db.findOne<MockExam>('mock_exams', mockExamId);
  
  if (!mockExam) {
    throw new Error('Mock exam not found');
  }
  
  const questionsData = JSON.parse(mockExam.questions as unknown as string) as MockExamQuestion[];
  const topicStats: Map<string, TopicStats> = new Map();
  
  for (const mq of questionsData) {
    const question = db.findOne<Question>('questions', mq.questionId);
    
    if (!question) continue;
    
    const existing = topicStats.get(question.topic) || {
      topic: question.topic,
      total: 0,
      correct: 0,
      accuracy: 0,
    };
    
    existing.total++;
    if (mq.isCorrect) {
      existing.correct++;
    }
    
    topicStats.set(question.topic, existing);
  }
  
  const topics = Array.from(topicStats.values()).map(t => ({
    ...t,
    accuracy: t.total > 0 ? (t.correct / t.total) * 100 : 0,
  }));
  
  const weakTopics = topics
    .filter(t => t.accuracy < 50)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5)
    .map(t => ({
      topic: t.topic,
      accuracy: t.accuracy,
      errorCount: t.total - t.correct,
    }));
  
  const strongTopics = topics
    .filter(t => t.accuracy >= 70)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 5)
    .map(t => ({
      topic: t.topic,
      accuracy: t.accuracy,
    }));
  
  const overallAccuracy = mockExam.totalQuestions > 0
    ? (mockExam.correctAnswers / mockExam.totalQuestions) * 100
    : 0;
  
  const recommendations: string[] = [];
  
  if (overallAccuracy < 50) {
    recommendations.push('Focar em revisão intensiva dos fundamentos');
    recommendations.push('Considerar reduzir carga de novos conteúdos');
  } else if (overallAccuracy < 70) {
    recommendations.push('Identificar e trabalhar temas mais fracos');
    recommendations.push('Aumentar prática em áreas com precisão abaixo de 60%');
  }
  
  if (weakTopics.length > 3) {
    recommendations.push(`Priorizar ${weakTopics[0].topic} - maior taxa de erros`);
  }
  
  const postImpactMode = overallAccuracy < IMPACT_THRESHOLD;
  
  return {
    overallAccuracy,
    weakTopics,
    strongTopics,
    recommendations,
    postImpactMode,
  };
}

export function activatePostImpactMode(mockExamId: string): void {
  const diagnosis = diagnose(mockExamId);
  
  if (diagnosis.postImpactMode) {
    db.update('mock_exams', mockExamId, {
      postImpactMode: true,
    });
  }
}

export function createMockExam(data: {
  title: string;
  platform: Platform;
  subject: string;
  questions: { questionId: string; selectedAnswer?: string; isCorrect: boolean; isMarked: boolean }[];
  duration?: number;
}): MockExam {
  const now = new Date().toISOString();
  const correctAnswers = data.questions.filter(q => q.isCorrect).length;
  
  const mockExam = db.create('mock_exams', {
    title: data.title,
    platform: data.platform,
    subject: data.subject,
    questions: data.questions as unknown as string,
    totalQuestions: data.questions.length,
    correctAnswers,
    duration: data.duration,
    takenAt: now,
    postImpactMode: false,
    createdAt: now,
    updatedAt: now,
  }) as unknown as MockExam;
  
  const diagnosis = diagnose(mockExam.id);
  if (diagnosis.postImpactMode) {
    activatePostImpactMode(mockExam.id);
  }
  
  return mockExam;
}

export function getMockExams(): MockExam[] {
  return db.findAll<MockExam>('mock_exams').sort(
    (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
  );
}

export function getMockExamById(id: string): MockExam | null {
  return db.findOne<MockExam>('mock_exams', id);
}

export function getMockExamsBySubject(subject: string): MockExam[] {
  return db.findAll<MockExam>('mock_exams', { subject });
}

export function isPostImpactModeActive(): boolean {
  const now = new Date();
  const cutoff = new Date(now.getTime() - POST_IMPACT_DURATION_DAYS * 24 * 60 * 60 * 1000);
  
  const recentExams = db.query<MockExam>(
    `SELECT * FROM mock_exams WHERE post_impact_mode = 1 AND taken_at >= ? ORDER BY taken_at DESC`,
    [cutoff.toISOString()]
  );
  
  return recentExams.length > 0;
}

export function getMockExamStats(): {
  total: number;
  averageAccuracy: number;
  recentAccuracy: number;
  postImpactActive: boolean;
} {
  const all = db.findAll<MockExam>('mock_exams');
  
  const total = all.length;
  const averageAccuracy = total > 0
    ? all.reduce((acc, m) => acc + (m.correctAnswers / m.totalQuestions) * 100, 0) / total
    : 0;
  
  const recent = all.slice(-5);
  const recentAccuracy = recent.length > 0
    ? recent.reduce((acc, m) => acc + (m.correctAnswers / m.totalQuestions) * 100, 0) / recent.length
    : 0;
  
  return {
    total,
    averageAccuracy,
    recentAccuracy,
    postImpactActive: isPostImpactModeActive(),
  };
}