import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date().toISOString();

  // Buscar cards vencidos de revisão ou aprendizado
  const { data: cards, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', user.id)
    .lte('due_date', now)
    .order('due_date', { ascending: true })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ cards: cards || [] });
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { cardId, rating } = await request.json(); // rating: 1 (Não), 2 (Mais ou Menos), 3 (Sim)
  
  const { data: card } = await supabase.from('cards').select('*').eq('id', cardId).single();
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  // Algoritmo FSRS Simplificado para o modo "Auto-Generated" do Spec
  let newState = card.state;
  let newInterval = card.interval || 0;
  let newLapses = card.lapses || 0;
  let newStability = Number(card.stability) || 0;
  let nextDate = new Date();

  // Ratings: 1 = Again (Não lembro), 2 = Hard (Mais ou Menos), 3 = Good (Lembro)
  if (rating === 1) {
    newState = 'relearning';
    newInterval = 1; // Volta para 1 dia
    newLapses += 1;
    newStability = Math.max(0.5, newStability * 0.5);
  } else if (rating === 2) {
    if (newState === 'new') {
        newState = 'learning';
        newInterval = 2;
    } else {
        newInterval = Math.max(newInterval * 1.5, 2);
    }
  } else if (rating === 3) {
    newState = 'review';
    if (card.state === 'new' || card.state === 'learning') {
       newInterval = 3;
    } else {
       newInterval = Math.max(newInterval * 2.5, 4);
    }
    newStability += 1.0;
  }

  // Cap interval at 365 days
  newInterval = Math.min(Math.round(newInterval), 365);
  
  nextDate.setDate(nextDate.getDate() + newInterval);

  const { error: updateError } = await supabase
    .from('cards')
    .update({
       state: newState,
       interval: newInterval,
       lapses: newLapses,
       stability: newStability,
       due_date: nextDate.toISOString()
    })
    .eq('id', cardId);

  // Criar Log
  await supabase.from('review_logs').insert({
    card_id: cardId,
    user_id: user.id,
    rating: rating === 1 ? 1 : rating === 2 ? 3 : 4, // mapeando para 1 a 5 no log interno
    new_interval: newInterval
  });

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ success: true, nextIntervalBase: newInterval });
}
