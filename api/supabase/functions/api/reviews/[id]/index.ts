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

    const url = new URL(req.url)
    const cardId = url.pathname.split('/').pop()

    const body = await req.json()
    const { rating } = body

    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', user.id)
      .single()

    if (cardError || !card) {
      return new Response(JSON.stringify({ error: 'Card not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let { stability, difficulty, interval, lapses } = card

    const diffFactors = { 1: 1.3, 2: 1.15, 3: 1.0, 4: 0.9, 5: 0.7 }
    difficulty = Math.max(1, Math.min(5, difficulty * (diffFactors[rating as keyof typeof diffFactors] || 1)))

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

    return new Response(JSON.stringify({
      success: true,
      card: updatedCard,
      nextReview: {
        interval,
        dueDate: nextDue.toISOString(),
        state: newState,
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