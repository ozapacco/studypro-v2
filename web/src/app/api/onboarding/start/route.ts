import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Se não houver usuário, retornamos um mock ID para o modo Dev se necessário
  // Mas o ideal é que esteja logado.
  const userId = user?.id || 'mock-user-dev';

  // Na tabela topic_performance, mockamos o início
  return NextResponse.json({
    id: userId,
    step: 0,
    message: 'Onboarding started.',
  });
}
