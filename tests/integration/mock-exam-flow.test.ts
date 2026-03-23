import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSubject } from '../utils';

interface MockExamInput {
  name: string;
  date: string;
  totalScore: number;
  maxScore: number;
  cutoffScore: number;
  bySubject: Array<{ subject: string; score: number; maxScore: number }>;
}

interface CategoryDiagnosis {
  critical: string[];
  warning: string[];
  stable: string[];
}

interface PostImpactConfig {
  mode: boolean;
  reviewLimit: number;
  newCardsLimit: number;
}

interface MockExamResult {
  id: string;
  diagnosis: {
    categories: CategoryDiagnosis;
    recommendations: string[];
  };
  postImpactConfig: PostImpactConfig;
}

const analyzeMockExam = (input: MockExamInput): MockExamResult => {
  const categories: CategoryDiagnosis = {
    critical: [],
    warning: [],
    stable: [],
  };
  
  const recommendations: string[] = [];
  
  for (const subjectScore of input.bySubject) {
    const accuracy = (subjectScore.score / subjectScore.maxScore) * 100;
    
    if (accuracy < 50) {
      categories.critical.push(subjectScore.subject);
    } else if (accuracy < input.cutoffScore) {
      categories.warning.push(subjectScore.subject);
    } else {
      categories.stable.push(subjectScore.subject);
    }
  }
  
  const overallAccuracy = (input.totalScore / input.maxScore) * 100;
  
  if (overallAccuracy < input.cutoffScore) {
    recommendations.push('Focar em revisão de conceitos básicos');
    recommendations.push('Aumentar tempo de estudo diário');
    
    if (categories.critical.length > 0) {
      recommendations.push(`Priorizar matéria ${categories.critical.join(', ')}`);
    }
  }
  
  let postImpactConfig: PostImpactConfig;
  
  if (overallAccuracy < 50) {
    postImpactConfig = {
      mode: true,
      reviewLimit: 50,
      newCardsLimit: 5,
    };
  } else if (overallAccuracy < 70) {
    postImpactConfig = {
      mode: true,
      reviewLimit: 30,
      newCardsLimit: 10,
    };
  } else {
    postImpactConfig = {
      mode: false,
      reviewLimit: 20,
      newCardsLimit: 20,
    };
  }
  
  return {
    id: `mock-${Date.now()}`,
    diagnosis: {
      categories,
      recommendations,
    },
    postImpactConfig,
  };
};

