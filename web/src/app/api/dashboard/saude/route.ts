import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Histórico de Simulados
  const { data: mocks } = await supabase
    .from('mock_exams')
    .select('*')
    .eq('user_id', user.id)
    .order('exam_date', { ascending: true });

  // 2. Fila de Recuperação Ativa
  const { data: recoveries } = await supabase
    .from('recovery_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'in_progress');

  // 3. Top Cobertura vs Gaps (Radar Polonês)
  const { data: topics } = await supabase
    .from('topic_performance')
    .select('*')
    .eq('user_id', user.id)
    .order('accuracy', { ascending: false });

  // 4. Calcular Nota Projetada (Média dos últimos 3 simulados + tendência)
  const last3Mocks = (mocks || []).slice(-3);
  const currentAvg = last3Mocks.length > 0 
    ? last3Mocks.reduce((acc: number, m: any) => acc + (m.total_score || 0), 0) / last3Mocks.length 
    : 0;
    
  // Projetar 1.5% de ganho semanal até a prova (ex: 30 dias = 4 semanas = 6.0%)
  const projectedScore = Math.min(95, currentAvg + 5.0); // Dummy projection for now

  return NextResponse.json({
    mocks: mocks || [],
    recoveries: recoveries || [],
    projectedScore,
    performance: {
       best: topics?.slice(0, 3) || [],
       worst: topics?.filter((t: any) => t.attempts > 5).slice(-3) || []
    }
  });
}
