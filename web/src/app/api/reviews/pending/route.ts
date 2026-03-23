import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date().toISOString();

  // Buscar fila polonesa de cards vencidos (New, Learning, Relearning, ou Review atrasado)
  const { data: cards, error } = await supabase
    .from('cards')
    .select('id, front, back, subject, canonical_topic, error_context, auto_generated, state, interval')
    .eq('user_id', user.id)
    .lte('due_date', now)
    .order('due_date', { ascending: true })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ cards: cards || [] });
}
