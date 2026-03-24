import type { ErrorType, RecoveryReason } from '../../types';

interface RecoveryTrigger {
  detected: boolean;
  reason: RecoveryReason;
  subject: string;
  topic: string;
  errorCount: number;
}

const TRIGGER_THRESHOLD_LOW_ACCURACY = 0.6;

export async function evaluateSessionForRecovery(
  _userId: string,
  subject: string,
  topic: string,
  correct: number,
  incorrect: number,
  errorType: ErrorType
): Promise<RecoveryTrigger | null> {
  const total = correct + incorrect;
  const accuracy = total > 0 ? correct / total : 0;

  if (errorType === 'never_learned') {
    return {
      detected: true,
      reason: 'never_learned',
      subject,
      topic,
      errorCount: incorrect
    };
  }

  if (total >= 10 && accuracy < TRIGGER_THRESHOLD_LOW_ACCURACY) {
    return {
      detected: true,
      reason: 'low_accuracy',
      subject,
      topic,
      errorCount: incorrect
    };
  }

  return null;
}

export async function triggerRecovery(
  supabase: any,
  userId: string,
  subject: string,
  topic: string,
  reason: RecoveryReason,
  _accuracy: number,
  sessionId?: string,
  mockExamId?: string
) {
  const { data: existing } = await supabase
    .from('recovery_queue')
    .select('id, status')
    .eq('user_id', userId)
    .eq('subject', subject)
    .eq('canonical_topic', topic)
    .in('status', ['open', 'in_progress'])
    .maybeSingle();

  const suggestedActions = generateRecoveryPlan(reason, topic);

  if (existing) {
    await supabase
      .from('recovery_queue')
      .update({
        reason,
        suggested_actions: suggestedActions,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
    return existing.id;
  }

  const { data: created } = await supabase
    .from('recovery_queue')
    .insert({
      user_id: userId,
      subject,
      canonical_topic: topic,
      reason,
      status: 'open',
      suggested_actions: suggestedActions,
      created_from_session_id: sessionId,
      created_from_mock_exam_id: mockExamId
    })
    .select('id')
    .single();

  return created?.id;
}

function generateRecoveryPlan(reason: RecoveryReason, topic: string) {
  const plans: Record<RecoveryReason, any> = {
    recurrent_error: {
      method: 'Recuperacao Ativa',
      steps: [
        { action: 'review_theory', duration: 15, description: `Revisar teoria dirigida de ${topic}` },
        { action: 'drill_questions', count: 15, description: `Resolver 15 questoes focadas em ${topic}` },
        { action: 'summary', duration: 5, description: 'Registrar regra-chave em 1 linha' },
        { action: 'recheck', duration: 10, description: 'Rechecagem em 48-72h' }
      ]
    },
    mock_exam: {
      method: 'Pos-Simulado',
      steps: [
        { action: 'review_theory', duration: 15, description: `Rever pontos errados de ${topic} no simulado` },
        { action: 'drill_questions', count: 20, description: `Resolver 20 questoes de ${topic}` },
        { action: 'recheck', duration: 10, description: 'Rechecagem em 48-72h' }
      ]
    },
    never_learned: {
      method: 'Construcao de Base',
      steps: [
        { action: 'video_lecture', duration: 20, description: `Revisar base teorica de ${topic}` },
        { action: 'drill_questions', count: 10, description: `Resolver 10 questoes introdutorias de ${topic}` },
        { action: 'summary', duration: 5, description: 'Criar card-resumo do tema' },
        { action: 'recheck', duration: 10, description: 'Rechecagem em 48-72h' }
      ]
    },
    low_accuracy: {
      method: 'Reforco de Acuracia',
      steps: [
        { action: 'review_theory', duration: 10, description: `Revisao curta de ${topic}` },
        { action: 'drill_questions', count: 20, description: `Resolver 20 questoes de ${topic}` },
        { action: 'recheck', duration: 10, description: 'Rechecagem em 48-72h' }
      ]
    }
  };

  return plans[reason] || { method: 'Recuperacao', steps: [] };
}
