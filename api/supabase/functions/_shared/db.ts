import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const createClient = (authHeader: string | null) => {
  const token = authHeader?.replace('Bearer ', '')
  return createClient(supabaseUrl, supabaseServiceKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false }
  })
}