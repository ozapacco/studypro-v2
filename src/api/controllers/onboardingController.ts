import type { Request, Response } from 'express';
import { db } from '../../lib/db';
import { determineStudyPhase, getDaysUntilExam } from '../../lib/engines/planner';

const AVAILABLE_EXAMS = [
  'OAB',
  'ENEM',
  'Concurseiro',
  'Vestibular',
  'Policia Federal',
  'Tribunais',
];

const AVAILABLE_SUBJECTS = [
  'Direito Constitucional',
  'Direito Administrativo',
  'Direito Penal',
  'Processo Penal',
  'Direito Civil',
  'Processo Civil',
  'Direito Tributário',
  'Direito Empresarial',
  'Contabilidade',
  'Matemática Financeira',
  'Raciocínio Lógico',
  'Informática',
  'Português',
  'Ética Pública',
];

export async function getExams(req: Request, res: Response): Promise<void> {
  res.json({
    exams: AVAILABLE_EXAMS,
    subjects: AVAILABLE_SUBJECTS,
  });
}

export async function startOnboarding(req: Request, res: Response): Promise<void> {
  try {
    const existing = db.find<{ id: string; completed: boolean }>('onboarding_progress', { completed: false });
    
    if (existing) {
      res.status(400).json({ error: 'Onboarding already in progress', step: existing.id });
      return;
    }
    
    const progress = db.create('onboarding_progress', {
      step: 0,
      selectedExams: '[]',
      selectedSubjects: '[]',
      dailyGoal: 20,
      targetScore: 70,
      completed: false,
      startedAt: new Date().toISOString(),
    });
    
    res.status(201).json({
      id: progress.id,
      step: 0,
      message: 'Onboarding started. Use PUT to update step.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start onboarding' });
  }
}

export async function updateStep(req: Request, res: Response): Promise<void> {
  try {
    const { step } = req.params;
    const { selectedExams, selectedSubjects, dailyGoal, targetScore, examDate } = req.body;
    
    const progress = db.findOne<{ id: string; step: number; completed: boolean }>('onboarding_progress', req.body['id'] || 'default');
    
    if (!progress) {
      res.status(404).json({ error: 'No active onboarding progress' });
      return;
    }
    
    const updates: Record<string, unknown> = {
      step: parseInt(step),
    };
    
    if (selectedExams) {
      updates.selectedExams = JSON.stringify(selectedExams);
    }
    
    if (selectedSubjects) {
      updates.selectedSubjects = JSON.stringify(selectedSubjects);
    }
    
    if (dailyGoal) {
      updates.dailyGoal = dailyGoal;
    }
    
    if (examDate) {
      updates.examDate = examDate;
    }
    
    db.update('onboarding_progress', progress.id, updates);
    
    res.json({
      success: true,
      step: parseInt(step),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update onboarding step' });
  }
}

export async function completeOnboarding(req: Request, res: Response): Promise<void> {
  try {
    const progress = db.find<{ id: string; dailyGoal:number; targetScore:number; examDate:string; selectedExams:string[] }>('onboarding_progress', { completed: false });

    if (!progress) {
      res.status(404).json({ error: 'No active onboarding progress' });
      return;
    }

    const daysUntilExam = getDaysUntilExam(progress.examDate);
    const studyPhase = determineStudyPhase(progress.targetScore, daysUntilExam, 0);
    
    db.update('onboarding_progress', progress.id, {
      completed: true,
      completedAt: new Date().toISOString(),
    });
    
    db.create('user_settings', {
      user_id: progress.id,
      dailyGoal: progress.dailyGoal,
      studyPhase: studyPhase,
      targetScore: progress.targetScore,
      preferredPlatform: null,
      reviewLimit: 50,
      newCardsLimit: 10,
      theme: 'light',
      examDate: progress.examDate,
      selectedExams: progress.selectedExams,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    res.json({
      success: true,
      message: 'Onboarding completed!',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
}

export async function getProgress(req: Request, res: Response): Promise<void> {
  try {
    const progress = db.find<{ step: number; completed: boolean; selectedExams: string; selectedSubjects: string }>('onboarding_progress', { completed: false });
    
    if (!progress) {
      res.json({
        inProgress: false,
      });
      return;
    }
    
    res.json({
      inProgress: true,
      step: progress.step,
      selectedExams: JSON.parse(progress.selectedExams as unknown as string || '[]'),
      selectedSubjects: JSON.parse(progress.selectedSubjects as unknown as string || '[]'),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get onboarding progress' });
  }
}