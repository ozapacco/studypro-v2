import type { RecoveryStatus, RecoveryReason, ErrorType } from '../../types';

interface RecoveryTrigger {
  detected: boolean;
  reason: RecoveryReason;
  subject: string;
  topic: string;
  errorCount: number;
}

const TRIGGER_THRESHOLD_LOW_ACCURACY = 0.6; // Se acurácia for < 60%

export async function evaluateSessionForRecovery(
  userId: string,
  subject: string,
  topic: string,
  correct: number,
  incorrect: number,
  errorType: ErrorType
): Promise<RecoveryTrigger | null> {
  const total = correct + incorrect;
  const accuracy = total > 0 ? (correct / total) : 0;

  // Gatilho 1: Erro "Nunca Aprendi"
  if (errorType === 'never_learned') {
    return {
      detected: true,
      reason: 'never_learned',
      subject,
      topic,
      errorCount: incorrect
    };
  }

  // Gatilho 2: Baixa acurácia persistente (< 60%)
  if (accuracy < TRIGGER_THRESHOLD_LOW_ACCURACY && total >= 5) {
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
  supabase: any, // Passado como argumento para evitar problemas de RootDir
  userId: string,
  subject: string,
  topic: string,
  reason: RecoveryReason,
  accuracy: number
) {
  // Verificar se já existe recuperação aberta
  const { data: existing } = await supabase
    .from('recovery_entries')
    .select('id, trigger_count, accuracy_history')
    .eq('user_id', userId)
    .eq('subject', subject)
    .eq('canonical_topic', topic)
    .eq('status', 'in_progress')
    .maybeSingle();

  const plan = generateRecoveryPlan(reason, topic);

  if (existing) {
    const history = [...(existing.accuracy_history || []), accuracy];
    await supabase
      .from('recovery_entries')
      .update({
        trigger_count: (existing.trigger_count || 0) + 1,
        accuracy_history: history,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
    return existing.id;
  } else {
    const { data: created } = await supabase
      .from('recovery_entries')
      .insert({
        user_id: userId,
        subject,
        canonical_topic: topic,
        reason,
        status: 'in_progress',
        accuracy_history: [accuracy],
        plan,
        trigger_count: 1
      })
      .select()
      .single();
    return created?.id;
  }
}

function generateRecoveryPlan(reason: RecoveryReason, topic: string): string {
  const plans: Record<RecoveryReason, any> = {
    recurrent_error: {
      steps: [
        { action: 'review_theory', duration: 30, description: `Revisar teoria base de ${topic}` },
        { action: 'fix_errors', count: 10, description: 'Refazer as últimas 10 questões erradas' }
      ],
      method: 'Teoria + Prática'
    },
    mock_exam: {
      steps: [
        { action: 'intensive_study', duration: 60, description: 'Estudo intensivo focado em falhas de simulado' }
      ],
      method: 'Retomada de Base'
    },
    never_learned: {
      steps: [
        { action: 'video_lecture', duration: 45, description: `Assistir videoaula completa sobre ${topic}` },
        { action: 'summary', description: 'Criar mapa mental ou resumo do zero' }
      ],
      method: 'Construção de Base'
    },
    low_accuracy: {
      steps: [
        { action: 'drill_questions', count: 20, description: 'Bateria de 20 questões nível fácil/médio' }
      ],
      method: 'Reforço de Acurácia'
    }
  };

  return JSON.stringify(plans[reason] || { steps: [] });
}