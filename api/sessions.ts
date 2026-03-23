import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).set(corsHeaders).end()
  }

  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const body = req.body
    if (!body || !body.subject || !body.platform || !body.totalQuestions) {
      return res.status(400).json({ success: false, error: 'Invalid request body' })
    }

    const { subject, platform, totalQuestions, correctAnswers, errorTags = [], perceivedDifficulty, errorType, sessionMode, durationMinutes, notes, date } = body

    const { data: session, error: sessionError } = await supabase
      .from('question_sessions')
      .insert({
        user_id: user.id,
        subject,
        platform,
        total_questions: totalQuestions,
        correct_answers: correctAnswers || 0,
        error_tags: errorTags,
        perceived_difficulty: perceivedDifficulty,
        error_type: errorType,
        session_mode: sessionMode,
        duration_minutes: durationMinutes,
        notes,
        session_date: date || new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    const accuracy = ((correctAnswers || 0) / totalQuestions) * 100

    if (errorTags.length > 0) {
      for (const tag of errorTags) {
        const canonical = tag.toLowerCase().trim()

        const { data: existing } = await supabase
          .from('topic_performance')
          .select()
          .eq('user_id', user.id)
          .eq('subject', subject)
          .eq('canonical_topic', canonical)
          .single()

        if (existing) {
          await supabase
            .from('topic_performance')
            .update({
              attempts: existing.attempts + totalQuestions,
              errors: existing.errors + (totalQuestions - (correctAnswers || 0)),
              last_seen_at: new Date().toISOString(),
              recurrence_score: Math.min(100, existing.recurrence_score + 10),
            })
            .eq('id', existing.id)
        } else {
          await supabase.from('topic_performance').insert({
            user_id: user.id,
            subject,
            canonical_topic: canonical,
            attempts: totalQuestions,
            errors: totalQuestions - (correctAnswers || 0),
            last_seen_at: new Date().toISOString(),
            recurrence_score: 30,
          })
        }

        if (errorType) {
          await supabase.from('cards').insert({
            user_id: user.id,
            subject,
            topic: canonical,
            canonical_topic: canonical,
            front: canonical,
            origin: 'session_error',
            origin_session_id: session.id,
            error_context: `Erro na sessão de ${date || new Date().toISOString().split('T')[0]}. Tipo: ${errorType}`,
            auto_generated: true,
            stability: errorType === 'never_learned' ? 0.5 : 2,
            difficulty: errorType === 'never_learned' ? 4.5 : 3,
            state: 'new',
            due_date: new Date().toISOString(),
          })
        }
      }
    }

    const { data: historical } = await supabase
      .from('question_sessions')
      .select('correct_answers, total_questions')
      .eq('user_id', user.id)
      .eq('subject', subject)

    const totalHistorical = historical?.reduce((acc, s) => ({
      correct: acc.correct + s.correct_answers,
      total: acc.total + s.total_questions
    }), { correct: 0, total: 0 })

    const historicalAccuracy = totalHistorical && totalHistorical.total > 0
      ? (totalHistorical.correct / totalHistorical.total) * 100
      : 0

    return res.status(200).set(corsHeaders).json({
      success: true,
      session,
      feedback: {
        accuracy: Math.round(accuracy * 10) / 10,
        historicalAccuracy: Math.round(historicalAccuracy * 10) / 10,
        delta: Math.round((accuracy - historicalAccuracy) * 10) / 10,
        cardsGenerated: errorTags.length,
        recoveryTriggered: errorType === 'never_learned',
      }
    })

  } catch (error) {
    return res.status(400).set(corsHeaders).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}