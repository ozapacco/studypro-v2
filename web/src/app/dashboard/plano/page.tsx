'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Plus, 
  RotateCcw, 
  Target, 
  TrendingUp, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Calendar,
  Flame,
  LayoutDashboard,
  Settings,
  Scale,
  BrainCircuit,
  PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const SUBJECT_PRIORITIES = [
  { subject: 'Direito Penal', weight: 15, gap: 12, trend: 'up', status: 'prioridade_alta' },
  { subject: 'Direito Adm.', weight: 12, gap: 5, trend: 'stable', status: 'em_dia' },
  { subject: 'Português', weight: 20, gap: 18, trend: 'down', status: 'alerta_crítico' },
  { subject: 'Constitucional', weight: 12, gap: 8, trend: 'up', status: 'prioridade_media' }
];

export default function PlannerPage() {
  const [autoAdjust, setAutoAdjust] = useState(true);

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-slate-50">
      <header className="bg-white px-6 pt-10 pb-8 rounded-b-[40px] shadow-sm">
        <div className="flex justify-between items-center mb-6">
           <div>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-1">Estratégia do Plano</span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Meus Resultados</h1>
           </div>
           <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Scale size={20} />
           </div>
        </div>

        {/* Global Strategy Toggles */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
           <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <BrainCircuit size={16} />
                 </div>
                 <h3 className="font-bold text-slate-900 text-sm italic tracking-tight">Ajuste Inteligente</h3>
              </div>
              <button 
                onClick={() => setAutoAdjust(!autoAdjust)}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative overflow-hidden",
                  autoAdjust ? "bg-blue-600" : "bg-slate-300"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  autoAdjust ? "right-1" : "left-1"
                )} />
              </button>
           </div>
           <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest leading-none">
             O Orquestrador recalcula prioridades baseado em seus erros recentes de forma automática.
           </p>
        </div>
      </header>

      <main className="p-6 space-y-6">
        
        {/* Materias e pesos */}
        <section className="space-y-4">
           <div className="flex justify-between items-center px-2">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Peso x Gap por Matéria</h3>
              <PieChart size={18} className="text-slate-400" />
           </div>

           <div className="space-y-3">
              {SUBJECT_PRIORITIES.map((s) => (
                <div key={s.subject} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group hover:border-blue-200 transition-all flex items-center justify-between relative overflow-hidden">
                   {s.status === 'alerta_crítico' && (
                      <div className="absolute top-0 right-0 p-1 px-3 bg-red-100 text-red-600 text-[8px] font-black uppercase rounded-bl-xl tracking-widest">Atenção Crítica</div>
                   )}
                   <div className="space-y-1">
                      <h4 className="font-bold text-slate-900">{s.subject}</h4>
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Peso: {s.weight}%</span>
                         <span className={cn(
                           "text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-tighter",
                           s.trend === 'up' ? "bg-green-50 text-green-700" : s.trend === 'down' ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-600"
                         )}>
                           Gap: {s.gap}%
                         </span>
                      </div>
                   </div>
                   <div className="flex flex-col items-end">
                      <div className="w-10 h-10 bg-slate-100 group-hover:bg-blue-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-all">
                        <TrendingUp size={18} className={cn(s.trend === 'down' && "rotate-90")} />
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Action Info */}
        <section className="bg-white/50 backdrop-blur-sm p-6 rounded-[40px] border-2 border-dashed border-slate-200 text-center">
            <h3 className="font-black text-slate-900 text-lg mb-2">Refinar Estratégia</h3>
            <p className="text-slate-500 text-xs font-medium mb-6 px-4">
              Você pode ajustar seu objetivo de acertos (Target Score) para que o orquestrador seja mais exigente.
            </p>
            <Button variant="outline" className="w-full py-6 rounded-2xl font-bold border-2">
               Alterar Configurações Base
               <Settings size={18} className="ml-2" />
            </Button>
        </section>

      </main>
    </div>
  );
}
