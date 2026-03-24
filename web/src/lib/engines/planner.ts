import type { DailyMission, Mission, StudyPhase } from '@/types';
import { createServerSupabaseClient } from '../supabase/server';

function safeTodayISODate() {
  return new Date().toISOString().split('T')[0];
}

export function getDaysUntilExam(examDate: string | Date): number {
  const target = new Date(examDate).getTime();
  const now = new Date().getTime();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

// Fases pragmáticas: base (>12 semanas), intensificação (3-12 semanas), final (<= 3 semanas)
export function determineStudyPhase(daysUntilExam: number): StudyPhase {
  if (daysUntilExam <= 21) return 'final';
  if (daysUntilExam <= 84) return 'intensification';
  return 'base';
}

export function calculatePriority(weight: number, currentAccuracy: number, targetAccuracy: number): number {
  const threshold = targetAccuracy || 70;
  const gap = Math.max(0, (threshold - currentAccuracy) / threshold);
  return Number(weight || 0) * (1 + gap);
}

export async function getMockImpact(userId: string) {
  const supabase = createServerSupabaseClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recentMock } = await supabase
    .from('mock_exams')
    .select('id, total_score, cutoff_score, critical_topics, analysis, created_at')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!recentMock) return null;

  return {
    id: recentMock.id,
    isFailed: Number(recentMock.total_score) < Number(recentMock.cutoff_score || 70),
    criticalTopics: recentMock.critical_topics || [],
    analysis: recentMock.analysis || {}
  };
}

async function getActiveExam(supabase: any, userId: string) {
  const today = safeTodayISODate();

  const { data: upcoming } = await supabase
    .from('exams')
    .select('id, exam_date, name')
    .eq('user_id', userId)
    .gte('exam_date', today)
    .order('exam_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (upcoming) return upcoming;

  const { data: latest } = await supabase
    .from('exams')
    .select('id, exam_date, name')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return latest || null;
}

export async function generateDailyMissionAsync(userId: string): Promise<DailyMission> {
  const supabase = createServerSupabaseClient();
  const today = safeTodayISODate();

  const [profileRes, dueCardsRes, openRecoveryRes, mockImpact] = await Promise.all([
    supabase
      .from('profiles')
      .select('daily_time_minutes, target_accuracy, fsrs_daily_limit')
      .eq('id', userId)
      .single(),
    supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('due_date', new Date().toISOString()),
    supabase
      .from('recovery_queue')
      .select('id, subject, canonical_topic, reason')
      .eq('user_id', userId)
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    getMockImpact(userId)
  ]);

  const profile = profileRes.data;
  const dueCards = dueCardsRes.count || 0;
  const openRecovery = openRecoveryRes.data;

  const activeExam = await getActiveExam(supabase, userId);
  const daysUntilExam = activeExam?.exam_date ? getDaysUntilExam(activeExam.exam_date) : 120;
  const phase = determineStudyPhase(daysUntilExam);
  const dailyMinutes = Number(profile?.daily_time_minutes || 180);
  const targetAccuracy = Number(profile?.target_accuracy || 70);
  const reviewsLimit = Number(profile?.fsrs_daily_limit || 100);

  const missions: Mission[] = [];
  let explanation = 'Missão gerada pelo desempenho real.';
  let totalReviews = 0;
  let totalQuestions = 0;

  // Regra central: recuperação ativa pode substituir a missão normal.
  if (openRecovery) {
    const targetCount = Math.max(10, Math.min(30, Math.floor(dailyMinutes / 2)));
    missions.push({
      id: crypto.randomUUID(),
      type: 'recovery',
      subject: openRecovery.subject,
      topic: openRecovery.canonical_topic,
      targetCount,
      completedCount: 0,
      dueDate: new Date()
    });
    totalQuestions = targetCount;
    explanation = `Recuperação ativa de ${openRecovery.canonical_topic}: prioridade por erro recorrente (${openRecovery.reason}).`;
  } else if (dueCards > 5) {
    // Se houver >5 vencidos, revisão vem primeiro.
    const targetCount = Math.min(dueCards, reviewsLimit, Math.max(20, Math.floor(dailyMinutes / 2)));
    missions.push({
      id: crypto.randomUUID(),
      type: 'review',
      subject: 'all',
      topic: null,
      targetCount,
      completedCount: 0,
      dueDate: new Date()
    });
    totalReviews = targetCount;
    explanation = `Voce tem ${dueCards} revisoes vencidas. Limpar backlog de revisao vem antes das questoes.`;
  } else {
    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, name, weight, current_accuracy, target_accuracy')
      .eq('exam_id', activeExam?.id || '')
      .order('weight', { ascending: false });

    if (!subjects || subjects.length === 0) {
      missions.push({
        id: crypto.randomUUID(),
        type: 'questions',
        subject: 'Geral',
        topic: null,
        targetCount: 20,
        completedCount: 0,
        dueDate: new Date()
      });
      totalQuestions = 20;
      explanation = 'Cadastre disciplinas para ativar alocação adaptativa por peso + gap.';
    } else {
      const subjectsWithPriority = subjects
        .map((subject: any) => {
          let priority = calculatePriority(
            Number(subject.weight || 0),
            Number(subject.current_accuracy || 0),
            Number(subject.target_accuracy || targetAccuracy)
          );

          // Pós-impacto: reforço temporário nas matérias críticas do último simulado.
          if (mockImpact?.isFailed && (mockImpact.criticalTopics || []).includes(subject.name)) {
            priority *= 1.5;
          }

          return { ...subject, priority };
        })
        .sort((a: any, b: any) => b.priority - a.priority);

      const topSubject = subjectsWithPriority[0];

      const { data: topicPerformance } = await supabase
        .from('topic_performance')
        .select('canonical_topic, attempts, accuracy, recurrence_score')
        .eq('user_id', userId)
        .eq('subject', topSubject.name)
        .order('recurrence_score', { ascending: false })
        .order('accuracy', { ascending: true })
        .limit(15);

      const topicCandidate = (topicPerformance || []).find((t: any) => Number(t.attempts || 0) >= 3);
      const chosenTopic = topicCandidate?.canonical_topic || null;
      const targetCount = Math.max(20, Math.min(50, Math.floor(dailyMinutes / 3)));

      missions.push({
        id: crypto.randomUUID(),
        type: 'questions',
        subject: topSubject.name,
        topic: chosenTopic,
        targetCount,
        completedCount: 0,
        dueDate: new Date()
      });
      totalQuestions = targetCount;

      explanation = chosenTopic
        ? `${topSubject.name} está abaixo da meta e ${chosenTopic} concentra seus erros recentes. Fase atual: ${phase}.`
        : `${topSubject.name} recebeu prioridade por peso do edital e gap de desempenho. Fase atual: ${phase}.`;
    }
  }

  return {
    date: today,
    missions,
    estimatedMinutes: Math.round((totalQuestions + totalReviews) * 2),
    totalQuestions,
    totalReviews,
    explanation
  };
}

export function generateDailyMission(): DailyMission {
  return {
    date: safeTodayISODate(),
    missions: [],
    estimatedMinutes: 0,
    totalQuestions: 0,
    totalReviews: 0,
    explanation: 'Carregando missão...'
  };
}
