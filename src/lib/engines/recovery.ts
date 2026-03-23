import { db } from '../db';
import type { RecoveryEntry, QuestionSession, Card } from '../../models';
import type { RecoveryStatus, RecoveryReason, ErrorType } from '../../types';

interface RecoveryTrigger {
  detected: boolean;
  reason: RecoveryReason;
  topic: string;
  errorCount: number;
}

const TRIGGER_THRESHOLDS = {
  recurrent_error: 3,
  mock_exam: 50,
  never_learned: 0.3,
  low_accuracy: 0.5,
};

export function evaluate(session: QuestionSession): RecoveryTrigger[] {
  const triggers: RecoveryTrigger[] = [];
  
  if (session.incorrectCount >= TRIGGER_THRESHOLDS.recurrent_error) {
    const total = session.correctCount + session.incorrectCount;
    const errorRate = session.incorrectCount / total;
    
    if (errorRate >= 0.5) {
      triggers.push({
        detected: true,
        reason: 'recurrent_error',
        topic: session.topic,
        errorCount: session.incorrectCount,
      });
    }
  }
  
  if (session.correctCount + session.incorrectCount >= TRIGGER_THRESHOLDS.mock_exam) {
    const accuracy = session.correctCount / (session.correctCount + session.incorrectCount);
    
    if (accuracy <= TRIGGER_THRESHOLDS.low_accuracy) {
      triggers.push({
        detected: true,
        reason: 'mock_exam',
        topic: session.topic,
        errorCount: session.incorrectCount,
      });
    }
  }
  
  const neverLearnedCount = session.errorTypes.filter(e => e === 'never_learned').length;
  const totalErrors = session.incorrectCount;
  
  if (totalErrors > 0 && neverLearnedCount / totalErrors >= TRIGGER_THRESHOLDS.never_learned) {
    triggers.push({
      detected: true,
      reason: 'never_learned',
      topic: session.topic,
      errorCount: neverLearnedCount,
    });
  }
  
  return triggers;
}

export function triggerRecovery(session: QuestionSession): RecoveryEntry | null {
  const triggers = evaluate(session);
  
  if (triggers.length === 0) return null;
  
  const primaryTrigger = triggers[0];
  
  const existingRecovery = db.find<RecoveryEntry>('recoveries', {
    subject: session.subject,
    topic: session.topic,
    status: 'in_progress',
  });
  
  if (existingRecovery) {
    const accuracyHistory = JSON.parse(existingRecovery.accuracyHistory as unknown as string || '[]');
    accuracyHistory.push(session.correctCount / (session.correctCount + session.incorrectCount));
    
    const avgAccuracy = accuracyHistory.reduce((a, b) => a + b, 0) / accuracyHistory.length;
    
    db.update('recoveries', existingRecovery.id, {
      triggerCount: existingRecovery.triggerCount + 1,
      accuracyHistory: accuracyHistory as unknown as string,
    });
    
    return existingRecovery;
  }
  
  const cards = db.findAll<Card>('cards', { subject: session.subject, topic: session.topic });
  const cardIds = cards.map(c => c.id).slice(0, 20);
  
  const plan = generateRecoveryPlan(primaryTrigger.reason, session.topic);
  
  const recovery = db.create('recoveries', {
    subject: session.subject,
    topic: session.topic,
    reason: primaryTrigger.reason,
    status: 'in_progress',
    cardIds: cardIds as unknown as string,
    triggerCount: 1,
    accuracyHistory: [session.correctCount / (session.correctCount + session.incorrectCount)] as unknown as string,
    plan,
  }) as unknown as RecoveryEntry;
  
  return recovery;
}

function generateRecoveryPlan(reason: RecoveryReason, topic: string): string {
  switch (reason) {
    case 'recurrent_error':
      return JSON.stringify({
        steps: [
          { action: 'review_concept', duration: 15, description: 'Revisar conceito fundamental do tópico' },
          { action: 'practice_questions', count: 10, description: 'Resolver questões selecionadas' },
          { action: 'spaced_review', interval: '1d', description: 'Revisão espacada por 1 dia' },
        ],
        focus: 'Focar em entender o porquê das respostas erradas',
      });
    case 'mock_exam':
      return JSON.stringify({
        steps: [
          { action: 'diagnose_gaps', description: 'Diagnosticar lacunas de conhecimento' },
          { action: 'intensive_study', duration: 30, description: 'Estudo intensivo do tópico' },
          { action: 'targeted_practice', count: 20, description: 'Prática direcionada' },
        ],
        focus: 'Rever completo o tópico com ênfase em pontos fracos',
      });
    case 'never_learned':
      return JSON.stringify({
        steps: [
          { action: 'initial_study', duration: 20, description: 'Estudo inicial do conceito' },
          { action: 'basic_questions', count: 5, description: 'Questões básicas' },
          { action: 'progressively_harder', count: 10, description: 'Progressivamente mais difícil' },
        ],
        focus: 'Construir base sólida do zero',
      });
    case 'low_accuracy':
      return JSON.stringify({
        steps: [
          { action: 'review_fundamentals', duration: 25, description: 'Revisar fundamentos' },
          { action: 'focus_weak_areas', description: 'Focar em áreas mais fracas' },
          { action: 'consistent_practice', count: 15, description: 'Prática consistente' },
        ],
        focus: 'Aumentar precisão geral',
      });
    default:
      return JSON.stringify({ steps: [] });
  }
}

export function generateRecoveryPlan(reason: RecoveryReason, topic: string): string {
  const plans: Record<RecoveryReason, object> = {
    recurrent_error: {
      steps: [
        { action: 'review_concept', duration: 15 },
        { action: 'practice_questions', count: 10 },
        { action: 'spaced_review', interval: '1d' },
      ],
    },
    mock_exam: {
      steps: [
        { action: 'diagnose_gaps' },
        { action: 'intensive_study', duration: 30 },
        { action: 'targeted_practice', count: 20 },
      ],
    },
    never_learned: {
      steps: [
        { action: 'initial_study', duration: 20 },
        { action: 'basic_questions', count: 5 },
        { action: 'progressively_harder', count: 10 },
      ],
    },
    low_accuracy: {
      steps: [
        { action: 'review_fundamentals', duration: 25 },
        { action: 'focus_weak_areas' },
        { action: 'consistent_practice', count: 15 },
      ],
    },
  };
  
  return JSON.stringify(plans[reason] || { steps: [] });
}

export function getActiveRecoveries(): RecoveryEntry[] {
  return db.findAll<RecoveryEntry>('recoveries', { status: 'in_progress' });
}

export function completeRecovery(id: string): void {
  db.update('recoveries', id, {
    status: 'done',
    completedAt: new Date().toISOString(),
  });
}

export function archiveRecovery(id: string): void {
  db.update('recoveries', id, {
    status: 'archived',
    completedAt: new Date().toISOString(),
  });
}

export function getRecoveryStats(): { active: number; completed: number; archived: number } {
  const all = db.findAll<{ status: RecoveryStatus }>('recoveries');
  
  return {
    active: all.filter(r => r.status === 'in_progress').length,
    completed: all.filter(r => r.status === 'done').length,
    archived: all.filter(r => r.status === 'archived').length,
  };
}