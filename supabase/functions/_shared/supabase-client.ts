import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function createServerClient(supabaseUrl: string, supabaseKey: string) {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function createServiceClient(supabaseUrl: string, serviceKey: string) {
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function getAuthToken(authorization: string | null): string | null {
  if (!authorization) return null
  const [type, token] = authorization.split(' ')
  if (type !== 'Bearer') return null
  return token
}
