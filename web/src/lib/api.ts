import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// API helpers that use Supabase client-side
export async function getDashboard(userId: string) {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // Get sessions
  const { data: sessions } = await supabase
    .from('question_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('session_date', sevenDaysAgo.toISOString().split('T')[0])
    .order('session_date', { ascending: false })

  // Calculate accuracy
  const totalQ = sessions?.reduce((acc, s) => acc + s.total_questions, 0) || 0
  const totalC = sessions?.reduce((acc, s) => acc + s.correct_answers, 0) || 0
  const accuracy = totalQ > 0 ? (totalC / totalQ) * 100 : 0

  // Get weakest subject
  const subjectStats = sessions?.reduce((acc, s) => {
    if (!acc[s.subject]) acc[s.subject] = { c: 0, t: 0 }
    acc[s.subject].c += s.correct_answers
    acc[s.subject].t += s.total_questions
    return acc
  }, {} as Record<string, { c: number; t: number }>)

  const weakest = Object.entries(subjectStats || {})
    .filter(([, s]) => s.t >= 10)
    .sort(([, a], [, b]) => (a.c / a.t) - (b.c / b.t))[0]

  // Get due cards
  const { count: dueCards } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('due_date', new Date().toISOString())
    .in('state', ['review', 'learning', 'relearning'])

  return {
    mission: dueCards && dueCards >= 5
      ? { type: 'review', subject: null, targetQuestions: null, reasoning: `${dueCards} cards para revisar` }
      : { type: 'questions', subject: weakest?.[0] || null, platform: 'qconcursos', targetQuestions: 20, reasoning: weakest ? `${weakest[0]} precisa de atenção` : 'Resolva questões' },
    health: {
      overallAccuracy: Math.round(accuracy * 10) / 10,
      trend: 'stable',
      change: 0,
      weakestSubject: weakest ? { name: weakest[0], accuracy: Math.round((subjectStats![weakest[0]].c / subjectStats![weakest[0]].t) * 100) } : null,
      consistency: { daysWithSessions: new Set(sessions?.map(s => s.session_date)).size || 0, totalDays: 7 },
    },
    backlog: { overdueCards: dueCards || 0, activeRecoveries: 0, nextMockDate: null },
  }
}

export async function createSession(userId: string, data: any) {
  const { data: session, error } = await supabase
    .from('question_sessions')
    .insert({
      user_id: userId,
      ...data,
      session_date: data.date || new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) throw error
  return session
}

export async function getDueCards(userId: string) {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', userId)
    .lte('due_date', new Date().toISOString())
    .in('state', ['review', 'learning', 'relearning'])
    .order('due_date', { ascending: true })
    .limit(20)

  if (error) throw error
  return data
}
