'use client';

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  ShieldAlert, 
  CheckCircle2, 
  ChevronRight,
  Zap,
  Medal,
  Clock,
  LayoutDashboard,
  BrainCircuit,
  PieChart,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function SaúdePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/saude')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="font-bold text-slate-400">Escaneando sua saúde...</p>
    </div>
  );

  const hasMocks = data?.mocks?.length > 0;
  const activeRecoveries = data?.recoveries || [];
  const projectedScore = Math.round(data?.projectedScore || 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="bg-white px-6 pt-12 pb-10 rounded-b-[40px] shadow-sm relative overflow-hidden">
        {/* Background Decorative Gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />
        
        <div className="relative z-10 flex justify-between items-start">
           <div>
              <h1 className="text-3xl font-black text-slate-900 leading-none">Minha Saúde</h1>
              <p className="text-slate-400 text-sm font-bold mt-2 tracking-tight uppercase">Diagnóstico e Nota de Corte</p>
           </div>
           <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Activity className="text-white" size={24} />
           </div>
        </div>

        {/* Projected Score Card */}
        <div className="mt-8 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-xl shadow-slate-200 text-white relative overflow-hidden">
           <Zap className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 text-yellow-400" />
           <div className="flex justify-between items-start">
             <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nota Projetada</span>
                <p className="text-4xl font-black mt-1">{projectedScore}%</p>
                <div className="flex items-center gap-1 text-green-400 mt-2">
                   <TrendingUp size={14} />
                   <span className="text-xs font-black">+4.2% tendencia</span>
                </div>
             </div>
             <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Faltam</span>
                <p className="text-2xl font-black mt-1 text-yellow-400">12 pts</p>
                <p className="text-[10px] font-bold opacity-60">Para TOP 5%</p>
             </div>
           </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-6 space-y-8">

        {/* Simulados - Evolução Linear */}
        <section className="space-y-4">
           <div className="flex justify-between items-center px-1">
              <h2 className="font-black text-slate-900 text-sm tracking-widest uppercase">Evolução em Simulado</h2>
              <div className="flex gap-3">
                 <Link href="/dashboard/simulados" className="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-blue-600 transition-colors">Ver Histórico</Link>
                 <Link href="/dashboard/simulados/registrar" className="text-blue-600 font-black text-[10px] uppercase tracking-widest">Registrar</Link>
              </div>
           </div>
           
           <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 min-h-[160px] flex items-end justify-between gap-2 overflow-hidden relative">
              {hasMocks ? data.mocks.slice(-5).map((m: any, idx: number) => (
                <div key={idx} className="flex flex-col items-center flex-1 group">
                   <div 
                      className={cn(
                        "w-full rounded-t-xl transition-all duration-700 relative",
                        m.total_score >= 70 ? "bg-green-500" : "bg-red-400"
                      )}
                      style={{ height: `${m.total_score}px` }}
                   >
                     <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {m.total_score}%
                     </span>
                   </div>
                   <span className="text-[8px] font-black text-slate-300 mt-2 uppercase text-center truncate w-full">
                      {new Date(m.exam_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                   </span>
                </div>
              )) : (
                <div className="w-full flex flex-col items-center justify-center p-4 text-center">
                   <PieChart size={32} className="text-slate-200 mb-2" />
                   <p className="text-xs text-slate-400 font-bold">Nenhum simulado para gerar histórico.</p>
                </div>
              )}
           </div>
        </section>

        {/* Fila de Recuperação - Status da UTI */}
        <section className="space-y-4">
           <div className="flex justify-between items-center px-1">
              <h2 className="font-black text-slate-900 text-sm tracking-widest uppercase items-center flex gap-2">
                 Status da UTI 
                 <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px]">{activeRecoveries.length}</span>
              </h2>
           </div>

           <div className="space-y-3">
              {activeRecoveries.length > 0 ? activeRecoveries.map((r: any, idx: number) => (
                <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden group">
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                   <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center shrink-0">
                      <ShieldAlert size={20} className="text-red-500 animate-pulse" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{r.subject}</p>
                      <h4 className="font-black text-slate-800 truncate leading-tight">{r.canonical_topic}</h4>
                      <p className="text-[9px] text-red-400 font-bold mt-0.5">Motivo: {r.reason}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-black text-slate-900">{r.trigger_count}x</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Alertas</p>
                   </div>
                </div>
              )) : (
                 <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 border-dashed text-center">
                   <CheckCircle2 size={32} className="text-green-200 mx-auto mb-3" />
                   <p className="text-sm font-black text-slate-900">Nenhuma matéria na UTI!</p>
                   <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-tighter">Sua saúde está em dia Comandante.</p>
                 </div>
              )}
           </div>
        </section>

        {/* Estratégia de Priorização - Matriz de Risco (Added) */}
        <section className="space-y-4">
           <div className="flex justify-between items-center px-1">
              <h2 className="font-black text-slate-900 text-sm tracking-widest uppercase items-center flex gap-2">
                 Matriz de Riscos
                 <Target size={14} className="text-blue-600" />
              </h2>
           </div>
           
           <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
              {data?.prioritySubjects?.map((s: any, idx: number) => (
                <div key={idx} className="space-y-2 group">
                   <div className="flex justify-between items-end">
                      <div>
                         <h4 className="font-black text-slate-900 text-sm truncate max-w-[200px]">{s.name}</h4>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Prioridade: {Math.round(s.priority)}</p>
                      </div>
                      <div className="text-right">
                         <span className={cn(
                           "text-[9px] font-black px-2 py-0.5 rounded-full uppercase",
                           s.priority > 150 ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                         )}>
                            {s.priority > 150 ? 'Crítico' : 'Estável'}
                         </span>
                      </div>
                   </div>
                   <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                      <div 
                        className={cn("h-full transition-all duration-1000", s.priority > 150 ? "bg-red-500" : "bg-blue-500")} 
                        style={{ width: `${Math.min(100, (s.priority / 300) * 100)}%` }} 
                      />
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Radar Polonês - Best e Worst difficulty */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                 <Medal size={16} className="text-blue-500" />
                 <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">Domínio</span>
              </div>
              <div className="space-y-3">
                 {data?.performance?.best?.slice(0, 3).map((b: any, i:number) => (
                   <div key={i}>
                      <p className="text-[8px] font-black text-slate-400 truncate uppercase tracking-tighter">{b.subject}</p>
                      <p className="text-xs font-black text-slate-900 truncate leading-none mt-0.5">{b.canonical_topic}</p>
                   </div>
                 ))}
                 {!data?.performance?.best?.length && <p className="text-[8px] font-bold text-slate-300">Sem dados.</p>}
              </div>
           </div>
           <div className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                 <ShieldAlert size={16} className="text-red-500" />
                 <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">Gargalos</span>
              </div>
              <div className="space-y-3">
                 {data?.performance?.worst?.slice(0, 3).map((w: any, i:number) => (
                   <div key={i}>
                      <p className="text-[8px] font-black text-slate-400 truncate uppercase tracking-tighter">{w.subject}</p>
                      <p className="text-xs font-black text-slate-900 truncate leading-none mt-0.5">{w.canonical_topic}</p>
                      <div className="w-full h-1 bg-slate-50 rounded-full mt-1">
                         <div className="h-full bg-red-400 rounded-full" style={{ width: `${w.personal_difficulty || 50}%` }} />
                      </div>
                   </div>
                 ))}
                 {!data?.performance?.worst?.length && <p className="text-[8px] font-bold text-slate-300">Sem dados.</p>}
              </div>
           </div>
        </div>

      </div>

      {/* Voltar Dashboard CTA */}
      <Link href="/dashboard" className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-3 active:scale-95 transition-all z-20 font-black text-sm">
         <LayoutDashboard size={18} />
         Cockpit Operacional
         <ArrowRight size={16} className="opacity-40" />
      </Link>
    </div>
  );
}
