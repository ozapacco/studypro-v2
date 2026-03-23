import 'react-native-get-random-values'
import { createClient, SupabaseClient, User } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import * as AuthSession from 'expo-auth-session'

const SUPABASE_URL = 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key'

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key)
    } catch {
      return null
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value)
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key)
    } catch {}
  },
}

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  })
  if (error) throw error
  return data
}

export async function signInWithGoogle() {
  const redirectUrl = AuthSession.makeRedirectUri({
    scheme: 'studypro',
    path: 'auth/callback',
  })

  const { data, error } = await AuthSession.startAuthSessionAsync({
    authUrl: `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${redirectUrl}`,
    redirectUrl,
    scheme: 'studypro',
  })

  if (error) throw error
  
  if (data?.type === 'success' && data.params.code) {
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession({
      code: data.params.code,
    })
    if (sessionError) throw sessionError
    return sessionData
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'studypro://reset-password',
  })
  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  if (error) throw error
}