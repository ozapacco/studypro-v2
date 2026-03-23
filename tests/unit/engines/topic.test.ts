import { describe, it, expect, vi } from 'vitest';

interface TopicNormalization {
  rawTag: string;
  canonical: string;
  wasAutoCreated: boolean;
  confidence: number;
}

interface TopicPerformance {
  topic: string;
  errorCount: number;
  sessionDates: Date[];
}

const knownTopics: Record<string, string> = {
  'legítima defesa': 'legítima defesa',
  'estado de necessidade': 'estado de necessidade',
  'excesso punível': 'excesso punível',
  'imputabilidade': 'imputabilidade',
  'crime consumado': 'crime consumado',
  'crime tentado': 'crime tentado',
};

const normalizeTopic = (input: string): TopicNormalization => {
  const normalized = input.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  for (const [key, value] of Object.entries(knownTopics)) {
    const keyNormalized = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (keyNormalized === normalized || value.toLowerCase() === normalized) {
      return {
        rawTag: input,
        canonical: value,
        wasAutoCreated: false,
        confidence: 1.0,
      };
    }
  }
  
  return {
    rawTag: input,
    canonical: input.trim(),
    wasAutoCreated: true,
    confidence: 0.5,
  };
};

const calculateRecurrenceScore = (performance: TopicPerformance): number => {
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  const recentSessions = performance.sessionDates.filter(d => d >= twoWeeksAgo);
  if (recentSessions.length < 2) return 0;
  
  const frequency = (recentSessions.length / 14) * 100;
  const errorRate = (performance.errorCount / recentSessions.length) * 100;
  
  return Math.min(100, Math.round(frequency + errorRate));
};

describe('TopicEngine', () => {
  describe('normalize', () => {
    it('should return exact match', () => {
      const result = normalizeTopic('legítima defesa');
      expect(result.canonical).toBe('legítima defesa');
      expect(result.wasAutoCreated).toBe(false);
      expect(result.confidence).toBe(1.0);
    });
    
    it('should create new when no match', () => {
      const result = normalizeTopic('topico inexistente 123');
      expect(result.wasAutoCreated).toBe(true);
      expect(result.confidence).toBe(0.5);
    });
    
    it('should normalize accents', () => {
      const result = normalizeTopic('LEGITIMA DEFESA');
      expect(result.canonical).toBe('legítima defesa');
    });
    
    it('should handle case insensitivity', () => {
      const result = normalizeTopic('Estado de Necessidade');
      expect(result.canonical).toBe('estado de necessidade');
    });
    
    it('should handle trim whitespace', () => {
      const result = normalizeTopic('  legítima defesa  ');
      expect(result.canonical).toBe('legítima defesa');
    });
  });
  
  describe('calculateRecurrenceScore', () => {
    it('should return high score for frequent errors', () => {
      const now = new Date();
      const performance: TopicPerformance = {
        topic: 'legítima defesa',
        errorCount: 4,
        sessionDates: [
          new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
          new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        ],
      };
      
      const score = calculateRecurrenceScore(performance);
      expect(score).toBeGreaterThanOrEqual(50);
    });
    
    it('should return 0 for less than 2 sessions', () => {
      const now = new Date();
      const performance: TopicPerformance = {
        topic: 'legítima defesa',
        errorCount: 1,
        sessionDates: [new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)],
      };
      
      const score = calculateRecurrenceScore(performance);
      expect(score).toBe(0);
    });
    
    it('should return 0 for sessions older than 14 days', () => {
      const performance: TopicPerformance = {
        topic: 'legítima defesa',
        errorCount: 5,
        sessionDates: [
          new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        ],
      };
      
      const score = calculateRecurrenceScore(performance);
      expect(score).toBe(0);
    });
    
    it('should cap score at 100', () => {
      const now = new Date();
      const performance: TopicPerformance = {
        topic: 'legítima defesa',
        errorCount: 10,
        sessionDates: Array.from({ length: 10 }, (_, i) => 
          new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        ),
      };
      
      const score = calculateRecurrenceScore(performance);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});