import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, daily_time_minutes')
    .eq('id', user.id)
    .single();

  const { data: exams } = await supabase
    .from('exams')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  return NextResponse.json({
    id: profile?.id || user.id,
    step: exams && exams.length > 0 ? 5 : 0,
    message: 'Onboarding iniciado.'
  });
}
