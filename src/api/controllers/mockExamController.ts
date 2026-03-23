import type { Request, Response } from 'express';
import { createMockExam, getMockExams, getMockExamById, getMockExamsBySubject, diagnose, getMockExamStats } from '../../lib/engines/mockAnalyzer';
import type { Platform } from '../../types';

interface CreateMockExamBody {
  title: string;
  platform: Platform;
  subject: string;
  questions: {
    questionId: string;
    selectedAnswer?: string;
    isCorrect: boolean;
    isMarked: boolean;
  }[];
  duration?: number;
}

export async function createExam(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as CreateMockExamBody;
    
    if (!body.title || !body.platform || !body.subject || !body.questions?.length) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    const mockExam = createMockExam(body);
    
    res.status(201).json({
      id: mockExam.id,
      title: mockExam.title,
      totalQuestions: mockExam.totalQuestions,
      correctAnswers: mockExam.correctAnswers,
      accuracy: (mockExam.correctAnswers / mockExam.totalQuestions) * 100,
      postImpactMode: mockExam.postImpactMode,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create mock exam' });
  }
}

export async function listExams(req: Request, res: Response): Promise<void> {
  try {
    const { subject } = req.query;
    
    let exams;
    if (subject) {
      exams = getMockExamsBySubject(subject as string);
    } else {
      exams = getMockExams();
    }
    
    res.json({
      exams: exams.map(e => ({
        id: e.id,
        title: e.title,
        subject: e.subject,
        totalQuestions: e.totalQuestions,
        correctAnswers: e.correctAnswers,
        accuracy: e.totalQuestions > 0 ? (e.correctAnswers / e.totalQuestions) * 100 : 0,
        takenAt: e.takenAt,
        postImpactMode: e.postImpactMode,
      })),
      total: exams.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list mock exams' });
  }
}

export async function getExam(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const exam = getMockExamById(id);
    
    if (!exam) {
      res.status(404).json({ error: 'Mock exam not found' });
      return;
    }
    
    const diagnosis = diagnose(id);
    
    res.json({
      exam: {
        id: exam.id,
        title: exam.title,
        subject: exam.subject,
        totalQuestions: exam.totalQuestions,
        correctAnswers: exam.correctAnswers,
        duration: exam.duration,
        takenAt: exam.takenAt,
        completedAt: exam.completedAt,
        postImpactMode: exam.postImpactMode,
      },
      diagnosis,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get mock exam' });
  }
}

export async function getExamStats(req: Request, res: Response): Promise<void> {
  try {
    const stats = getMockExamStats();
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get mock exam stats' });
  }
}