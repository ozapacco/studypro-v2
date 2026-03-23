import type { StudyPhase, Mission, MissionType, DailyMission, TopicPerformance } from '../../types';
import { db } from '../db';
import type { Card, QuestionSession } from '../../models';

interface PhaseWeights {
  base: number;
  intensification: number;
  final: number;
}

interface DailyStats {
  totalCards: number;
  dueCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  averageAccuracy: number;
  streakDays: number;
}

export function getDailyStats(): DailyStats {
  const cards = db.findAll<Card>('cards');
  const sessions = db.findAll<QuestionSession>('sessions');
  
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.startedAt.startsWith(today));
  
  const totalCards = cards.length;
  const dueCards = cards.filter(c => new Date(c.dueDate) <= new Date()).length;
  const newCards = cards.filter(c => c.state === 'new').length;
  const learningCards = cards.filter(c => c.state === 'learning').length;
  const reviewCards = cards.filter(c => c.state === 'review').length;
  
  const correct = todaySessions.reduce((acc, s) => acc + (s.correctCount || 0), 0);
  const total = todaySessions.reduce((acc, s) => acc + (s.correctCount || 0) + (s.incorrectCount || 0), 0);
  const averageAccuracy = total > 0 ? (correct / total) * 100 : 0;
  
  return {
    totalCards,
    dueCards,
    newCards,
    learningCards,
    reviewCards,
    averageAccuracy,
    streakDays: calculateStreak(sessions),
  };
}

function calculateStreak(sessions: QuestionSession[]): number {
  if (sessions.length === 0) return 0;
  
  const sortedDates = [...new Set(sessions.map(s => s.startedAt.split('T')[0]))].sort().reverse();
  let streak = 0;
  let currentDate = new Date();
  
  for (const date of sortedDates) {
    const sessionDate = new Date(date);
    const diffDays = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
      streak++;
      currentDate = sessionDate;
    } else {
      break;
    }
  }
  
  return streak;
}

function getPhaseWeights(phase: StudyPhase): PhaseWeights {
  switch (phase) {
    case 'base':
      return { base: 0.6, intensification: 0.25, final: 0.15 };
    case 'intensification':
      return { base: 0.3, intensification: 0.5, final: 0.2 };
    case 'final':
      return { base: 0.15, intensification: 0.35, final: 0.5 };
  }
}

export function determineStudyPhase(targetScore: number, daysUntilExam: number, currentAccuracy: number): StudyPhase {
  if (daysUntilExam <= 7) return 'final';
  if (daysUntilExam <= 30 || currentAccuracy >= targetScore - 10) return 'intensification';
  return 'base';
}

export function generateDailyMission(): DailyMission {
  const stats = getDailyStats();
  const settings = db.findOne<{ dailyGoal: number; targetScore: number; studyPhase: StudyPhase }>('user_settings', 'default');
  
  const missions: Mission[] = [];
  let totalQuestions = 0;
  let totalReviews = 0;
  
  if (stats.dueCards > 0) {
    missions.push({
      id: crypto.randomUUID(),
      type: 'review',
      subject: 'all',
      topic: null,
      targetCount: Math.min(stats.dueCards, settings?.reviewLimit || 50),
      completedCount: 0,
      dueDate: new Date(),
    });
    totalReviews = Math.min(stats.dueCards, settings?.reviewLimit || 50);
  }
  
  if (stats.newCards < (settings?.newCardsLimit || 10)) {
    const newCardsLimit = settings?.newCardsLimit || 10;
    missions.push({
      id: crypto.randomUUID(),
      type: 'questions',
      subject: 'all',
      topic: null,
      targetCount: newCardsLimit,
      completedCount: 0,
      dueDate: new Date(),
    });
    totalQuestions = newCardsLimit;
  }
  
  const recoveryEntries = db.findAll<{ status: string }>('recoveries', { status: 'in_progress' });
  if (recoveryEntries.length > 0) {
    missions.push({
      id: crypto.randomUUID(),
      type: 'recovery',
      subject: 'all',
      topic: null,
      targetCount: recoveryEntries.length * 5,
      completedCount: 0,
      dueDate: new Date(),
    });
  }
  
  const estimatedMinutes = (totalQuestions + totalReviews) * 1.5;
  
  return {
    date: new Date().toISOString().split('T')[0],
    missions,
    estimatedMinutes: Math.round(estimatedMinutes),
    totalQuestions,
    totalReviews,
  };
}

export function recalculatePriorities(): { topic: string; priority: number }[] {
  const topics = db.findAll<TopicPerformance>('topic_performance');
  
  const settings = db.findOne<{ studyPhase: StudyPhase; targetScore: number }>('user_settings', 'default') || {
    studyPhase: 'base' as StudyPhase,
    targetScore: 70,
  };
  
  const weights = getPhaseWeights(settings.studyPhase);
  
  const priorities = topics.map(topic => {
    const gap = settings.targetScore - topic.accuracy;
    const fase = weights[settings.studyPhase] || 0.3;
    const priority = (topic.recurrenceScore * 0.3) + (Math.max(0, gap) * 0.4) + (fase * 0.3);
    
    return {
      topic: topic.topic,
      subject: topic.subject,
      priority,
    };
  });
  
  return priorities.sort((a, b) => b.priority - a.priority);
}

export function projectScore(currentAccuracy: number, daysUntilExam: number, dailyRate: number): number {
  const improvementRate = dailyRate * 0.5;
  const projectedImprovement = improvementRate * Math.min(daysUntilExam, 60);
  const maxImprovement = Math.min(20, daysUntilExam * 0.3);
  
  return Math.min(
    currentAccuracy + projectedImprovement,
    currentAccuracy + maxImprovement
  );
}

export function calculatePriorityScore(
  recurrenceScore: number,
  accuracyGap: number,
  phase: StudyPhase
): number {
  const weights = getPhaseWeights(phase);
  const phaseWeight = weights[phase];
  return (recurrenceScore * 0.3) + (Math.max(0, accuracyGap) * 0.4) + (phaseWeight * 0.3);
}