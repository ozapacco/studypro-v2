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

    return new Response(JSON.stringify({
      success: true,
      cards: dueCards || [],
      total: dueCards?.length || 0,
      bySubject,
      estimatedMinutes: (dueCards?.length || 0) * 2,
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