describe('Mock Exam Flow', () => {
  it('should register mock and generate diagnosis', () => {
    const mockExam: MockExamInput = {
      name: 'Simulado Penal 1',
      date: new Date().toISOString(),
      totalScore: 55,
      maxScore: 100,
      cutoffScore: 70,
      bySubject: [
        { subject: 'Penal', score: 45, maxScore: 100 },
      ],
    };
    
    const result = analyzeMockExam(mockExam);
    
    expect(result.diagnosis.categories.critical).toContain('Penal');
    expect(result.postImpactConfig).toBeDefined();
    expect(result.postImpactConfig.mode).toBe(true);
  });
  
  it('should categorize stable subjects above cutoff', () => {
    const mockExam: MockExamInput = {
      name: 'Simulado Completo',
      date: new Date().toISOString(),
      totalScore: 80,
      maxScore: 100,
      cutoffScore: 70,
      bySubject: [
        { subject: 'Penal', score: 80, maxScore: 100 },
      ],
    };
    
    const result = analyzeMockExam(mockExam);
    
    expect(result.diagnosis.categories.stable).toContain('Penal');
    expect(result.diagnosis.categories.critical).not.toContain('Penal');
  });
  
  it('should categorize warning subjects between 50% and cutoff', () => {
    const mockExam: MockExamInput = {
      name: 'Simulado Médio',
      date: new Date().toISOString(),
      totalScore: 60,
      maxScore: 100,
      cutoffScore: 70,
      bySubject: [
        { subject: 'Penal', score: 60, maxScore: 100 },
      ],
    };
    
    const result = analyzeMockExam(mockExam);
    
    expect(result.diagnosis.categories.warning).toContain('Penal');
  });
  
  it('should handle multiple subjects correctly', () => {
    const mockExam: MockExamInput = {
      name: 'Simulado Misto',
      date: new Date().toISOString(),
      totalScore: 55,
      maxScore: 200,
      cutoffScore: 70,
      bySubject: [
        { subject: 'Penal', score: 40, maxScore: 100 },
        { subject: 'Processo Penal', score: 80, maxScore: 100 },
      ],
    };
    
    const result = analyzeMockExam(mockExam);
    
    expect(result.diagnosis.categories.critical).toContain('Penal');
    expect(result.diagnosis.categories.stable).toContain('Processo Penal');
  });
  
  it('should generate recommendations for low scores', () => {
    const mockExam: MockExamInput = {
      name: 'Simulado Baixo',
      date: new Date().toISOString(),
      totalScore: 40,
      maxScore: 100,
      cutoffScore: 70,
      bySubject: [
        { subject: 'Penal', score: 40, maxScore: 100 },
      ],
    };
    
    const result = analyzeMockExam(mockExam);
    
    expect(result.diagnosis.recommendations.length).toBeGreaterThan(0);
  });
  
  it('should configure aggressive post impact for critical subjects', () => {
    const mockExam: MockExamInput = {
      name: 'Simulado Crítico',
      date: new Date().toISOString(),
      totalScore: 40,
      maxScore: 100,
      cutoffScore: 70,
      bySubject: [
        { subject: 'Penal', score: 40, maxScore: 100 },
      ],
    };
    
    const result = analyzeMockExam(mockExam);
    
    expect(result.postImpactConfig.reviewLimit).toBe(50);
    expect(result.postImpactConfig.newCardsLimit).toBe(5);
  });
  
  it('should configure moderate post impact for warning subjects', () => {
    const mockExam: MockExamInput = {
      name: 'Simulado Moderado',
      date: new Date().toISOString(),
      totalScore: 60,
      maxScore: 100,
      cutoffScore: 70,
      bySubject: [
        { subject: 'Penal', score: 60, maxScore: 100 },
      ],
    };
    
    const result = analyzeMockExam(mockExam);
    
    expect(result.postImpactConfig.reviewLimit).toBe(30);
    expect(result.postImpactConfig.newCardsLimit).toBe(10);
  });
  
  it('should disable post impact for stable subjects', () => {
    const mockExam: MockExamInput = {
      name: 'Simulado Bom',
      date: new Date().toISOString(),
      totalScore: 85,
      maxScore: 100,
      cutoffScore: 70,
      bySubject: [
        { subject: 'Penal', score: 85, maxScore: 100 },
      ],
    };
    
    const result = analyzeMockExam(mockExam);
    
    expect(result.postImpactConfig.mode).toBe(false);
  });
  
  it('should calculate overall accuracy correctly', () => {
    const mockExam: MockExamInput = {
      name: 'Simulado Cálculo',
      date: new Date().toISOString(),
      totalScore: 75,
      maxScore: 100,
      cutoffScore: 70,
      bySubject: [
        { subject: 'Penal', score: 75, maxScore: 100 },
      ],
    };
    
    const result = analyzeMockExam(mockExam);
    
    expect(result.diagnosis.categories.stable).toContain('Penal');
  });
  
  it('should handle edge case perfect score', () => {
    const mockExam: MockExamInput = {
      name: 'Simulado Perfeito',
      date: new Date().toISOString(),
      totalScore: 100,
      maxScore: 100,
      cutoffScore: 70,
      bySubject: [
        { subject: 'Penal', score: 100, maxScore: 100 },
      ],
    };
    
    const result = analyzeMockExam(mockExam);
    
    expect(result.diagnosis.categories.stable).toContain('Penal');
    expect(result.postImpactConfig.mode).toBe(false);
  });
  
  it('should handle edge case zero score', () => {
    const mockExam: MockExamInput = {
      name: 'Simulado Zero',
      date: new Date().toISOString(),
      totalScore: 0,
      maxScore: 100,
      cutoffScore: 70,
      bySubject: [
        { subject: 'Penal', score: 0, maxScore: 100 },
      ],
    };
    
    const result = analyzeMockExam(mockExam);
    
    expect(result.diagnosis.categories.critical).toContain('Penal');
    expect(result.postImpactConfig.mode).toBe(true);
    expect(result.postImpactConfig.newCardsLimit).toBe(5);
  });
});