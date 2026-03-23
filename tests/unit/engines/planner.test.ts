import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mission, RecoveryEntry, Subject, TopicScore } from '../../src/types';

interface PlannerContext {
  subjects: Subject[];
  overdueCards: number;
  recoveryEntry: RecoveryEntry | null;
  topicScores: TopicScore[];
  daysUntilExam: number;
}

const determineStudyPhase = (daysUntilExam: number): 'base' | 'intensification' | 'final' => {
  if (daysUntilExam > 84) return 'base';
  if (daysUntilExam >= 28) return 'intensification';
  return 'final';
};

const calculateSubjectPriority = (
  subject: Subject,
  currentAccuracy: number,
  targetAccuracy: number,
  phase: 'base' | 'intensification' | 'final'
): number => {
  const gap = targetAccuracy - currentAccuracy;
  let basePriority = 50 + gap;
  
  if (phase === 'intensification') basePriority *= 1.2;
  if (phase === 'final') basePriority *= 1.5;
  
  return Math.min(100, Math.max(0, basePriority));
};

const generateDailyMission = (ctx: PlannerContext): Mission => {
  const phase = determineStudyPhase(ctx.daysUntilExam);
  
  if (ctx.overdueCards >= 5) {
    return {
      id: Math.random().toString(36),
      type: 'review',
      subject: ctx.subjects[0]?.name || 'Penal',
      topic: null,
      targetCount: Math.min(ctx.overdueCards, 50),
      completedCount: 0,
      dueDate: new Date(),
    };
  }
  
  if (ctx.recoveryEntry && ctx.recoveryEntry.status === 'in_progress') {
    const hoursSinceCreation = (Date.now() - ctx.recoveryEntry.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation < 72) {
      return {
        id: Math.random().toString(36),
        type: 'recovery',
        subject: ctx.recoveryEntry.subject,
        topic: ctx.recoveryEntry.topic,
        targetCount: 10,
        completedCount: 0,
        dueDate: new Date(),
      };
    }
  }
  
  const targetAccuracy = phase === 'base' ? 60 : phase === 'intensification' ? 70 : 80;
  let bestSubject = ctx.subjects[0];
  let highestPriority = 0;
  
  for (const subject of ctx.subjects) {
    const priority = calculateSubjectPriority(subject, subject.accuracy, targetAccuracy, phase);
    if (priority > highestPriority) {
      highestPriority = priority;
      bestSubject = subject;
    }
  }
  
  return {
    id: Math.random().toString(36),
    type: 'questions',
    subject: bestSubject?.name || 'Penal',
    topic: null,
    targetCount: 20,
    completedCount: 0,
    dueDate: new Date(),
  };
};

const getProximityFactor = (daysUntilExam: number): number => {
  if (daysUntilExam <= 7) return 1.5;
  if (daysUntilExam <= 14) return 1.3;
  if (daysUntilExam <= 30) return 1.1;
  if (daysUntilExam <= 60) return 1.0;
  return 0.9;
};

const getMissionReason = (mission: Mission, stats: { dueCards: number; newCards: number }): string => {
  const reasons: Record<string, string> = {
    review: `Você tem ${stats.dueCards} cards pendentes para revisão`,
    questions: 'Hora de construir sua base de conhecimento',
    mock: 'Simulado agendado para hoje',
    recovery: 'Recuperação ativa recomendada após análise de desempenho',
  };
  return reasons[mission.type] || 'Missão do dia';
};

