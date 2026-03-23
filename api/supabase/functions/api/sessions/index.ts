import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.22.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
}

const sessionSchema = z.object({
  subject: z.string().min(1),
  platform: z.enum(['qconcursos', 'tec', 'other']),
  totalQuestions: z.number().int().positive(),
  correctAnswers: z.number().int().min(0),
  errorTags: z.array(z.string()).default([]),
  perceivedDifficulty: z.number().int().min(1).max(5).optional(),
  errorType: z.enum(['forgot', 'confused', 'never_learned']).optional(),
  sessionMode: z.enum(['random', 'focused_topic', 'partial_mock']).optional(),
  durationMinutes: z.number().optional(),
  notes: z.string().optional(),
  date: z.string().optional(),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(authHeader)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const validated = sessionSchema.parse(body)

    const { data: session, error: sessionError } = await supabase
      .from('question_sessions')
      .insert({
        user_id: user.id,
        subject: validated.subject,
        platform: validated.platform,
        total_questions: validated.totalQuestions,
        correct_answers: validated.correctAnswers,
        error_tags: validated.errorTags,
        perceived_difficulty: validated.perceivedDifficulty,
        error_type: validated.errorType,
        session_mode: validated.sessionMode,
        duration_minutes: validated.durationMinutes,
        notes: validated.notes,
        session_date: validated.date || new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    const accuracy = (validated.correctAnswers / validated.totalQuestions) * 100
    
    if (validated.errorTags.length > 0) {
      const topicUpdates = validated.errorTags.map(async (tag) => {
        const canonical = tag.toLowerCase().trim()
        
        const { data: existing } = await supabase
          .from('topic_performance')
          .select()
          .eq('user_id', user.id)
          .eq('subject', validated.subject)
          .eq('canonical_topic', canonical)
          .single()

        if (existing) {
          await supabase
            .from('topic_performance')
            .update({
              attempts: existing.attempts + validated.totalQuestions,
              errors: existing.errors + (validated.totalQuestions - validated.correctAnswers),
              last_seen_at: new Date().toISOString(),
              recurrence_score: Math.min(100, existing.recurrence_score + 10),
            })
            .eq('id', existing.id)
        } else {
          await supabase.from('topic_performance').insert({
            user_id: user.id,
            subject: validated.subject,
            canonical_topic: canonical,
            attempts: validated.totalQuestions,
            errors: validated.totalQuestions - validated.correctAnswers,
            last_seen_at: new Date().toISOString(),
            recurrence_score: 30,
          })
        }

        if (validated.errorType) {
          await supabase.from('cards').insert({
            user_id: user.id,
            subject: validated.subject,
            topic: canonical,
            canonical_topic: canonical,
            front: canonical,
            origin: 'session_error',
            origin_session_id: session.id,
            error_context: `Erro na sessão de ${validated.date || new Date().toISOString().split('T')[0]}. Tipo: ${validated.errorType}`,
            auto_generated: true,
            stability: validated.errorType === 'never_learned' ? 0.5 : 2,
            difficulty: validated.errorType === 'never_learned' ? 4.5 : 3,
            state: 'new',
            due_date: new Date().toISOString(),
          })
        }
      })

      await Promise.all(topicUpdates)
    }

    const { data: historical } = await supabase
      .from('question_sessions')
      .select('correct_answers, total_questions')
      .eq('user_id', user.id)
      .eq('subject', validated.subject)

    const totalHistorical = historical?.reduce((acc, s) => ({
      correct: acc.correct + s.correct_answers,
      total: acc.total + s.total_questions
    }), { correct: 0, total: 0 })

    const historicalAccuracy = totalHistorical && totalHistorical.total > 0
      ? (totalHistorical.correct / totalHistorical.total) * 100
      : 0

    return new Response(JSON.stringify({
      success: true,
      session,
      feedback: {
        accuracy: Math.round(accuracy * 10) / 10,
        historicalAccuracy: Math.round(historicalAccuracy * 10) / 10,
        delta: Math.round((accuracy - historicalAccuracy) * 10) / 10,
        cardsGenerated: validated.errorTags.length,
        recoveryTriggered: validated.errorType === 'never_learned',
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})