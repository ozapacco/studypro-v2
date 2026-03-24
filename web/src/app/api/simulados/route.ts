import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { triggerRecovery } from '@/lib/engines/recovery';

export async function POST(request: Request) {
  const body = await request.json();
  const { name, examDate, platform, cutoff, totalScore, subjects } = body;

  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Calcular Diagnóstico Geral
  const critical = subjects.filter((s: any) => (s.hits / s.total) < 0.5).map((s: any) => s.name);
  const strong = subjects.filter((s: any) => (s.hits / s.total) >= 0.8).map((s: any) => s.name);
  const attention = subjects.filter((s: any) => (s.hits / s.total) >= 0.5 && (s.hits / s.total) < 0.8).map((s: any) => s.name);

  // 2. Registrar o Simulado
  const { data: mock, error: mockError } = await supabase
    .from('mock_exams')
    .insert({
      user_id: user.id,
      name,
      exam_date: examDate,
      platform,
      total_score: totalScore,
      max_score: 100, // Assumindo base 100 por enquanto
      cutoff_score: cutoff,
      by_subject: subjects,
      analysis: { strong, attention, critical },
      critical_topics: critical
    })
    .select()
    .single();

  if (mockError) {
    console.error('Mock error:', mockError);
    return NextResponse.json({ error: mockError.message }, { status: 500 });
  }

  // 3. ATUALIZAR TOPIC PERFORMANCE E TRIGGER RECOVERY
  for (const s of subjects) {
    const accuracy = (s.hits / s.total);
    
    // Atualizar Topic Performance (como meta-tópico do simulado)
    await supabase
      .from('topic_performance')
      .upsert({
        user_id: user.id,
        subject: s.name,
        canonical_topic: 'GERAL (Simulado)',
        attempts: s.total,
        errors: s.total - s.hits,
        last_seen_at: new Date().toISOString()
      }, { onConflict: 'user_id,subject,canonical_topic' });

    // Se crítico (< 50%), joga na Fila de Recuperação (F2.3)
    if (accuracy < 0.5) {
      await triggerRecovery(
        supabase,
        user.id,
        s.name,
        'GERAL (Simulado)',
        'mock_exam',
        accuracy,
        undefined,
        mock.id
      );
    }
  }

  return NextResponse.json({
    success: true,
    mockId: mock.id,
    criticalCount: critical.length
  });
}
