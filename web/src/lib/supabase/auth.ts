'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from './server'

export async function signIn(formData: FormData) {
  const supabase = createServerSupabaseClient()
  
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect(`/login?error=true&message=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signUp(formData: FormData) {
  const supabase = createServerSupabaseClient()
  
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('fullName') as string,
      },
    },
  }

  const { error, data: authData } = await supabase.auth.signUp(data)

  if (error) {
    redirect(`/register?error=true&message=${encodeURIComponent(error.message)}`)
  }

  if (authData?.user?.identities?.length === 0) {
    redirect('/register?error=true&message=' + encodeURIComponent('Email já está em uso.'))
  }

  if (!authData.session && authData.user) {
    // Session is null, meaning email confirmation is required
    redirect(`/login?error=true&message=${encodeURIComponent('Cadastro realizado! Por favor, verifique sua caixa de entrada para confirmar o email antes de entrar.')}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}
