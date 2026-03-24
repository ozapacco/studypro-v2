import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function getActiveExamId(supabase: any, userId: string): Promise<string | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data: upcoming } = await supabase
    .from('exams')
    .select('id')
    .eq('user_id', userId)
    .gte('exam_date', today)
    .order('exam_date', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (upcoming?.id) return upcoming.id;

  const { data: latest } = await supabase
    .from('exams')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return latest?.id || null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get('subject');
  const query = (searchParams.get('q') || '').trim();
  const detailed = searchParams.get('detailed') === '1';

  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (subject) {
    let dbQuery = supabase
      .from('topic_dictionary')
      .select('id, subject, canonical, aliases, importance, general_difficulty, usage_count, verified')
      .eq('subject', subject)
      .order('usage_count', { ascending: false });

    const { data: topics, error } = await dbQuery.limit(50);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const filtered = (topics || []).filter((t: any) => {
      if (!query) return true;
      const q = query.toLowerCase();
      const canonical = String(t.canonical || '').toLowerCase();
      const aliases = (t.aliases || []).map((a: string) => String(a || '').toLowerCase());
      return canonical.includes(q) || aliases.some((a: string) => a.includes(q));
    });

    return NextResponse.json(
      filtered.map((t: any) => ({
        id: t.id,
        subject: t.subject,
        canonical: t.canonical,
        aliases: t.aliases || [],
        importance: t.importance || 50,
        general_difficulty: t.general_difficulty || 50,
        usageCount: t.usage_count || 0,
        verified: Boolean(t.verified)
      }))
    );
  }

  const examId = await getActiveExamId(supabase, user.id);
  if (!examId) return NextResponse.json([]);

  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('id, name, weight, importance, target_accuracy, current_accuracy, current_priority')
    .eq('exam_id', examId)
    .order('weight', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!detailed) {
    return NextResponse.json((subjects || []).map((s: any) => s.name));
  }

  return NextResponse.json(subjects || []);
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const mode = String(body.mode || 'subject');

  if (mode === 'topic') {
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
        { 
          subject, 
          canonical, 
          aliases,
          importance: Math.max(0, Math.min(100, Number(body.importance || 50))),
          general_difficulty: Math.max(0, Math.min(100, Number(body.difficulty || 50)))
        },
        { onConflict: 'subject,canonical' }
      )
      .select('id, subject, canonical, aliases, importance, general_difficulty')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, topic: data });
  }

  const name = String(body.name || '').trim();
  const weight = Number(body.weight ?? 50);
  const targetAccuracy = Number(body.target_accuracy ?? 70);

  if (!name) {
    return NextResponse.json({ error: 'Nome da disciplina e obrigatorio.' }, { status: 400 });
  }

  let examId = await getActiveExamId(supabase, user.id);
  if (!examId) {
    const { data: createdExam, error: examError } = await supabase
      .from('exams')
      .insert({
        user_id: user.id,
        name: 'Plano Personalizado',
        exam_date: null
      })
      .select('id')
      .single();

    if (examError) return NextResponse.json({ error: examError.message }, { status: 500 });
    examId = createdExam.id;
  }

  const { data: subject, error } = await supabase
    .from('subjects')
    .upsert(
      {
        exam_id: examId,
        name,
        weight: Math.max(0, Math.min(100, weight)),
        importance: Math.max(0, Math.min(100, Number(body.importance ?? 50))),
        target_accuracy: Math.max(40, Math.min(95, targetAccuracy))
      },
      { onConflict: 'exam_id,name' }
    )
    .select('id, exam_id, name, weight, importance, target_accuracy, current_accuracy')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, subject });
}

export async function PUT(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const id = String(body.id || '').trim();
  if (!id) return NextResponse.json({ error: 'id obrigatorio.' }, { status: 400 });

  const patch: any = {};
  if (body.name != null) patch.name = String(body.name).trim();
  if (body.weight != null) patch.weight = Math.max(0, Math.min(100, Number(body.weight)));
  if (body.importance != null) patch.importance = Math.max(0, Math.min(100, Number(body.importance)));
  if (body.target_accuracy != null) patch.target_accuracy = Math.max(40, Math.min(95, Number(body.target_accuracy)));

  const { data: found } = await supabase
    .from('subjects')
    .select('id, exam_id')
    .eq('id', id)
    .maybeSingle();

  if (!found) return NextResponse.json({ error: 'Disciplina nao encontrada.' }, { status: 404 });

  const { data: exam } = await supabase
    .from('exams')
    .select('id')
    .eq('id', found.exam_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!exam) return NextResponse.json({ error: 'Sem permissao para alterar essa disciplina.' }, { status: 403 });

  const { data: updated, error } = await supabase
    .from('subjects')
    .update(patch)
    .eq('id', id)
    .select('id, name, weight, target_accuracy, current_accuracy')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, subject: updated });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get('id') || '').trim();
  if (!id) return NextResponse.json({ error: 'id obrigatorio.' }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: found } = await supabase
    .from('subjects')
    .select('id, exam_id')
    .eq('id', id)
    .maybeSingle();
  if (!found) return NextResponse.json({ error: 'Disciplina nao encontrada.' }, { status: 404 });

  const { data: exam } = await supabase
    .from('exams')
    .select('id')
    .eq('id', found.exam_id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!exam) return NextResponse.json({ error: 'Sem permissao para excluir essa disciplina.' }, { status: 403 });

  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
