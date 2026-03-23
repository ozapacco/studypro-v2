import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { evaluateSessionForRecovery, triggerRecovery } from '../../../../../src/lib/engines/recovery';
import type { ErrorType } from '../../../../../src/types';

export async function POST(request: Request) {
  const body = await request.json();
  const { subject, topic, questions, hits, platform, errorType, difficulty } = body;
  
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Registrar a sessão na tabela question_sessions
  const { data: session, error: sessionError } = await supabase
    .from('question_sessions')
    .insert({
      user_id: user.id,
      subject,
      platform,
      total_questions: questions,
      correct_answers: hits,
      perceived_difficulty: difficulty,
      error_type: errorType,
      session_date: new Date().toISOString().split('T')[0],
      canonical_topics: [topic],
      source: 'manual_mobile'
    })
    .select()
    .single();

  if (sessionError) {
    console.error('Erro ao salvar sessão:', sessionError);
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  // 2. Se houver erros, "Cicatrizar" -> Criar Card FSRS se não existir
  const errorsCount = questions - hits;
  if (errorsCount > 0) {
    // Verificar se já existe card para este tópico e usuário
    const { data: existingCard } = await supabase
      .from('cards')
      .select('id')
      .eq('user_id', user.id)
      .eq('subject', subject)
      .eq('canonical_topic', topic)
      .maybeSingle();

    if (!existingCard) {
      // Criar card automático para o tópico errado
      await supabase.from('cards').insert({
        user_id: user.id,
        subject,
        canonical_topic: topic,
        front: `Revisão do assunto: ${topic}`,
        back: `Você errou este assunto em uma sessão de ${subject}. Reestudar pontos-chave.`,
        origin: 'session_error',
        origin_session_id: session.id,
        auto_generated: true,
        stability: 1.0, 
        difficulty: 3.0,
        due: new Date().toISOString()
      });
    }
  }

  // 3. Atualizar Topic Performance (Upsert)
  // Nota: Isso idealmente seria um trigger no Postgres, mas fazemos aqui para garantir
  const { data: perf } = await supabase
    .from('topic_performance')
    .select('id, attempts, errors')
    .eq('user_id', user.id)
    .eq('subject', subject)
    .eq('canonical_topic', topic)
    .maybeSingle();

  if (perf) {
    await supabase
      .from('topic_performance')
      .update({
        attempts: perf.attempts + questions,
        errors: perf.errors + (questions - hits),
        last_seen_at: new Date().toISOString()
      })
      .eq('id', perf.id);
  } else {
    await supabase
      .from('topic_performance')
      .insert({
        user_id: user.id,
        subject,
        canonical_topic: topic,
        attempts: questions,
        errors: questions - hits,
        last_seen_at: new Date().toISOString()
      });
  }

  // 4. DETECTAR NECESSIDADE DE RECUPERAÇÃO (F2.3)
  const recoveryTrigger = await evaluateSessionForRecovery(
    user.id,
    subject,
    topic,
    hits,
    questions - hits,
    errorType as ErrorType
  );

  if (recoveryTrigger) {
    await triggerRecovery(
      supabase,
      user.id,
      subject,
      topic,
      recoveryTrigger.reason,
      hits / questions
    );
  }

  return NextResponse.json({
    success: true,
    sessionId: session.id,
    recoveryTriggered: !!recoveryTrigger
  });
}
