import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const FALLBACK_EXAMS = [
  'Policia Civil (Agente/Escrivao)',
  'Policia Militar (Soldado/Oficial)',
  'Policia Federal',
  'Policia Rodoviaria Federal',
  'Guarda Municipal',
  'Policia Penal'
];

export async function GET() {
  const supabase = createServerSupabaseClient();

  const { data: templates } = await supabase
    .from('exam_templates')
    .select('name')
    .order('name', { ascending: true });

  if (templates && templates.length > 0) {
    return NextResponse.json({
      exams: templates.map((t: any) => t.name)
    });
  }

  return NextResponse.json({
    exams: FALLBACK_EXAMS
  });
}
