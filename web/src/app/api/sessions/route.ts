import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { evaluateSessionForRecovery, triggerRecovery } from '@/lib/engines/recovery';
import type { ErrorType, Platform } from '@/types';

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function toPlatform(value: unknown): Platform {
  const v = String(value || '').toLowerCase();
  if (v === 'qconcursos' || v === 'tec' || v === 'other') return v as Platform;
  return 'other';
}

function buildErrorContext(
  canonicalTopic: string,
  subject: string,
  errorsCount: number,
  totalQuestions: number,
  sessionDateISO: string
) {
  return `Erro recorrente em ${canonicalTopic} (${subject}). Erros na sessao: ${errorsCount}/${totalQuestions}. Fonte: sessao ${sessionDateISO}.`;
}

async function ensureCanonicalTopics(
  supabase: any,
  subject: string,
  rawTopics: string[]
): Promise<string[]> {
  const cleaned = Array.from(
    new Set(
      rawTopics
        .map((t) => String(t || '').trim())
        .filter(Boolean)
    )
  );

  if (cleaned.length === 0) return [];

  const { data: dictionary } = await supabase
    .from('topic_dictionary')
    .select('canonical, aliases')
    .eq('subject', subject);

  const rows = dictionary || [];
  const resolved: string[] = [];

  for (const raw of cleaned) {
    const rawNorm = normalizeText(raw);
    let canonical = '';

    for (const row of rows) {
      const candidate = String(row.canonical || '');
      const candidateNorm = normalizeText(candidate);
      const aliases: string[] = (row.aliases || []).map((a: string) => normalizeText(a));

      if (candidateNorm === rawNorm || aliases.includes(rawNorm)) {
        canonical = candidate;
        break;
      }
    }

    if (!canonical) {
      const partial = rows.find((row: any) => normalizeText(String(row.canonical || '')).includes(rawNorm));
      if (partial) canonical = String(partial.canonical);
    }

    if (!canonical) {
      canonical = raw;
      await supabase.from('topic_dictionary').upsert(
        {
          subject,
          canonical,
          aliases: raw !== canonical ? [raw] : []
        },
        { onConflict: 'subject,canonical' }
      );
    }

    resolved.push(canonical);
  }

  return Array.from(new Set(resolved));
}

async function upsertTopicPerformance(
  supabase: any,
  userId: string,
  subject: string,
  canonicalTopic: string,
  attemptsInc: number,
  errorsInc: number
) {
  const { data: existing } = await supabase
    .from('topic_performance')
    .select('id, attempts, errors, recurrence_score')
    .eq('user_id', userId)
    .eq('subject', subject)
    .eq('canonical_topic', canonicalTopic)
    .maybeSingle();

  if (existing) {
    const recurrenceBoost = errorsInc > 0 ? 1 : 0;
    await supabase
      .from('topic_performance')
      .update({
        attempts: Number(existing.attempts || 0) + attemptsInc,
        errors: Number(existing.errors || 0) + errorsInc,
        recurrence_score: Number(existing.recurrence_score || 0) + recurrenceBoost,
        last_seen_at: new Date().toISOString()
      })
      .eq('id', existing.id);
    return {
      id: existing.id,
      recurrenceScore: Number(existing.recurrence_score || 0) + recurrenceBoost
    };
  }

  const { data: created } = await supabase
    .from('topic_performance')
    .insert({
      user_id: userId,
      subject,
      canonical_topic: canonicalTopic,
      attempts: attemptsInc,
      errors: errorsInc,
      recurrence_score: errorsInc > 0 ? 1 : 0,
      last_seen_at: new Date().toISOString()
    })
    .select('id, recurrence_score')
    .single();

  return {
    id: created?.id,
    recurrenceScore: Number(created?.recurrence_score || 0)
  };
}

