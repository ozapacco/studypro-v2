import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
}

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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentSessions } = await supabase
      .from('question_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('session_date', sevenDaysAgo.toISOString().split('T')[0])

    const totalQuestions = recentSessions?.reduce((acc, s) => acc + s.total_questions, 0) || 0
    const totalCorrect = recentSessions?.reduce((acc, s) => acc + s.correct_answers, 0) || 0
    const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0

    const { data: subjectStats } = await supabase
      .from('question_sessions')
      .select('subject, correct_answers, total_questions')
      .eq('user_id', user.id)
      .gte('session_date', sevenDaysAgo.toISOString().split('T')[0])

    const subjectAccuracy = subjectStats?.reduce((acc, s) => {
      if (!acc[s.subject]) acc[s.subject] = { correct: 0, total: 0 }
      acc[s.subject].correct += s.correct_answers
      acc[s.subject].total += s.total_questions
      return acc
    }, {} as Record<string, { correct: number; total: number }>)

    const weakestSubject = Object.entries(subjectAccuracy || {})
      .filter(([, s]) => s.total >= 10)
      .sort(([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total))[0]

    const { data: criticalTopic } = await supabase
      .from('topic_performance')
      .select('canonical_topic, subject, recurrence_score')
      .eq('user_id', user.id)
      .order('recurrence_score', { ascending: false })
      .limit(1)
      .single()

    const { count: dueCardsCount } = await supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lte('due_date', new Date().toISOString())
      .in('state', ['review', 'learning', 'relearning'])

    const { data: nextExam } = await supabase
      .from('exams')
      .select('exam_date, name')
      .eq('user_id', user.id)
      .gte('exam_date', new Date().toISOString().split('T')[0])
      .order('exam_date')
      .limit(1)
      .single()

    let mission = {
      type: 'questions' as const,
      subject: weakestSubject?.[0] || null,
      platform: 'qconcursos' as const,
      targetQuestions: 20,
      reasoning: weakestSubject 
        ? `${weakestSubject[0]} está ${Math.round(100 - (subjectAccuracy![weakestSubject[0]].correct / subjectAccuracy![weakestSubject[0]].total) * 100)}% abaixo da meta`
        : 'Resolva questões para identificar áreas de melhoria',
    }

    if (dueCardsCount && dueCardsCount >= 5) {
      mission = {
        type: 'review',
        subject: null,
        platform: null,
        targetQuestions: null,
        reasoning: `Você tem ${dueCardsCount} cards para revisar`,
      }
    }

    return new Response(JSON.stringify({
      success: true,
      mission,
      health: {
        overallAccuracy: Math.round(overallAccuracy * 10) / 10,
        trend: 'stable' as const,
        change: 0,
        weakestSubject: weakestSubject ? {
          name: weakestSubject[0],
          accuracy: Math.round((subjectAccuracy![weakestSubject[0]].correct / subjectAccuracy![weakestSubject[0]].total) * 100),
          hasEnoughData: subjectAccuracy![weakestSubject[0]].total >= 10,
        } : null,
        criticalTopic: criticalTopic ? {
          name: criticalTopic.canonical_topic,
          subject: criticalTopic.subject,
        } : null,
        consistency: {
          daysWithSessions: new Set(recentSessions?.map(s => s.session_date)).size,
          totalDays: 7,
        },
      },
      backlog: {
        overdueCards: dueCardsCount || 0,
        activeRecoveries: 0,
        nextMockDate: nextExam?.exam_date || null,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})