import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function PUT(
  request: Request,
  { params }: { params: { step: string } }
) {
  const step = Number(params.step);
  const body = await request.json();

  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: existing } = await supabase
    .from('user_settings')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const patch: Record<string, any> = {
    user_id: user.id,
    updated_at: new Date().toISOString()
  };

  if (step === 1 && Array.isArray(body.exams)) {
    patch.selected_exams = body.exams;
  }
  if (step === 2 && body.examDate) {
    patch.exam_date = body.examDate;
  }
  if (step === 3 && body.dailyTime != null) {
    patch.daily_time_available = Number(body.dailyTime);
  }

  if (existing?.id) {
    const { error } = await supabase.from('user_settings').update(patch).eq('id', existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from('user_settings').insert(patch);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, step });
}
