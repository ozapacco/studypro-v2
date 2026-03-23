'use client';

import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Layers, 
  Target, 
  ArrowLeft,
  Zap,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function EstatisticasPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="font-bold text-slate-400">Processando métricas...</p>
    </div>
  );

  const platformData = Object.entries(data?.platforms || {}).map(([name, val]: any) => ({
     name,
     accuracy: Math.round((val.hits / val.total) * 100),
     total: val.total
  }));

  const ranking = (data?.ranking || []).slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="bg-white px-6 pt-12 pb-10 rounded-b-[40px] shadow-sm">
         <div className="flex justify-between items-center mb-8">
            <Link href="/dashboard" className="p-2 bg-slate-100 rounded-xl">
               <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-widest">Analytics</h1>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
               <Zap size={20} />
            </div>
         </div>
         
         <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-600 p-5 rounded-[32px] text-white">
               <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-white">Meta Semanal</span>
               <p className="text-2xl font-black mt-1">82%</p>
               <div className="flex items-center gap-1 mt-2 text-blue-100 italic font-black text-[10px]">
                  <TrendingUp size={12} /> +2.1% sem
               </div>
            </div>
            <div className="bg-slate-900 p-5 rounded-[32px] text-white">
               <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-slate-400">Total Questões</span>
               <p className="text-2xl font-black mt-1">1.240</p>
               <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Guerreiro Polonês</p>
            </div>
         </div>
      </header>

      <div className="max-w-md mx-auto p-6 space-y-8">

        {/* Evolução Semanal (Line) */}
        <section className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-100">
           <h3 className="font-black text-slate-900 text-sm tracking-widest uppercase mb-6 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-600" />
              Evolução da Taxa
           </h3>
           <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={data?.weekly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                       dataKey="week" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{fontSize: 10, fontWeight: 900, fill: '#cbd5e1'}}
                       dy={10}
                    />
                    <YAxis 
                       hide={true}
                       domain={[0, 100]}
                    />
                    <Tooltip 
                       contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                    />
                    <Line 
                       type="monotone" 
                       dataKey="accuracy" 
                       stroke="#2563eb" 
                       strokeWidth={4} 
                       dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }}
                       activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                 </LineChart>
              </ResponsiveContainer>
           </div>
        </section>

        {/* Performance por Plataforma (Bar) */}
        <section className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-100">
           <h3 className="font-black text-slate-900 text-sm tracking-widest uppercase mb-6 flex items-center gap-2">
              <Layers size={16} className="text-blue-600" />
              Performance por Fonte
           </h3>
           <div className="grid grid-cols-2 gap-4">
              {platformData.map((p: any, idx: number) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-3xl text-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase truncate mb-1">{p.name}</p>
                   <p className="text-2xl font-black text-slate-900">{p.accuracy}%</p>
                   <p className="text-[10px] font-bold text-slate-400">{p.total} Qs</p>
                </div>
              ))}
           </div>
        </section>

        {/* Consistência (Heatmap Grid Simplified) */}
        <section className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-100">
           <h3 className="font-black text-slate-900 text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              Consistência (90 dias)
           </h3>
           <div className="grid grid-cols-13 gap-1">
              {Array.from({ length: 91 }).map((_, i) => (
                 <div 
                   key={i} 
                   className={cn(
                     "w-full pt-[100%] rounded-[2px]",
                     i % 5 === 0 ? "bg-blue-600" : i % 3 === 0 ? "bg-blue-200" : "bg-slate-100"
                   )} 
                 />
              ))}
           </div>
           <p className="text-[10px] font-black text-slate-400 mt-4 uppercase text-center italic">Meta: Não quebrar a corrente polonesa.</p>
        </section>

        {/* Tópico Ranking */}
        <section className="space-y-4">
           <h3 className="font-black text-slate-900 text-sm tracking-widest uppercase items-center flex gap-2">
              <Trophy size={16} className="text-yellow-500" />
              Sniper de Tópicos
           </h3>
           <div className="space-y-3">
              {ranking.map((r: any, idx: number) => (
                <div key={idx} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 font-black text-slate-400 text-xs text-blue-600">
                      #{idx + 1}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase truncate tracking-tight">{r.subject}</p>
                      <h4 className="font-black text-slate-900 truncate text-xs leading-none mt-1">{r.canonical_topic}</h4>
                   </div>
                   <div className="text-right shrink-0">
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{Math.round(r.accuracy)}%</span>
                   </div>
                </div>
              ))}
           </div>
        </section>

      </div>
      
      {/* Voltar Dashboard CTA */}
      <Link href="/dashboard" className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-3 active:scale-95 transition-all z-20 font-black text-sm">
         <LayoutDashboard size={18} />
         Cockpit Operacional
      </Link>
    </div>
  );
}
