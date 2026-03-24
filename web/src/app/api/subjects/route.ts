import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get('subject');
  const query = searchParams.get('q');

  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (subject) {
    // Fetch topics for this subject from topic_dictionary
    let dbQuery = supabase
      .from('topic_dictionary')
      .select('canonical, aliases')
      .eq('subject', subject);
    
    if (query) {
      dbQuery = dbQuery.ilike('canonical', `%${query}%`);
    }

    const { data: topics, error } = await dbQuery.limit(20);
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(topics || []);
  } else {
    // Fetch all user's active subjects from their exam or just dictionary
    const { data: subjects, error } = await supabase
      .from('topic_dictionary')
      .select('subject')
      .order('subject');
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    // Unique list of subjects
    const uniqueSubjects = Array.from(new Set(subjects?.map(s => s.subject) || []));
    return NextResponse.json(uniqueSubjects);
  }
}
