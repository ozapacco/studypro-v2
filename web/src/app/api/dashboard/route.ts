import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateDailyMissionAsync } from '@/lib/engines/planner';

function computeStreak(sessionDates: string[]) {
  if (sessionDates.length === 0) return 0;

  const uniqueDates = Array.from(new Set(sessionDates.map((d) => d.split('T')[0]))).sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const last = uniqueDates[0];
  const daysDiff = Math.floor((new Date(today).getTime() - new Date(last).getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff > 1) return 0;

  let streak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const current = new Date(uniqueDates[i]).getTime();
    const next = new Date(uniqueDates[i + 1]).getTime();
    const diff = Math.floor((current - next) / (1000 * 60 * 60 * 24));
    if (diff === 1) streak += 1;
    else break;
  }

  return streak;
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];
  const [{ data: sessionsToday }, { data: allSessions }, { count: dueCards }, missionData] = await Promise.all([
    supabase
      .from('question_sessions')
      .select('total_questions, correct_answers')
      .eq('user_id', user.id)
      .gte('session_date', today),
    supabase
      .from('question_sessions')
      .select('session_date')
      .eq('user_id', user.id)
      .order('session_date', { ascending: false })
      .limit(60),
    supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lte('due_date', new Date().toISOString()),
    generateDailyMissionAsync(user.id)
  ]);

  const totalQuestions = (sessionsToday || []).reduce((acc: number, s: any) => acc + Number(s.total_questions || 0), 0);
  const totalHits = (sessionsToday || []).reduce((acc: number, s: any) => acc + Number(s.correct_answers || 0), 0);
  const accuracy = totalQuestions > 0 ? (totalHits / totalQuestions) * 100 : 0;
  const streak = computeStreak((allSessions || []).map((s: any) => String(s.session_date)));

  const mainMission = missionData.missions[0] || { topic: 'Geral', targetCount: 20, subject: 'Geral', type: 'questions' as const };
  const progress = mainMission.targetCount
    ? Math.min(100, Math.round((totalQuestions / mainMission.targetCount) * 100))
    : 0;

  return NextResponse.json({
    user: {
      name: user.user_metadata?.full_name || 'Concurseiro',
      avatar: user.user_metadata?.avatar_url
    },
    stats: {
      totalQuestions,
      accuracy: Math.round(accuracy),
      dueCards: dueCards || 0,
      streak
    },
    mission: {
      title: 'Missao do Dia',
      description: missionData.explanation || 'Plano diario adaptativo.',
      reason: missionData.explanation || 'Meta calculada pelo planner.',
      type: mainMission.type,
      progress,
      subject: mainMission.subject,
      topic: mainMission.topic
    }
  });
}
