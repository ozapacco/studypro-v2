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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id } = req.query
    const cardId = Array.isArray(id) ? id[0] : id

    if (!cardId) {
      return res.status(400).json({ error: 'Card ID is required' })
    }

    const { rating } = req.body
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' })
    }

    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', user.id)
      .single()

    if (cardError || !card) {
      return res.status(404).json({ error: 'Card not found' })
    }

    let { stability, difficulty, interval, lapses } = card

    const diffFactors: Record<number, number> = { 1: 1.3, 2: 1.15, 3: 1.0, 4: 0.9, 5: 0.7 }
    difficulty = Math.max(1, Math.min(5, difficulty * (diffFactors[rating] || 1)))

    if (rating >= 3) {
      stability = stability * (1 + (11 - difficulty) * 0.1 * (rating - 3) / 3)
    } else {
      stability = stability * 0.5
      lapses++
    }

    if (rating >= 3) {
      interval = Math.round(stability * (6 - difficulty) / 5 * (1 + Math.log10(stability)))
    } else {
      interval = Math.max(1, Math.round(interval * 0.3))
    }

    interval = Math.min(interval, 365)

    const newState = rating >= 3 ? 'review' : 'relearning'

    const nextDue = new Date()
    nextDue.setDate(nextDue.getDate() + interval)

    const { data: updatedCard, error: updateError } = await supabase
      .from('cards')
      .update({
        stability: Math.round(stability * 100) / 100,
        difficulty: Math.round(difficulty * 100) / 100,
        interval,
        state: newState,
        due_date: nextDue.toISOString(),
        lapses,
      })
      .eq('id', cardId)
      .select()
      .single()

    if (updateError) throw updateError

    await supabase.from('review_logs').insert({
      card_id: cardId,
      user_id: user.id,
      rating,
      previous_interval: card.interval,
      previous_ease: card.difficulty,
      new_interval: interval,
      new_ease: difficulty,
    })

    return res.status(200).set(corsHeaders).json({
      success: true,
      card: updatedCard,
      nextReview: {
        interval,
        dueDate: nextDue.toISOString(),
        state: newState,
      },
    })

  } catch (error) {
    return res.status(500).set(corsHeaders).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}