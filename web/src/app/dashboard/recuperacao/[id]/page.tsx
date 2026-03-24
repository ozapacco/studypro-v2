'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { 
  CheckCircle2, 
  RotateCcw, 
  Play, 
  BookOpen, 
  Target, 
  ChevronLeft,
  Zap,
  Clock,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RecoveryPlanPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('recovery_queue')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar recuperação:', error);
      } else {
        setEntry(data);
        if (data.status === 'open') {
           // Marcar como "em progresso" ao abrir
           await supabase
             .from('recovery_queue')
             .update({ status: 'in_progress', started_at: new Date().toISOString() })
             .eq('id', id);
        }
      }
      setLoading(false);
    }
    fetchData();
  }, [id, supabase]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!entry) return <div className="p-8 text-center"><p>Recuperação não encontrada.</p><Button onClick={() => router.push('/dashboard')}>Voltar</Button></div>;

  const plan = typeof entry.suggested_actions === 'string' 
    ? JSON.parse(entry.suggested_actions) 
    : entry.suggested_actions;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white px-6 pt-10 pb-8 border-b border-slate-100 flex items-center justify-between">
         <button onClick={() => router.push('/dashboard')} className="p-2 -ml-2 text-slate-400">
           <ChevronLeft size={24} />
         </button>
         <div className="text-center flex-1">
           <h1 className="text-lg font-black text-slate-900 tracking-tight">Cicatrizando</h1>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{entry.subject}</p>
         </div>
         <div className="w-10" />
      </header>

      <div className="max-w-md mx-auto p-6 space-y-8">
        {/* Tópico Card */}
        <section className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
           <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-6">
              <RotateCcw size={32} />
           </div>
           <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2">{entry.canonical_topic}</h2>
           <p className="text-sm font-medium text-slate-500 mb-6">Motivo: {entry.reason === 'never_learned' ? 'Base não encontrada' : 'Acurácia abaixo da meta'}</p>
           <div className="flex items-center justify-center gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase">{plan.method}</span>
           </div>
        </section>

        {/* Plano de Ação */}
        <section className="space-y-4">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Passos de Recuperação</h3>
           <div className="space-y-3">
              {plan.steps.map((step: any, idx: number) => (
                <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4 group">
                   <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      {step.action === 'review_theory' && <BookOpen size={20} />}
                      {step.action === 'fix_errors' && <Zap size={20} />}
                      {step.action === 'video_lecture' && <Play size={20} />}
                      {step.action === 'drill_questions' && <Target size={20} />}
                   </div>
                   <div className="flex-1">
                      <h4 className="font-black text-slate-900 text-sm leading-tight mb-1">{step.description}</h4>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase">
                         <span className="flex items-center gap-1"><Clock size={10} /> {step.duration || step.count + ' questões'}</span>
                         {step.link && <span className="text-blue-600 flex items-center gap-1 cursor-pointer"><ExternalLink size={10} /> Abrir Link</span>}
                      </div>
                   </div>
                   <button className="w-6 h-6 rounded-full border-2 border-slate-100 flex items-center justify-center hover:border-blue-600 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-blue-600 opacity-0 hover:opacity-100 transition-opacity" />
                   </button>
                </div>
              ))}
           </div>
        </section>

        {/* Action Button */}
        <div className="space-y-3">
           <Button 
             className="w-full h-16 rounded-2xl bg-blue-600 text-white font-black text-lg shadow-xl shadow-blue-200"
             onClick={() => router.push('/dashboard/registrar')}
           >
             Registrar Progresso
           </Button>
           <Button 
             variant="ghost" 
             className="w-full text-slate-400 font-bold text-sm"
             onClick={async () => {
                await supabase.from('recovery_queue').update({ status: 'archived' }).eq('id', id);
                router.push('/dashboard');
             }}
           >
             Ignorar esta falha (Arquivar)
           </Button>
        </div>
      </div>
    </div>
  );
}
