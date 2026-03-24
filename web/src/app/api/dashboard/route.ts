import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateDailyMissionAsync } from '@/lib/engines/planner';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Buscar métricas do dia (Question Sessions de hoje)
  const today = new Date().toISOString().split('T')[0];
  const { data: sessions } = await supabase
    .from('question_sessions')
    .select('*')
    .eq('user_id', user.id)
    .gte('session_date', today);

  // 2. Buscar Cards Pendentes (FSRS)
  const { count: dueCards } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('due_date', new Date().toISOString());

  // 3. GERAR MISSÃO (Motor Assíncrono F3.1 - Modo Impacto)
  const missionData = await generateDailyMissionAsync(user.id);

  const totalQuestions = sessions?.reduce((acc, s) => acc + s.total_questions, 0) || 0;
  const totalHits = sessions?.reduce((acc, s) => acc + s.correct_answers, 0) || 0;
  const accuracy = totalQuestions > 0 ? (totalHits / totalQuestions) * 100 : 0;

  const mainMission = missionData.missions[0] || { topic: 'Geral', targetCount: 50 };

  return NextResponse.json({
    user: {
      name: user.user_metadata?.full_name || 'Guerreiro',
      avatar: user.user_metadata?.avatar_url
    },
    stats: {
      totalQuestions,
      accuracy: Math.round(accuracy),
      dueCards: dueCards || 0,
      streak: 3 // Mocked
    },
    mission: {
      title: missionData.explanation?.includes('Impacto') ? "Missão: Recuperação de Guerra" : "Missão do Dia",
      description: missionData.explanation || "Continue sua evolução diária.",
      reason: missionData.explanation || "Meta calculada pelo motor de prioridade.",
      type: missionData.explanation?.includes('Impacto') ? 'Recuperação' : 'Meta Base',
      progress: Math.min(100, Math.round((totalQuestions / mainMission.targetCount) * 100)),
      subject: mainMission.subject,
      topic: mainMission.topic
    }
  });
}
