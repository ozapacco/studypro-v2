import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { scheduleReview, DEFAULT_FSRS_PARAMS } from '@/lib/engines/fsrs';
import { ReviewRating } from '@/types';

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { cardId, rating } = await request.json(); 
  // rating: 1 (Errei), 2 (Difícil), 3 (Bom), 4 (Fácil) - Padrão Anki FSRS
  
  const { data: card } = await supabase.from('cards').select('*').eq('id', cardId).single();
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  // 1. Buscar parâmetros do usuário
  const { data: profile } = await supabase.from('profiles')
    .select('fsrs_weights, fsrs_retention')
    .eq('id', user.id)
    .single();

  const userParams = profile ? {
      w: profile.fsrs_weights || DEFAULT_FSRS_PARAMS.w,
      requestRetention: profile.fsrs_retention || DEFAULT_FSRS_PARAMS.requestRetention
  } : DEFAULT_FSRS_PARAMS;

  // 2. Executar Engine FSRS v2.2
  const result = scheduleReview(
    {
      state: card.state,
      stability: Number(card.stability) || 0.1,
      difficulty: Number(card.difficulty) || 2.5,
      lapses: card.lapses || 0,
      learning_step: card.learning_step || 0
    },
    rating as ReviewRating,
    userParams
  );

  const { error: updateError } = await supabase
    .from('cards')
    .update({
       state: result.state,
       interval: result.interval,
       lapses: rating === 1 ? (card.lapses || 0) + 1 : (card.lapses || 0),
       stability: result.stability,
       difficulty: result.difficulty,
       due_date: result.due_date.toISOString()
    })
    .eq('id', cardId);

  // Registro analítico de sessão para o Health Dashboard
  await supabase.from('review_logs').insert({
    card_id: cardId,
    user_id: user.id,
    rating: rating,
    previous_interval: card.interval || 0,
    new_interval: result.interval,
    previous_ease: card.stability || 0,
    new_ease: result.stability
  });

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ success: true, nextIntervalBase: result.interval });
}
