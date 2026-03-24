import type { StudyPhase, Mission, MissionType, DailyMission, TopicPerformance } from '@/types';
// Importação simulada do banco para Next.js (Deveria vir de API em produção, mas o planner aqui usa cache/local)
// Para o modo 'Pós-Impacto', o planner precisa saber se houve simulado recente via Supabase.
import { createServerSupabaseClient } from '../supabase/server';

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

export function calculatePriority(weight: number, currentAccuracy: number, targetAccuracy: number): number {
  const threshold = targetAccuracy || 70;
  const gap = Math.max(0, (threshold - currentAccuracy) / threshold);
  return weight * (1 + gap);
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
  const { data: settings } = await supabase.from('profiles').select('*').eq('id', userId).single();
  const { data: topics } = await supabase.from('topic_performance').select('*').eq('id', userId);
  const { data: subjects } = await supabase.from('subjects').select('*'); // Should be filtered by active exam ideally
  const { count: dueCards } = await supabase.from('cards').select('*', { count: 'exact', head: true }).eq('user_id', userId).lte('due_date', new Date().toISOString());
  
  const mockImpact = await getMockImpact(userId);
  const dailyMinutesActive = settings?.daily_time_minutes || 180;
  const timePerItem = 2.0;
  const maxItemsToday = Math.floor(dailyMinutesActive / timePerItem);

  let itemsRemaining = maxItemsToday;
  let totalQuestions = 0;
  let totalReviews = 0;
  const missions: Mission[] = [];

  // 1. REPRODUÇÃO DE ERROS DO SIMULADO (PRIORIDADE F3.1)
  if (mockImpact && mockImpact.isFailed && mockImpact.criticalTopics.length > 0) {
      const target = Math.min(itemsRemaining, 20);
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

  // 2. REVISÕES PENDENTES (FSRS)
  if (dueCards && itemsRemaining > 0) {
    const reviewTarget = Math.min(dueCards, itemsRemaining, settings?.fsrs_daily_limit || 100);
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

  // 3. AVANÇO E REFORÇO (Baseado em Pesos + Gaps Tópico F2.2 + Impacto Simulado F3.1)
  if (itemsRemaining > 10 && subjects && subjects.length > 0) {
     const criticalMockSubjects = mockImpact?.isFailed ? mockImpact.criticalTopics : []; // Aqui criticalTopics na vdd são as matérias críticas no mock

     // Calcular prioridade para cada matéria
     const subjectsWithPriority = (subjects || []).map((s: any) => {
       let p = calculatePriority(s.weight, Number(s.current_accuracy), s.target_accuracy);
       
       // Boost F3.1: Se a matéria foi crítica no simulado (nota < 50%), aumenta peso em 50%
       if (criticalMockSubjects.includes(s.name)) {
          p *= 1.5;
       }
       return { ...s, calculatedPriority: p };
     }).sort((a: any, b: any) => b.calculatedPriority - a.calculatedPriority);

     const topSubject = subjectsWithPriority[0];
     
     // F2.2: Buscar tópicos desta matéria e calcular a prioridade específica de cada um
     const { data: subjectTopics } = await supabase
       .from('topic_performance')
       .select('*')
       .eq('user_id', userId)
       .eq('subject', topSubject.name);

     let targetTopic = 'Geral';
     if (subjectTopics && subjectTopics.length > 0) {
        const prioritizedTopics = subjectTopics.map((t: any) => {
           const threshold = topSubject.target_accuracy || 70;
           const trustFactor = t.attempts >= 5 ? 1 : (t.attempts / 5);
           const gap = Math.max(0, (threshold - t.accuracy) / threshold) * trustFactor;
           const recurrenceFactor = (t.recurrence_score || 0) / 100;
           
           return {
              ...t,
              topicPriority: (1 + gap) * (1 + recurrenceFactor)
           };
        }).sort((a: any, b: any) => b.topicPriority - a.topicPriority);

        targetTopic = prioritizedTopics[0].canonical_topic;
     }

     const questionsTarget = Math.min(itemsRemaining, settings?.fsrs_daily_new || 30);

     missions.push({
       id: crypto.randomUUID(),
       type: 'questions',
       subject: topSubject.name,
       topic: targetTopic,
       targetCount: questionsTarget,
       completedCount: 0,
       dueDate: new Date(),
     });
     totalQuestions += questionsTarget;
  }

  const explanation = mockImpact?.isFailed 
    ? `🚨 **Modo Pós-Impacto**: Foco total em reduzir o dano do último simulado.`
    : totalReviews > totalQuestions 
      ? "Dia de manutenção: limpando as pendências do radar polonês."
      : `Estratégia: Priorizando **${missions.find(m => m.type === 'questions')?.subject}** devido ao alto peso no edital e gap de acertos.`;

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