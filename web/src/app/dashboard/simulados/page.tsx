'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Target, 
  TrendingUp, 
  ChevronLeft,
  Trophy,
  Activity,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function SimuladosListPage() {
  const [mocks, setMocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/simulados')
      .then(res => res.json())
      .then(data => {
        setMocks(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao buscar simulados:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-blue-200 font-bold animate-pulse uppercase tracking-widest text-xs">Carregando Batalhas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 selection:bg-blue-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-12 relative z-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <Link href="/dashboard" className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors">
                  <ChevronLeft size={20} className="text-slate-400" />
               </Link>
               <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-black text-green-400 uppercase tracking-widest">
                  Zona de Combate
               </span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Simulados</h1>
            <p className="text-slate-400 font-medium">Histórico de simulações de prova e gap de corte.</p>
          </div>
          
          <Link href="/dashboard/simulados/registrar">
             <Button className="h-12 px-6 rounded-2xl font-black bg-blue-600 text-white shadow-lg shadow-blue-900/40 hover:bg-blue-500">
                <Plus size={18} className="mr-2" />
                Registrar Batalha
             </Button>
          </Link>
        </header>

        <div className="space-y-6">
           {mocks.length === 0 ? (
             <div className="py-32 text-center border-2 border-dashed border-slate-800 rounded-[40px] bg-slate-900/40 relative overflow-hidden group">
                <div className="w-20 h-20 bg-slate-950 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-800 group-hover:scale-110 transition-transform">
                   <Target size={32} className="text-blue-500" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Sua prancheta está limpa</h3>
                <p className="text-slate-400 font-bold mb-8">Nenhum simulado registrado. O campo de batalha aguarda seu primeiro teste.</p>
                <Link href="/dashboard/simulados/registrar">
                   <Button className="h-14 px-8 rounded-2xl font-black bg-white text-blue-900 hover:bg-blue-50">
                      Entrar na Arena
                   </Button>
                </Link>
             </div>
           ) : (
             mocks.map((m: any) => {
               const diff = Number(m.total_score) - Number(m.cutoff_score || 70);
               const isApproved = diff >= 0;

               return (
                 <div key={m.id} className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-6 lg:p-8 backdrop-blur-xl hover:border-slate-700 transition-all group relative overflow-hidden">
                    <div className={cn(
                      "absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20",
                      isApproved ? "bg-green-500" : "bg-red-500"
                    )} />

                    <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                       
                       {/* Left side: Overview */}
                       <div className="flex-1 space-y-6">
                          <div>
                             <div className="flex items-center gap-3 mb-2">
                                <Activity size={16} className="text-slate-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(m.exam_date).toLocaleDateString('pt-BR')} • {m.platform}</span>
                             </div>
                             <h2 className="text-2xl font-black text-white">{m.name}</h2>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                             <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Seu Score</span>
                                <div className="flex items-end gap-2 text-white">
                                   <span className="text-4xl font-black leading-none">{m.total_score}%</span>
                                </div>
                             </div>
                             <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Nota de Corte</span>
                                <div className="flex items-end gap-2 text-slate-300">
                                   <span className="text-4xl font-black leading-none opacity-50">{m.cutoff_score || 70}%</span>
                                </div>
                             </div>
                          </div>

                          {/* Approval Status Badge */}
                          <div className={cn(
                            "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest",
                            isApproved ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                          )}>
                            {isApproved ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            {isApproved ? `Aprovado (+${diff}pts)` : `Reprovado (${diff}pts)`}
                          </div>
                       </div>

                       {/* Right side: Subject breakdown */}
                       <div className="flex-1 bg-slate-950/40 rounded-3xl p-6 border border-slate-800">
                          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                             <Layers size={14} /> Raio-X das Matérias
                          </h3>
                          <div className="space-y-4">
                             {m.by_subject?.map((sub: any, idx: number) => (
                               <div key={idx} className="space-y-1">
                                  <div className="flex justify-between items-end">
                                     <span className="text-sm font-bold text-slate-200 truncate">{sub.subject}</span>
                                     <span className={cn(
                                       "text-xs font-black",
                                       sub.percentage >= 70 ? "text-green-400" : sub.percentage >= 50 ? "text-yellow-400" : "text-red-400"
                                     )}>{sub.percentage}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                     <div 
                                       className={cn(
                                         "h-full rounded-full transition-all",
                                         sub.percentage >= 70 ? "bg-green-500" : sub.percentage >= 50 ? "bg-yellow-500" : "bg-red-500"
                                       )}
                                       style={{ width: `${Math.min(100, sub.percentage)}%` }}
                                     />
                                  </div>
                               </div>
                             ))}
                             {(!m.by_subject || m.by_subject.length === 0) && (
                               <p className="text-xs font-bold text-slate-400 italic">Detalhamento não fornecido.</p>
                             )}
                          </div>
                       </div>

                    </div>
                 </div>
               );
             })
           )}
        </div>
      </div>
    </div>
  );
}
