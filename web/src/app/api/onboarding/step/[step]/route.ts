import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function PUT(
  request: Request,
  { params }: { params: { step: string } }
) {
  const step = parseInt(params.step);
  const body = await request.json();
  const supabase = createServerSupabaseClient();

  // No onboarding real, salvaríamos isso no Supabase.
  // Como estamos em modo Setup, vamos apenas simular sucesso para a UI progredir
  // No passo 5, salvaríamos as configurações finais do usuário.

  console.log(`Onboarding Step ${step} updated:`, body);

  return NextResponse.json({
    success: true,
    step: step,
  });
}