describe('PlannerEngine', () => {
  describe('generateDailyMission', () => {
    it('should prioritize review when 5+ overdue cards', () => {
      const ctx: PlannerContext = {
        subjects: [{ id: '1', name: 'Penal', accuracy: 65, questionCount: 100, createdAt: new Date(), updatedAt: new Date() }],
        overdueCards: 7,
        recoveryEntry: null,
        topicScores: [],
        daysUntilExam: 60,
      };
      
      const mission = generateDailyMission(ctx);
      expect(mission.type).toBe('review');
      expect(mission.targetCount).toBe(7);
    });
    
    it('should prioritize recovery when active and < 72h', () => {
      const recoveryEntry: RecoveryEntry = {
        id: 'rec-1',
        subject: 'Penal',
        topic: 'Legítima Defesa',
        reason: 'recurrent_error',
        status: 'in_progress',
        cardIds: ['c1', 'c2'],
        triggerCount: 3,
        accuracyHistory: [60, 50, 40],
        plan: 'Estudar',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      };
      
      const ctx: PlannerContext = {
        subjects: [{ id: '1', name: 'Penal', accuracy: 65, questionCount: 100, createdAt: new Date(), updatedAt: new Date() }],
        overdueCards: 2,
        recoveryEntry,
        topicScores: [],
        daysUntilExam: 60,
      };
      
      const mission = generateDailyMission(ctx);
      expect(mission.type).toBe('recovery');
      expect(mission.subject).toBe('Penal');
    });
    
    it('should generate questions mission otherwise', () => {
      const ctx: PlannerContext = {
        subjects: [{ id: '1', name: 'Penal', accuracy: 65, questionCount: 100, createdAt: new Date(), updatedAt: new Date() }],
        overdueCards: 2,
        recoveryEntry: null,
        topicScores: [],
        daysUntilExam: 90,
      };
      
      const mission = generateDailyMission(ctx);
      expect(mission.type).toBe('questions');
    });
  });
  
  describe('calculateSubjectPriority', () => {
    it('should increase priority for larger gaps', () => {
      const subject = { id: '1', name: 'Penal', accuracy: 50, questionCount: 100, createdAt: new Date(), updatedAt: new Date() };
      const priority = calculateSubjectPriority(subject, 50, 70, 'base');
      expect(priority).toBeGreaterThan(50);
    });
    
    it('should factor study phase', () => {
      const subject = { id: '1', name: 'Penal', accuracy: 60, questionCount: 100, createdAt: new Date(), updatedAt: new Date() };
      const basePriority = calculateSubjectPriority(subject, 60, 70, 'base');
      const finalPriority = calculateSubjectPriority(subject, 60, 70, 'final');
      expect(finalPriority).toBeGreaterThan(basePriority);
    });
  });
  
  describe('determineStudyPhase', () => {
    it('should return base when > 12 weeks', () => {
      expect(determineStudyPhase(105)).toBe('base');
      expect(determineStudyPhase(90)).toBe('base');
    });
    
    it('should return intensification when 4-12 weeks', () => {
      expect(determineStudyPhase(60)).toBe('intensification');
      expect(determineStudyPhase(28)).toBe('intensification');
    });
    
    it('should return final when < 4 weeks', () => {
      expect(determineStudyPhase(20)).toBe('final');
      expect(determineStudyPhase(7)).toBe('final');
    });
  });
  
  describe('getProximityFactor', () => {
    it('should return 1.5 when <= 7 days', () => {
      expect(getProximityFactor(7)).toBe(1.5);
      expect(getProximityFactor(3)).toBe(1.5);
      expect(getProximityFactor(1)).toBe(1.5);
    });
    
    it('should return 1.3 when 8-14 days', () => {
      expect(getProximityFactor(14)).toBe(1.3);
      expect(getProximityFactor(8)).toBe(1.3);
    });
    
    it('should return 1.1 when 15-30 days', () => {
      expect(getProximityFactor(30)).toBe(1.1);
      expect(getProximityFactor(15)).toBe(1.1);
    });
    
    it('should return 1.0 when 31-60 days', () => {
      expect(getProximityFactor(60)).toBe(1.0);
      expect(getProximityFactor(31)).toBe(1.0);
    });
    
    it('should return 0.9 when > 60 days', () => {
      expect(getProximityFactor(90)).toBe(0.9);
      expect(getProximityFactor(120)).toBe(0.9);
    });
  });
  
  describe('getMissionReason', () => {
    it('should return correct reason for review mission', () => {
      const mission: Mission = {
        id: '1',
        type: 'review',
        subject: 'Penal',
        topic: null,
        targetCount: 10,
        completedCount: 0,
        dueDate: new Date(),
      };
      const stats = { dueCards: 10, newCards: 0, averageAccuracy: 0, streakDays: 0 } as any;
      expect(getMissionReason(mission, stats)).toContain('cards pendentes');
    });
    
    it('should return correct reason for questions mission', () => {
      const mission: Mission = {
        id: '1',
        type: 'questions',
        subject: 'Penal',
        topic: null,
        targetCount: 20,
        completedCount: 0,
        dueDate: new Date(),
      };
      const stats = { dueCards: 0, newCards: 20, averageAccuracy: 0, streakDays: 0 } as any;
      expect(getMissionReason(mission, stats)).toContain('base de conhecimento');
    });
    
    it('should return correct reason for recovery mission', () => {
      const mission: Mission = {
        id: '1',
        type: 'recovery',
        subject: 'Penal',
        topic: null,
        targetCount: 10,
        completedCount: 0,
        dueDate: new Date(),
      };
      const stats = { dueCards: 0, newCards: 0, averageAccuracy: 0, streakDays: 0 } as any;
      expect(getMissionReason(mission, stats)).toContain('Recuperação');
    });
  });
});