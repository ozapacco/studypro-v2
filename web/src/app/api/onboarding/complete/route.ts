import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const SUBJECTS_BY_EXAM: Record<string, Array<{ name: string; weight: number }>> = {
  'Policia Civil': [
    { name: 'Direito Penal', weight: 25 },
    { name: 'Direito Processual Penal', weight: 20 },
    { name: 'Direito Constitucional', weight: 15 },
    { name: 'Direito Administrativo', weight: 10 },
    { name: 'Portugues', weight: 15 },
    { name: 'Informatica', weight: 15 }
  ],
  'Policia Militar': [
    { name: 'Matematica', weight: 20 },
    { name: 'Portugues', weight: 20 },
    { name: 'Direito Constitucional', weight: 15 },
    { name: 'Legislacao Militar', weight: 25 },
    { name: 'Atualidades', weight: 20 }
  ],
  'Guarda Municipal': [
    { name: 'Direito Constitucional', weight: 25 },
    { name: 'Direito Penal', weight: 20 },
    { name: 'Legislacao Municipal', weight: 20 },
    { name: 'Portugues', weight: 20 },
    { name: 'Raciocinio Logico', weight: 15 }
  ],
  'Policia Penal': [
    { name: 'Direito Penal', weight: 25 },
    { name: 'Execucao Penal', weight: 20 },
    { name: 'Direito Constitucional', weight: 15 },
    { name: 'Portugues', weight: 20 },
    { name: 'Atualidades', weight: 20 }
  ]
};

function findPreset(examName: string) {
  const normalized = examName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return Object.entries(SUBJECTS_BY_EXAM).find(([key]) => normalized.includes(key.toLowerCase()))?.[1] || [];
}

export async function POST(request: Request) {
  const body = await request.json();
  const exams = Array.isArray(body.exams) ? body.exams : [];
  const examDate = body.examDate || null;
  const dailyTime = Number(body.dailyTime || 180);
  const firstSession = body.firstSession || null;

  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await supabase
    .from('profiles')
    .update({
      daily_time_minutes: dailyTime,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  const examName = String(exams[0] || 'Plano Personalizado').trim();
  const presetSubjects = findPreset(examName);

  const { data: createdExam, error: examError } = await supabase
    .from('exams')
    .insert({
      user_id: user.id,
      name: examName || 'Plano Personalizado',
      exam_date: examDate || null,
      cutoff_score: 70
    })
    .select('id')
    .single();

  if (examError) {
    return NextResponse.json({ error: examError.message }, { status: 500 });
  }

  if (presetSubjects.length > 0) {
    await supabase.from('subjects').insert(
      presetSubjects.map((s) => ({
        exam_id: createdExam.id,
        name: s.name,
        weight: s.weight,
        target_accuracy: 70
      }))
    );
  }

  if (firstSession) {
    const subject = String(firstSession.subject || 'Direito Penal');
    const totalQuestions = Number(firstSession.questions || 0);
    const correctAnswers = Number(firstSession.hits || 0);
    const totalErrors = Math.max(0, totalQuestions - correctAnswers);

    if (totalQuestions > 0 && correctAnswers >= 0 && correctAnswers <= totalQuestions) {
      const { data: session } = await supabase
        .from('question_sessions')
        .insert({
          user_id: user.id,
          subject,
          platform: 'other',
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          perceived_difficulty: 3,
          error_type: totalErrors > 0 ? 'never_learned' : null,
          session_date: new Date().toISOString().split('T')[0],
          error_tags: totalErrors > 0 ? ['Gap Inicial'] : [],
          canonical_topics: totalErrors > 0 ? ['Gap Inicial'] : []
        })
        .select('id')
        .single();

      if (session && totalErrors > 0) {
        await supabase.from('topic_performance').upsert(
          {
            user_id: user.id,
            subject,
            canonical_topic: 'Gap Inicial',
            attempts: totalQuestions,
            errors: totalErrors,
            recurrence_score: 1,
            last_seen_at: new Date().toISOString()
          },
          { onConflict: 'user_id,subject,canonical_topic' }
        );

        await supabase.from('cards').insert({
          user_id: user.id,
          subject,
          canonical_topic: 'Gap Inicial',
          front: `Gap Inicial - ${subject}`,
          back: '',
          origin: 'session_error',
          origin_session_id: session.id,
          auto_generated: true,
          error_context: 'Card gerado na primeira sessao do onboarding.',
          stability: 1.0,
          difficulty: 3.0,
          due_date: new Date().toISOString()
        });
      }
    }
  }

  return NextResponse.json({ success: true, examId: createdExam.id });
}