async function upsertErrorCard(
  supabase: any,
  userId: string,
  subject: string,
  canonicalTopic: string,
  sessionId: string,
  errorContext: string
) {
  const { data: existingCard } = await supabase
    .from('cards')
    .select('id, lapses, stability')
    .eq('user_id', userId)
    .eq('subject', subject)
    .eq('canonical_topic', canonicalTopic)
    .maybeSingle();

  if (!existingCard) {
    await supabase.from('cards').insert({
      user_id: userId,
      subject,
      canonical_topic: canonicalTopic,
      front: `${canonicalTopic} - ${subject}`,
      back: '',
      origin: 'session_error',
      origin_session_id: sessionId,
      auto_generated: true,
      error_context: errorContext,
      stability: 1.0,
      difficulty: 3.0,
      due_date: new Date().toISOString()
    });
    return;
  }

  const isVeryStable = Number(existingCard.stability || 0) > 14;
  await supabase
    .from('cards')
    .update({
      lapses: Number(existingCard.lapses || 0) + 1,
      due_date: new Date().toISOString(),
      error_context: isVeryStable
        ? `${errorContext} Card estava estavel e voltou a falhar.`
        : errorContext
    })
    .eq('id', existingCard.id);
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const subject = String(body.subject || '').trim();
  const platform = toPlatform(body.platform);
  const totalQuestions = Number(body.totalQuestions ?? body.questions ?? 0);
  const correctAnswers = Number(body.correctAnswers ?? body.hits ?? 0);
  const perceivedDifficulty = Number(body.perceivedDifficulty ?? body.difficulty ?? 3);
  const errorType = (body.errorType ?? null) as ErrorType | null;
  const rawSessionMode = body.sessionMode ?? null;
  const sessionMode = ['random', 'focused_topic', 'partial_mock'].includes(String(rawSessionMode))
    ? rawSessionMode
    : null;
  const durationMinutes = body.durationMinutes ?? null;
  const notes = String(body.notes || '').trim();
  const sessionDate = body.sessionDate ? new Date(body.sessionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  const rawTags = Array.isArray(body.errorTags)
    ? body.errorTags
    : body.topic
      ? [body.topic]
      : [];

  if (!subject || totalQuestions <= 0 || correctAnswers < 0 || correctAnswers > totalQuestions) {
    return NextResponse.json({ error: 'Dados de sessao invalidos.' }, { status: 400 });
  }

  const canonicalTopicsInput = Array.isArray(body.canonicalTopics) ? body.canonicalTopics : [];
  const canonicalTopics: string[] = canonicalTopicsInput.length > 0
    ? Array.from(new Set(canonicalTopicsInput.map((x: any) => String(x || '').trim()).filter(Boolean)))
    : await ensureCanonicalTopics(supabase, subject, rawTags);

  const { data: session, error: sessionError } = await supabase
    .from('question_sessions')
    .insert({
      user_id: user.id,
      subject,
      platform,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      error_tags: rawTags,
      canonical_topics: canonicalTopics,
      perceived_difficulty: Math.min(5, Math.max(1, perceivedDifficulty)),
      error_type: errorType,
      session_mode: sessionMode,
      duration_minutes: durationMinutes,
      notes,
      session_date: sessionDate
    })
    .select('id')
    .single();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  const totalErrors = totalQuestions - correctAnswers;
  const topicsCount = Math.max(1, canonicalTopics.length);
  const attemptsInc = Math.max(1, Math.round(totalQuestions / topicsCount));
  const errorsInc = totalErrors > 0 ? Math.max(1, Math.round(totalErrors / topicsCount)) : 0;

  const { data: profile } = await supabase
    .from('profiles')
    .select('recurrence_threshold')
    .eq('id', user.id)
    .single();
  const recurrenceThreshold = Number(profile?.recurrence_threshold || 3);

  let recoveryTriggered = false;

  for (const topic of canonicalTopics) {
    const perf = await upsertTopicPerformance(
      supabase,
      user.id,
      subject,
      topic,
      attemptsInc,
      errorsInc
    );

    if (totalErrors > 0) {
      await upsertErrorCard(
        supabase,
        user.id,
        subject,
        topic,
        session.id,
        buildErrorContext(topic, subject, totalErrors, totalQuestions, sessionDate)
      );
    }

    const baseTrigger = await evaluateSessionForRecovery(
      user.id,
      subject,
      topic,
      correctAnswers,
      totalErrors,
      errorType || 'forgot'
    );

    if (baseTrigger) {
      await triggerRecovery(
        supabase,
        user.id,
        subject,
        topic,
        baseTrigger.reason,
        correctAnswers / totalQuestions,
        session.id
      );
      recoveryTriggered = true;
      continue;
    }

    if (totalErrors > 0 && perf.recurrenceScore >= recurrenceThreshold) {
      await triggerRecovery(
        supabase,
        user.id,
        subject,
        topic,
        'recurrent_error',
        correctAnswers / totalQuestions,
        session.id
      );
      recoveryTriggered = true;
    }
  }

  const { data: subjectSessions } = await supabase
    .from('question_sessions')
    .select('total_questions, correct_answers')
    .eq('user_id', user.id)
    .eq('subject', subject)
    .order('session_date', { ascending: false })
    .limit(30);

  const histTotal = (subjectSessions || []).reduce((acc: number, s: any) => acc + Number(s.total_questions || 0), 0);
  const histHits = (subjectSessions || []).reduce((acc: number, s: any) => acc + Number(s.correct_answers || 0), 0);

  const currentAccuracy = (correctAnswers / totalQuestions) * 100;
  const historicalAccuracy = histTotal > 0 ? (histHits / histTotal) * 100 : 0;
  const delta = currentAccuracy - historicalAccuracy;

  return NextResponse.json({
    success: true,
    sessionId: session.id,
    canonicalTopics,
    recoveryTriggered,
    feedback: {
      accuracy: Math.round(currentAccuracy),
      historical: Math.round(historicalAccuracy),
      delta: Math.round(delta),
      status: currentAccuracy >= 80 ? 'Excelente' : currentAccuracy >= 70 ? 'Na Meta' : 'Abaixo da Meta'
    }
  });
}
