import { supabase } from './supabase'

export interface SessionInput {
  subject: string
  platform: 'qconcursos' | 'tec' | 'other'
  totalQuestions: number
  correctAnswers: number
  errorTags: string[]
  perceivedDifficulty?: 1 | 2 | 3 | 4 | 5
  errorType?: 'forgot' | 'confused' | 'never_learned'
  sessionMode?: 'random' | 'focused_topic' | 'partial_mock'
  durationMinutes?: number
  notes?: string
  date?: string
}

export interface Card {
  id: string
  subject: string
  topic?: string
  front: string
  back?: string
  state: 'new' | 'learning' | 'review' | 'relearning'
  due_date: string
  error_context?: string
}

export interface Mission {
  type: 'questions' | 'review' | 'mock' | 'recovery'
  subject: string | null
  platform: string | null
  targetQuestions: number | null
  reasoning: string
}

export interface HealthPanel {
  overallAccuracy: number
  trend: 'up' | 'down' | 'stable'
  change: number
  weakestSubject: { name: string; accuracy: number } | null
  criticalTopic: { name: string; subject: string } | null
  consistency: { daysWithSessions: number; totalDays: number }
}

export async function getDashboard() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: sessions } = await supabase
    .from('question_sessions')
    .select('*')
    .eq('user_id', user.id)
    .gte('session_date', sevenDaysAgo.toISOString().split('T')[0])
    .order('session_date', { ascending: false })

  const totalQ = sessions?.reduce((acc, s) => acc + s.total_questions, 0) || 0
  const totalC = sessions?.reduce((acc, s) => acc + s.correct_answers, 0) || 0
  const accuracy = totalQ > 0 ? (totalC / totalQ) * 100 : 0

  const subjectStats = sessions?.reduce((acc, s) => {
    if (!acc[s.subject]) acc[s.subject] = { c: 0, t: 0 }
    acc[s.subject].c += s.correct_answers
    acc[s.subject].t += s.total_questions
    return acc
  }, {} as Record<string, { c: number; t: number }>)

  const weakest = Object.entries(subjectStats || {})
    .filter(([, s]) => s.t >= 10)
    .sort(([, a], [, b]) => (a.c / a.t) - (b.c / b.t))[0]

  const { count: dueCards } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('due_date', new Date().toISOString())
    .in('state', ['review', 'learning', 'relearning'])

  const mission: Mission = dueCards && dueCards >= 5
    ? { type: 'review', subject: null, platform: null, targetQuestions: null, reasoning: `${dueCards} cards para revisar` }
    : { type: 'questions', subject: weakest?.[0] || null, platform: 'qconcursos', targetQuestions: 20, reasoning: weakest ? `${weakest[0]} precisa de atenção` : 'Resolva questões' }

  return {
    mission,
    health: {
      overallAccuracy: Math.round(accuracy * 10) / 10,
      trend: 'stable' as const,
      change: 0,
      weakestSubject: weakest ? { name: weakest[0], accuracy: Math.round((subjectStats![weakest[0]].c / subjectStats![weakest[0]].t) * 100) } : null,
      criticalTopic: null,
      consistency: { daysWithSessions: new Set(sessions?.map(s => s.session_date)).size || 0, totalDays: 7 },
    } as HealthPanel,
    backlog: {
      overdueCards: dueCards || 0,
      activeRecoveries: 0,
      nextMockDate: null,
    },
  }
}

export async function createSession(input: SessionInput) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: session, error } = await supabase
    .from('question_sessions')
    .insert({
      user_id: user.id,
      subject: input.subject,
      platform: input.platform,
      total_questions: input.totalQuestions,
      correct_answers: input.correctAnswers,
      error_tags: input.errorTags,
      perceived_difficulty: input.perceivedDifficulty,
      error_type: input.errorType,
      session_mode: input.sessionMode,
      duration_minutes: input.durationMinutes,
      notes: input.notes,
      session_date: input.date || new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) throw error

  const accuracy = (input.correctAnswers / input.totalQuestions) * 100
  const cardsCreated = input.errorTags.length

  return {
    session,
    feedback: {
      accuracy,
      historicalAccuracy: accuracy,
      delta: 0,
      cardsGenerated: cardsCreated,
      recoveryTriggered: input.errorType === 'never_learned',
    },
  }
}

export async function getDueCards(limit = 20) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: cards, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', user.id)
    .lte('due_date', new Date().toISOString())
    .in('state', ['review', 'learning', 'relearning'])
    .order('due_date', { ascending: true })
    .limit(limit)

  if (error) throw error

  return {
    cards: cards as Card[],
    total: cards?.length || 0,
    estimatedMinutes: (cards?.length || 0) * 2,
  }
}

export async function submitReview(cardId: string, rating: 1 | 2 | 3 | 4 | 5) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: card } = await supabase
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .single()

  if (!card) throw new Error('Card not found')

  let { stability, difficulty, interval, lapses } = card
  const diffFactors: Record<number, number> = { 1: 1.3, 2: 1.15, 3: 1.0, 4: 0.9, 5: 0.7 }
  
  difficulty = Math.max(1, Math.min(5, difficulty * diffFactors[rating]))
  
  if (rating >= 3) {
    stability = stability * (1 + (11 - difficulty) * 0.1 * (rating - 3) / 3)
  } else {
    stability = stability * 0.5
    lapses++
  }

  interval = rating >= 3 
    ? Math.round(stability * (6 - difficulty) / 5 * (1 + Math.log10(stability)))
    : Math.max(1, Math.round(interval * 0.3))
  
  interval = Math.min(interval, 365)

  const nextDue = new Date()
  nextDue.setDate(nextDue.getDate() + interval)

  const { data: updatedCard, error } = await supabase
    .from('cards')
    .update({
      stability,
      difficulty,
      interval,
      state: rating >= 3 ? 'review' : 'relearning',
      due_date: nextDue.toISOString(),
      lapses,
    })
    .eq('id', cardId)
    .select()
    .single()

  if (error) throw error

  await supabase.from('review_logs').insert({
    card_id: cardId,
    user_id: user.id,
    rating,
    previous_interval: card.interval,
    previous_ease: card.difficulty,
    new_interval: interval,
    new_ease: difficulty,
  })

  return {
    card: updatedCard,
    nextReview: { interval, dueDate: nextDue.toISOString() },
  }
}

export async function getSubjects() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: exam } = await supabase
    .from('exams')
    .select('*, subjects(*)')
    .eq('user_id', user.id)
    .single()

  return exam?.subjects || []
}

export async function createExam(name: string, examDate: string, cutoffScore: number) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: exam, error } = await supabase
    .from('exams')
    .insert({
      user_id: user.id,
      name,
      exam_date: examDate,
      cutoff_score: cutoffScore,
    })
    .select()
    .single()

  if (error) throw error
  return exam
}