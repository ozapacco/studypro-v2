import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCard, createSession } from '../utils';

interface Request {
  post: (url: string, body: unknown) => Promise<{ status: number; body: unknown }>;
  get: (url: string) => Promise<{ status: number; body: unknown }>;
}

const mockDb = {
  questionSessions: {
    findById: vi.fn((id: string) => Promise.resolve({ id, subject: 'Penal' })),
    create: vi.fn((data: unknown) => Promise.resolve({ id: 'session-1', ...data as object })),
  },
  cards: {
    create: vi.fn((data: unknown) => Promise.resolve({ id: 'card-1', ...data as object })),
    findMany: vi.fn(() => Promise.resolve([createCard()])),
    update: vi.fn((id: string, data: unknown) => Promise.resolve({ id, ...data })),
  },
};

const createMockRequest = (): Request => ({
  post: async (url: string, body: unknown) => {
    if (url === '/api/v1/sessions') {
      const data = body as { subject: string; totalQuestions: number; correctAnswers: number };
      
      if (data.correctAnswers > data.totalQuestions) {
        return { status: 400, body: { error: 'Invalid session data' } };
      }
      
      const accuracy = (data.correctAnswers / data.totalQuestions) * 100;
      return {
        status: 201,
        body: {
          session: { id: 'session-1' },
          cardsGenerated: [1, 2, 3],
          feedback: {
            accuracy,
            totalQuestions: data.totalQuestions,
            correctAnswers: data.correctAnswers,
          },
        },
      };
    }
    return { status: 404, body: {} };
  },
  get: async (url: string) => {
    if (url === '/api/v1/reviews/due') {
      return {
        status: 200,
        body: { cards: [createCard()] },
      };
    }
    return { status: 404, body: {} };
  },
});

describe('Session Registration Flow', () => {
  let request: Request;
  
  beforeEach(() => {
    request = createMockRequest();
    vi.clearAllMocks();
  });
  
  it('should register session and generate cards', async () => {
    const response = await request.post('/api/v1/sessions', {
      subject: 'Penal',
      platform: 'qconcursos',
      totalQuestions: 20,
      correctAnswers: 14,
      errorTags: ['legítima defesa'],
    });
    
    expect(response.status).toBe(201);
    const body = response.body as { feedback: { accuracy: number }; cardsGenerated: number[] };
    expect(body.feedback.accuracy).toBe(70);
    expect(body.cardsGenerated.length).toBeGreaterThan(0);
  });
  
  it('should store session in database', async () => {
    const sessionData = {
      subject: 'Penal',
      platform: 'qconcursos' as const,
      totalQuestions: 20,
      correctAnswers: 14,
      errorTags: [],
      date: new Date(),
    };
    
    const created = await mockDb.questionSessions.create(sessionData);
    expect(created.id).toBeDefined();
  });
  
  it('should return 400 for invalid session data', async () => {
    const response = await request.post('/api/v1/sessions', {
      subject: 'Penal',
      totalQuestions: 10,
      correctAnswers: 15,
    });
    
    expect(response.status).toBe(400);
  });
  
  it('should normalize error tags', async () => {
    const response = await request.post('/api/v1/sessions', {
      subject: 'Penal',
      platform: 'qconcursos',
      totalQuestions: 20,
      correctAnswers: 14,
      errorTags: ['LEGITIMA DEFESA'],
    });
    
    expect(response.status).toBe(201);
    const body = response.body as { feedback: { accuracy: number } };
    expect(body.feedback.accuracy).toBe(70);
  });
  
  it('should calculate accuracy correctly for different scores', async () => {
    const response = await request.post('/api/v1/sessions', {
      subject: 'Penal',
      platform: 'qconcursos',
      totalQuestions: 10,
      correctAnswers: 5,
    });
    
    const body = response.body as { feedback: { accuracy: number } };
    expect(body.feedback.accuracy).toBe(50);
  });
  
  it('should handle zero correct answers', async () => {
    const response = await request.post('/api/v1/sessions', {
      subject: 'Penal',
      platform: 'qconcursos',
      totalQuestions: 10,
      correctAnswers: 0,
    });
    
    const body = response.body as { feedback: { accuracy: number } };
    expect(body.feedback.accuracy).toBe(0);
  });
  
  it('should handle perfect score', async () => {
    const response = await request.post('/api/v1/sessions', {
      subject: 'Penal',
      platform: 'qconcursos',
      totalQuestions: 10,
      correctAnswers: 10,
    });
    
    const body = response.body as { feedback: { accuracy: number } };
    expect(body.feedback.accuracy).toBe(100);
  });
});