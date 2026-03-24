import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { triggerRecovery } from '@/lib/engines/recovery';

type SubjectResult = {
  name: string;
  hits: number;
  total: number;
};

function classifySubjects(subjects: SubjectResult[]) {
  return {
    strong: subjects.filter((s) => s.total > 0 && s.hits / s.total >= 0.7).map((s) => s.name),
    attention: subjects.filter((s) => s.total > 0 && s.hits / s.total >= 0.5 && s.hits / s.total < 0.7).map((s) => s.name),
    critical: subjects.filter((s) => s.total > 0 && s.hits / s.total < 0.5).map((s) => s.name)
  };
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name || '').trim();
  const examDate = String(body.examDate || new Date().toISOString().split('T')[0]);
  const platform = String(body.platform || 'manual');
  const cutoff = Number(body.cutoff ?? 70);
  const totalScore = Number(body.totalScore ?? 0);
  const inputSubjects: SubjectResult[] = Array.isArray(body.subjects) ? body.subjects : [];

  if (!name || inputSubjects.length === 0) {
    return NextResponse.json({ error: 'Dados de simulado invalidos.' }, { status: 400 });
  }

  const subjects = inputSubjects
    .map((s) => ({
      name: String(s.name || '').trim(),
      hits: Number(s.hits || 0),
      total: Number(s.total || 0)
    }))
    .filter((s) => s.name && s.total > 0 && s.hits >= 0 && s.hits <= s.total);

  if (subjects.length === 0) {
    return NextResponse.json({ error: 'Sem materias validas para analisar.' }, { status: 400 });
  }

  const analysis = classifySubjects(subjects);

  const bySubject = subjects.map((s) => ({
    subject: s.name,
    score: s.hits,
    maxScore: s.total,
    percentage: Number(((s.hits / s.total) * 100).toFixed(2))
  }));

  const { data: mock, error: mockError } = await supabase
    .from('mock_exams')
    .insert({
      user_id: user.id,
      name,
      exam_date: examDate,
      platform,
      total_score: totalScore,
      max_score: 100,
      cutoff_score: cutoff,
      by_subject: bySubject,
      analysis,
      critical_topics: analysis.critical
    })
    .select('id')
    .single();

  if (mockError) {
    return NextResponse.json({ error: mockError.message }, { status: 500 });
  }

  for (const s of subjects) {
    const accuracy = s.hits / s.total;
    const errors = s.total - s.hits;

    const { data: existingPerf } = await supabase
      .from('topic_performance')
      .select('id, attempts, errors, recurrence_score')
      .eq('user_id', user.id)
      .eq('subject', s.name)
      .eq('canonical_topic', 'GERAL (Simulado)')
      .maybeSingle();

    if (existingPerf) {
      await supabase
        .from('topic_performance')
        .update({
          attempts: Number(existingPerf.attempts || 0) + s.total,
          errors: Number(existingPerf.errors || 0) + errors,
          recurrence_score: Number(existingPerf.recurrence_score || 0) + (accuracy < 0.5 ? 1 : 0),
          last_seen_at: new Date().toISOString()
        })
        .eq('id', existingPerf.id);
    } else {
      await supabase
        .from('topic_performance')
        .insert({
          user_id: user.id,
          subject: s.name,
          canonical_topic: 'GERAL (Simulado)',
          attempts: s.total,
          errors,
          recurrence_score: accuracy < 0.5 ? 1 : 0,
          last_seen_at: new Date().toISOString()
        });
    }

    if (accuracy < 0.5) {
      await triggerRecovery(
        supabase,
        user.id,
        s.name,
        'GERAL (Simulado)',
        'mock_exam',
        accuracy,
        undefined,
        mock.id
      );

      const { data: existingMockCard } = await supabase
        .from('cards')
        .select('id, lapses')
        .eq('user_id', user.id)
        .eq('subject', s.name)
        .eq('canonical_topic', 'GERAL (Simulado)')
        .eq('origin', 'mock_exam_error')
        .maybeSingle();

      if (existingMockCard) {
        await supabase
          .from('cards')
          .update({
            lapses: Number(existingMockCard.lapses || 0) + 1,
            due_date: new Date().toISOString(),
            error_context: `Falha em simulado: ${s.name} abaixo de 50%.`
          })
          .eq('id', existingMockCard.id);
      } else {
        await supabase.from('cards').insert({
          user_id: user.id,
          subject: s.name,
          canonical_topic: 'GERAL (Simulado)',
          front: `GERAL (Simulado) - ${s.name}`,
          back: '',
          origin: 'mock_exam_error',
          origin_mock_exam_id: mock.id,
          auto_generated: true,
          error_context: `Falha em simulado: ${s.name} abaixo de 50%.`,
          stability: 1.0,
          difficulty: 3.2,
          due_date: new Date().toISOString()
        });
      }
    }
  }

  return NextResponse.json({
    success: true,
    mockId: mock.id,
    analysis,
    criticalCount: analysis.critical.length,
    gapToCutoff: Number((totalScore - cutoff).toFixed(2))
  });
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: mocks, error } = await supabase
    .from('mock_exams')
    .select('*')
    .eq('user_id', user.id)
    .order('exam_date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(mocks || []);
}
