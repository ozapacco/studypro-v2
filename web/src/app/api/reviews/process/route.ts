import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { cardId, rating } = await request.json(); 
  // rating: 1 (Errei), 2 (Difícil), 3 (Bom), 4 (Fácil) - Padrão Anki FSRS
  
  const { data: card } = await supabase.from('cards').select('*').eq('id', cardId).single();
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  let newState = card.state;
  let newInterval = card.interval || 0;
  let newLapses = card.lapses || 0;
  let newStability = Number(card.stability) || 0;
  let nextDate = new Date();

  // Algoritmo Escalável de Retenção Ativa (Padrão 4 steps)
  if (rating === 1) { // 1 = Errei (Lapse/Relearning)
    newState = 'relearning';
    newInterval = 0.5; // Menos de 1 dia na engine, cai rápido pra fila.
    newLapses += 1;
    newStability = Math.max(0.5, newStability * 0.4); 
  } else if (rating === 2) { // 2 = Difícil
    if (newState === 'new') {
        newState = 'learning';
        newInterval = 1;
    } else {
        newInterval = Math.max(newInterval * 1.2, 1);
    }
  } else if (rating === 3) { // 3 = Bom
    newState = 'review';
    if (card.state === 'new' || card.state === 'learning') {
       newInterval = 3;
    } else {
       newInterval = Math.max(newInterval * 2.5, 4);
    }
    newStability += 1.0;
  } else if (rating === 4) { // 4 = Fácil
    newState = 'review';
    if (card.state === 'new' || card.state === 'learning') {
       newInterval = 5;
    } else {
       newInterval = Math.max(newInterval * 3.5, 7);
    }
    newStability += 1.5;
  }

  // Cap interval at 365 days
  newInterval = Math.min(Math.round(newInterval), 365);
  // Garante pelo menos 1 dia em casos normais para n quebrar math no JS Date se round zero
  if (newInterval < 1) newInterval = 1; 

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

  // Registro analítico de sessão para o Health Dashboard
  await supabase.from('review_logs').insert({
    card_id: cardId,
    user_id: user.id,
    rating: rating,
    previous_interval: card.interval || 0,
    new_interval: newInterval,
    previous_ease: card.stability || 0,
    new_ease: newStability
  });

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ success: true, nextIntervalBase: newInterval });
}
