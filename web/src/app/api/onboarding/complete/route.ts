import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { exams, examDate, dailyTime, firstSession } = body;
  
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Atualizar settings do usuário no metadata (ou criar profile)
  await supabase.auth.updateUser({
    data: {
      onboarding_complete: true,
      exams,
      target_date: examDate,
      daily_minutes: dailyTime
    }
  });

  // 2. Criar a primeira sessão caso exista e não seja nula
  if (firstSession) {
    // Insere na question_sessions
    const { data: session } = await supabase
      .from('question_sessions')
      .insert({
        user_id: user.id,
        subject: firstSession.subject,
        platform: 'onboarding',
        total_questions: firstSession.questions,
        correct_answers: firstSession.hits,
        perceived_difficulty: 3,
        error_type: firstSession.questions > firstSession.hits ? 'never_learned' : null,
        session_date: new Date().toISOString().split('T')[0],
        canonical_topics: ['Gap Inicial'],
        source: 'onboarding'
      })
      .select()
      .single();

    if (session && firstSession.questions > firstSession.hits) {
      // Inicia o Topic Performance
      await supabase.from('topic_performance').insert({
        user_id: user.id,
        subject: firstSession.subject,
        canonical_topic: 'Gap Inicial',
        attempts: firstSession.questions,
        errors: firstSession.questions - firstSession.hits,
        last_seen_at: new Date().toISOString()
      });
      
      // Cria o primeiro card de recup
      await supabase.from('cards').insert({
        user_id: user.id,
        subject: firstSession.subject,
        canonical_topic: 'Gap Inicial',
        front: `Ponto de Partida - Correção de ${firstSession.subject}`,
        back: 'Este card foi gerado na sua primeira missão. Seu objetivo é entender quais gaps de base você possui. Reveja esse tópico!',
        origin: 'onboarding',
        origin_session_id: session.id,
        auto_generated: true,
        stability: 1.0, 
        difficulty: 3.0,
        due: new Date().toISOString()
      });
    }
  }

  return NextResponse.json({ success: true });
}
