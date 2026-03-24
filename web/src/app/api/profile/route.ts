import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(profile);
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  if (body.target_accuracy != null) updateData.target_accuracy = Number(body.target_accuracy);
  if (body.daily_time_minutes != null) updateData.daily_time_minutes = Number(body.daily_time_minutes);
  if (body.dark_mode != null) updateData.dark_mode = Boolean(body.dark_mode);
  if (body.fsrs_daily_limit != null) updateData.fsrs_daily_limit = Number(body.fsrs_daily_limit);
  if (body.fsrs_daily_new != null) updateData.fsrs_daily_new = Number(body.fsrs_daily_new);

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
