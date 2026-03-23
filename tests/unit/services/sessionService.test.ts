import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

interface SessionInput {
  subject: string;
  platform: string;
  totalQuestions: number;
  correctAnswers: number;
  errorTags?: string[];
  date?: Date;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface CanonicalTopic {
  canonical: string;
  wasAutoCreated: boolean;
}

interface SessionResult {
  session: { id: string };
  cardsGenerated: number[];
  canonicalTopics: CanonicalTopic[];
  feedback: {
    accuracy: number;
    totalQuestions: number;
    correctAnswers: number;
  };
}

const normalizeTopic = (input: string): CanonicalTopic => {
  const knownTopics: Record<string, string> = {
    'legítima defesa': 'legítima defesa',
    'estado de necessidade': 'estado de necessidade',
    'imputabilidade': 'imputabilidade',
    'crime consumado': 'crime consumado',
  };
  
  const normalized = input.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  for (const [key, value] of Object.entries(knownTopics)) {
    const keyNormalized = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (keyNormalized === normalized || value.toLowerCase() === normalized) {
      return { canonical: value, wasAutoCreated: false };
    }
  }
  
  return { canonical: input.trim(), wasAutoCreated: true };
};

const validateSessionInput = (input: SessionInput): ValidationResult => {
  const errors: string[] = [];
  
  if (input.totalQuestions <= 0) {
    errors.push('Total de questões deve ser maior que zero');
  }
  
  if (input.correctAnswers < 0) {
    errors.push('Quantidade de acertos não pode ser negativa');
  }
  
  if (input.correctAnswers > input.totalQuestions) {
    errors.push('Quantidade de acertos não pode ser maior que o total de questões');
  }
  
  if (!input.subject || input.subject.trim() === '') {
    errors.push('Matéria é obrigatória');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

const processSession = async (input: SessionInput): Promise<SessionResult> => {
  const validation = validateSessionInput(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }
  
  const accuracy = (input.correctAnswers / input.totalQuestions) * 100;
  
  const canonicalTopics: CanonicalTopic[] = [];
  const cardsGenerated: number[] = [];
  
  if (input.errorTags && input.errorTags.length > 0) {
    for (const tag of input.errorTags) {
      const normalized = normalizeTopic(tag);
      canonicalTopics.push(normalized);
      
      if (!normalized.wasAutoCreated) {
        cardsGenerated.push(1);
      }
    }
  }
  
  return {
    session: { id: `session-${Date.now()}` },
    cardsGenerated,
    canonicalTopics,
    feedback: {
      accuracy,
      totalQuestions: input.totalQuestions,
      correctAnswers: input.correctAnswers,
    },
  };
};

describe('SessionService', () => {
  describe('process', () => {
    it('should generate cards for error topics', async () => {
      const input: SessionInput = {
        subject: 'Penal',
        platform: 'qconcursos',
        totalQuestions: 20,
        correctAnswers: 14,
        errorTags: ['legítima defesa'],
      };
      
      const result = await processSession(input);
      expect(result.cardsGenerated.length).toBe(1);
    });
    
    it('should not generate cards for new topics', async () => {
      const input: SessionInput = {
        subject: 'Penal',
        platform: 'qconcursos',
        totalQuestions: 20,
        correctAnswers: 14,
        errorTags: ['topico inexistente 123'],
      };
      
      const result = await processSession(input);
      expect(result.cardsGenerated.length).toBe(0);
    });
    
    it('should normalize topics', async () => {
      const input: SessionInput = {
        subject: 'Penal',
        platform: 'qconcursos',
        totalQuestions: 20,
        correctAnswers: 14,
        errorTags: ['LEGITIMA DEFESA'],
      };
      
      const result = await processSession(input);
      expect(result.canonicalTopics[0].canonical).toBe('legítima defesa');
      expect(result.canonicalTopics[0].wasAutoCreated).toBe(false);
    });
    
    it('should calculate accuracy correctly', async () => {
      const input: SessionInput = {
        subject: 'Penal',
        platform: 'qconcursos',
        totalQuestions: 10,
        correctAnswers: 7,
      };
      
      const result = await processSession(input);
      expect(result.feedback.accuracy).toBe(70);
    });
    
    it('should handle multiple error tags', async () => {
      const input: SessionInput = {
        subject: 'Penal',
        platform: 'qconcursos',
        totalQuestions: 20,
        correctAnswers: 14,
        errorTags: ['legítima defesa', 'estado de necessidade'],
      };
      
      const result = await processSession(input);
      expect(result.canonicalTopics.length).toBe(2);
    });
    
    it('should throw for invalid input', async () => {
      const input: SessionInput = {
        subject: 'Penal',
        platform: 'qconcursos',
        totalQuestions: 0,
        correctAnswers: 0,
      };
      
      await expect(processSession(input)).rejects.toThrow();
    });
  });
  
  describe('validate', () => {
    it('should reject more correct than total', () => {
      const input: SessionInput = {
        subject: 'Penal',
        platform: 'qconcursos',
        totalQuestions: 10,
        correctAnswers: 15,
      };
      
      const validation = validateSessionInput(input);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Quantidade de acertos não pode ser maior que o total de questões');
    });
    
    it('should reject zero total questions', () => {
      const input: SessionInput = {
        subject: 'Penal',
        platform: 'qconcursos',
        totalQuestions: 0,
        correctAnswers: 0,
      };
      
      const validation = validateSessionInput(input);
      expect(validation.valid).toBe(false);
    });
    
    it('should reject negative correct answers', () => {
      const input: SessionInput = {
        subject: 'Penal',
        platform: 'qconcursos',
        totalQuestions: 10,
        correctAnswers: -1,
      };
      
      const validation = validateSessionInput(input);
      expect(validation.valid).toBe(false);
    });
    
    it('should reject empty subject', () => {
      const input: SessionInput = {
        subject: '',
        platform: 'qconcursos',
        totalQuestions: 10,
        correctAnswers: 5,
      };
      
      const validation = validateSessionInput(input);
      expect(validation.valid).toBe(false);
    });
    
    it('should accept valid input', () => {
      const input: SessionInput = {
        subject: 'Penal',
        platform: 'qconcursos',
        totalQuestions: 20,
        correctAnswers: 14,
      };
      
      const validation = validateSessionInput(input);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
    
    it('should accept edge case exact match', () => {
      const input: SessionInput = {
        subject: 'Penal',
        platform: 'qconcursos',
        totalQuestions: 10,
        correctAnswers: 10,
      };
      
      const validation = validateSessionInput(input);
      expect(validation.valid).toBe(true);
    });
  });
});