import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subject = String(searchParams.get('subject') || '').trim();

  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let query = supabase
    .from('topic_dictionary')
    .select('id, subject, canonical, aliases, usage_count, verified')
    .order('usage_count', { ascending: false });

  if (subject) query = query.eq('subject', subject);

  const { data, error } = await query.limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const subject = String(body.subject || '').trim();
  const canonical = String(body.canonical || '').trim();
  const aliases = Array.isArray(body.aliases)
    ? body.aliases.map((a: any) => String(a || '').trim()).filter(Boolean)
    : [];

  if (!subject || !canonical) {
    return NextResponse.json({ error: 'subject e canonical sao obrigatorios.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('topic_dictionary')
    .upsert(
      { subject, canonical, aliases },
      { onConflict: 'subject,canonical' }
    )
    .select('id, subject, canonical, aliases')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, topic: data });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get('id') || '').trim();
  if (!id) return NextResponse.json({ error: 'id obrigatorio.' }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase.from('topic_dictionary').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
