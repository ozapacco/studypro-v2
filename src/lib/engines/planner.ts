import type { StudyPhase, Mission, MissionType, DailyMission, TopicPerformance } from '../../types';
// Importação simulada do banco para Next.js (Deveria vir de API em produção, mas o planner aqui usa cache/local)
// Para o modo 'Pós-Impacto', o planner precisa saber se houve simulado recente via Supabase.
import { createServerSupabaseClient } from '../../../web/src/lib/supabase/server';

interface DailyStats {
  totalCards: number;
  dueCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  averageAccuracy: number;
  streakDays: number;
}

export function getDaysUntilExam(examDate: string | Date): number {
  const diff = new Date(examDate).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function determineStudyPhase(targetScore: number, daysUntilExam: number, currentAccuracy: number): StudyPhase {
  if (daysUntilExam <= 7) return 'final';
  if (daysUntilExam <= 21 || currentAccuracy >= targetScore - 5) return 'intensification';
  return 'base';
}

function getPhaseWeights(phase: StudyPhase) {
  switch (phase) {
    case 'base': return { base: 0.6, intensification: 0.25, final: 0.15 };
    case 'intensification': return { base: 0.3, intensification: 0.5, final: 0.2 };
    case 'final': return { base: 0.15, intensification: 0.35, final: 0.5 };
    default: return { base: 0.5, intensification: 0.3, final: 0.2 };
  }
}

// NOVO: Detecção de Impacto de Simulado (F3.1)
export async function getMockImpact(userId: string) {
  const supabase = createServerSupabaseClient();
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  
  const { data: recentMock } = await supabase
    .from('mock_exams')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', fortyEightHoursAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!recentMock) return null;

  const isFailed = (recentMock.total_score < (recentMock.cutoff_score || 70));
  return {
    id: recentMock.id,
    isFailed,
    criticalTopics: recentMock.critical_topics || [],
    analysis: recentMock.analysis
  };
}

export async function generateDailyMissionAsync(userId: string): Promise<DailyMission> {
  const supabase = createServerSupabaseClient();
  
  // 1. Fetch data
  const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', userId).single();
  const { data: topics } = await supabase.from('topic_performance').select('*').eq('user_id', userId);
  const { count: dueCards } = await supabase.from('cards').select('*', { count: 'exact', head: true }).eq('user_id', userId).lte('due_date', new Date().toISOString());
  
  const mockImpact = await getMockImpact(userId);
  const dailyMinutesActive = settings?.daily_goal || 120;
  const timePerItem = 2.0;
  const maxItemsToday = Math.floor(dailyMinutesActive / timePerItem);

  let itemsRemaining = maxItemsToday;
  let totalQuestions = 0;
  let totalReviews = 0;
  const missions: Mission[] = [];

  // 1. REPRODUÇÃO DE ERROS DO SIMULADO (PRIORIDADE F3.1)
  if (mockImpact && mockImpact.isFailed && mockImpact.criticalTopics.length > 0) {
      const target = Math.min(itemsRemaining, 15);
      missions.push({
        id: crypto.randomUUID(),
        type: 'questions',
        subject: 'VÁRIAS (Simulado)',
        topic: mockImpact.criticalTopics[0],
        targetCount: target,
        completedCount: 0,
        dueDate: new Date(),
      });
      totalQuestions += target;
      itemsRemaining -= target;
  }

  // 2. REVISÕES PENDENTES
  if (dueCards && itemsRemaining > 0) {
    const reviewTarget = Math.min(dueCards, itemsRemaining, settings?.review_limit || 50);
    missions.push({
      id: crypto.randomUUID(),
      type: 'review',
      subject: 'all',
      topic: null,
      targetCount: reviewTarget,
      completedCount: 0,
      dueDate: new Date(),
    });
    totalReviews += reviewTarget;
    itemsRemaining -= reviewTarget;
  }

  // 3. AVANÇO (Tópico Crítico Geral)
  if (itemsRemaining > 5) {
     const sortedTopics = (topics || []).sort((a,b) => (b.recurrence_score || 0) - (a.recurrence_score || 0));
     const topTopic = sortedTopics[0];
     if (topTopic) {
        const questionsTarget = Math.min(itemsRemaining, settings?.new_cards_limit || 30);
        missions.push({
          id: crypto.randomUUID(),
          type: 'questions',
          subject: topTopic.subject,
          topic: topTopic.canonical_topic,
          targetCount: questionsTarget,
          completedCount: 0,
          dueDate: new Date(),
        });
        totalQuestions += questionsTarget;
     }
  }

  const explanation = mockImpact?.isFailed 
    ? `🚨 **Modo Pós-Impacto**: Priorizando ${mockImpact.criticalTopics[0]} devido ao resultado do último simulado.`
    : totalReviews > totalQuestions 
      ? "Dia focado em consolidar o radar polonês (muita revisão)."
      : "Rumo ao topo: equilíbrio entre avanço e manutenção.";

  return {
    date: new Date().toISOString().split('T')[0],
    missions,
    estimatedMinutes: Math.round((totalQuestions + totalReviews) * timePerItem),
    totalQuestions,
    totalReviews,
    explanation
  };
}

// Compatibilidade Síncrona (Mock)
export function generateDailyMission(): DailyMission {
  return {
    date: new Date().toISOString().split('T')[0],
    missions: [],
    estimatedMinutes: 0,
    totalQuestions: 0,
    totalReviews: 0,
    explanation: "Carregando..."
  };
}