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

    const { data: dueCards, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id)
      .lte('due_date', new Date().toISOString())
      .in('state', ['review', 'learning', 'relearning'])
      .order('due_date', { ascending: true })
      .limit(20)

    if (error) throw error

    const bySubject = dueCards?.reduce((acc, card) => {
      acc[card.subject] = (acc[card.subject] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return res.status(200).set(corsHeaders).json({
      success: true,
      cards: dueCards || [],
      total: dueCards?.length || 0,
      bySubject,
      estimatedMinutes: (dueCards?.length || 0) * 2,
    })

  } catch (error) {
    return res.status(500).set(corsHeaders).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}