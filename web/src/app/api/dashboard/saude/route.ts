import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [{ data: mocks }, { data: recoveries }, { data: topics }] = await Promise.all([
    supabase
      .from('mock_exams')
      .select('id, exam_date, total_score, cutoff_score, analysis, created_at')
      .eq('user_id', user.id)
      .order('exam_date', { ascending: true }),
    supabase
      .from('recovery_queue')
      .select('id, subject, canonical_topic, reason, status, created_at')
      .eq('user_id', user.id)
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false }),
    supabase
      .from('topic_performance')
      .select('subject, canonical_topic, attempts, accuracy, recurrence_score, personal_difficulty')
      .eq('user_id', user.id)
      .order('accuracy', { ascending: false })
  ]);

  const { data: activeExam } = await supabase
    .from('exams')
    .select('id')
    .eq('user_id', user.id)
    .order('exam_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: subjects } = activeExam
    ? await supabase
        .from('subjects')
        .select('name, weight, importance, current_accuracy, target_accuracy')
        .eq('exam_id', activeExam.id)
    : { data: [] as any[] };

  let weightedProjection = 0;
  let totalWeight = 0;
  for (const subject of subjects || []) {
    const w = Number(subject.importance || 50) + Number(subject.weight || 50);
    weightedProjection += Number(subject.current_accuracy || 0) * w;
    totalWeight += w;
  }
  const weightedScore = totalWeight > 0 ? weightedProjection / totalWeight : 0;

  const lastMock = (mocks || []).slice(-1)[0];
  const projectedScore = Math.round(lastMock ? (weightedScore * 0.7 + Number(lastMock.total_score || 0) * 0.3) : weightedScore);

  const prioritySubjects = (subjects || [])
    .map((s: any) => {
      const gap = Math.max(0, ((s.target_accuracy || 70) - s.current_accuracy) / (s.target_accuracy || 70));
      return { ...s, priority: (Number(s.weight || 50) + Number(s.importance || 50)) * (1 + gap) };
    })
    .sort((a: any, b: any) => b.priority - a.priority);

  return NextResponse.json({
    mocks: mocks || [],
    recoveries: (recoveries || []).map((r: any) => ({ ...r, trigger_count: 1 })),
    projectedScore,
    prioritySubjects,
    performance: {
      best: (topics || []).slice(0, 3),
      worst: (topics || [])
        .filter((t: any) => Number(t.attempts || 0) >= 3)
        .sort((a: any, b: any) => (b.personal_difficulty || 50) - (a.personal_difficulty || 50))
        .slice(0, 3)
    }
  });
}
