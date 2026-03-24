import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Consistency Heatmap (Last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: sessions } = await supabase
    .from('question_sessions')
    .select('session_date, total_questions, correct_answers, platform')
    .eq('user_id', user.id)
    .gte('session_date', ninetyDaysAgo.toISOString().split('T')[0]);

  // 2. Performance by Platform
  const platforms: Record<string, { total: number; hits: number }> = {};
  (sessions || []).forEach((s: any) => {
    const p = s.platform || 'Other';
    if (!platforms[p]) platforms[p] = { total: 0, hits: 0 };
    platforms[p].total += s.total_questions;
    platforms[p].hits += s.correct_answers;
  });

  // 3. Weekly Evolution (Last 8 weeks)
  const weeklyStats: Record<string, { total: number; hits: number }> = {};
  (sessions || []).forEach((s: any) => {
    const date = new Date(s.session_date);
    const week = getWeekNumber(date);
    const key = `W${week}-${date.getFullYear()}`;
    if (!weeklyStats[key]) weeklyStats[key] = { total: 0, hits: 0 };
    weeklyStats[key].total += s.total_questions;
    weeklyStats[key].hits += s.correct_answers;
  });

  // 4. Topic Ranking (Best vs Worst) - Reuse from TopicPerformance
  const { data: topics } = await supabase
    .from('topic_performance')
    .select('subject, canonical_topic, accuracy, attempts')
    .eq('user_id', user.id)
    .order('accuracy', { ascending: false });

  // 5. Recovery Stats (F2.7.5)
  const { data: recoveryItems } = await supabase
    .from('recovery_queue')
    .select('status')
    .eq('user_id', user.id);

  const recoveryStats = {
     open: recoveryItems?.filter((i: any) => i.status === 'open' || i.status === 'in_progress').length || 0,
     done: recoveryItems?.filter((i: any) => i.status === 'done').length || 0,
  };

  // 6. Totais Globais
  const { data: profile } = await supabase
    .from('profiles')
    .select('target_accuracy')
    .eq('id', user.id)
    .single();

  const totalQuestionsAll = (sessions || []).reduce((acc: number, s: any) => acc + Number(s.total_questions || 0), 0);
  const totalHitsAll = (sessions || []).reduce((acc: number, s: any) => acc + Number(s.correct_answers || 0), 0);
  const averageAccuracyAll = totalQuestionsAll > 0 ? Math.round((totalHitsAll / totalQuestionsAll) * 100) : 0;

  // 7. Cálculo de Projeção (F2.6)
  const { data: allSubjects } = await supabase.from('subjects').select('weight, current_accuracy').eq('exam_id', (await supabase.from('exams').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()).data?.id);
  
  let weightedSum = 0;
  let totalWeight = 0;
  (allSubjects || []).forEach((sub: any) => {
      weightedSum += (Number(sub.current_accuracy) * sub.weight);
      totalWeight += sub.weight;
  });
  const projection = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : averageAccuracyAll;

  return NextResponse.json({
    totals: {
       questions: totalQuestionsAll,
       accuracy: averageAccuracyAll,
       target: profile?.target_accuracy || 70
    },
    projection,
    recovery: recoveryStats,
    heatmap: sessions || [],
    platforms,
    weekly: Object.entries(weeklyStats)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, val]) => ({
        week: key,
        accuracy: Math.round((val.hits / val.total) * 100)
      })).slice(-8),
    ranking: topics || []
  });
}

function getWeekNumber(d: Date): number {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}
