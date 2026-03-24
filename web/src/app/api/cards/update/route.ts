import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { cardId, updates } = await request.json();

  // Limitar o que pode ser editado por segurança
  const safeUpdates = {
    front: updates.front,
    back: updates.back,
    error_context: updates.error_context,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('cards')
    .update(safeUpdates)
    .eq('id', cardId)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
