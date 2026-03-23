import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { 
  Plus, 
  RotateCcw, 
  Target, 
  TrendingUp, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Menu,
  Bell,
  BarChart3,
  Calendar,
  Flame,
  LayoutDashboard
} from 'lucide-react';
import { cn, formatPercentage } from '@/lib/utils';
import Link from 'next/link';
import { redirect } from 'next/navigation';

async function getDashboardData() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Chamar API interna (simulado via call direta se possível, mas aqui usamos a lógica)
  // Como estamos em Server Component, podemos ler do Supabase diretamente.
  
  // 1. Sessions de hoje
  const today = new Date().toISOString().split('T')[0];
  const { data: sessions } = await supabase
    .from('question_sessions')
    .select('*')
    .eq('user_id', user.id)
    .gte('session_date', today);

  // 2. Cards Pendentes
  const { count: dueCards } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('due', new Date().toISOString());

  // 3. Matéria fraca
  const { data: weakTopics } = await supabase
    .from('topic_performance')
    .select('subject, canonical_topic, accuracy')
    .eq('user_id', user.id)
    .lt('accuracy', 70)
    .order('accuracy', { ascending: true })
    .limit(1);

  const totalQuestions = sessions?.reduce((acc, s) => acc + s.total_questions, 0) || 0;
  const totalHits = sessions?.reduce((acc, s) => acc + s.correct_answers, 0) || 0;
  const accuracy = totalQuestions > 0 ? (totalHits / totalQuestions) * 100 : 0;

  return {
    user: {
      name: user.user_metadata?.full_name?.split(' ')[0] || 'Guerreiro',
      avatar: user.user_metadata?.avatar_url
    },
    stats: {
      totalQuestions,
      accuracy: Math.round(accuracy),
      dueCards: dueCards || 0,
      streak: 1 // Hardcoded streak por enquanto
    },
    mission: {
      title: weakTopics?.[0] 
        ? `${weakTopics[0].subject}` 
        : 'Inicie seu Ciclo',
      description: weakTopics?.[0]
        ? `Resolver 20 questões de **${weakTopics[0].canonical_topic}**.`
        : 'Sua meta é bater 50 questões hoje.',
      reason: weakTopics?.[0]
        ? `Subir sua média de ${Math.round(weakTopics[0].accuracy)}% neste tópico.`
        : 'Manter a constância no radar polonês.',
      progress: Math.min(100, Math.round((totalQuestions / 50) * 100)),
      type: weakTopics?.[0] ? 'Focar Erros' : 'Meta Base',
      explanation: weakTopics?.[0] 
        ? "Priorizando seus pontos cegos para subir sua média geral."
        : "Foco em manter a constância e bater a meta de questões."
    }
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { user, stats, mission } = data;

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-slate-50">
      {/* Dynamic Header */}
      <header className="bg-white px-6 pt-10 pb-8 rounded-b-[40px] shadow-sm relative overflow-hidden">
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50" />
        <div className="flex justify-between items-center relative z-10">
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-1">Cockpit Operacional</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bom dia, {user.name} 👋</h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm relative">
                <Bell size={20} className="text-slate-400" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
             </div>
             {user.avatar ? (
               <img src={user.avatar} className="w-12 h-12 rounded-2xl border-2 border-white shadow-md" alt="Avatar" />
             ) : (
               <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-200">
                  {user.name[0]}
               </div>
             )}
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 gap-3 mt-10 relative z-10">
           <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center gap-4 group hover:bg-white hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                 <Flame size={20} />
              </div>
              <div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Constância</span>
                 <p className="font-black text-slate-900 leading-none">{stats.streak} Dias</p>
              </div>
           </div>
           <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center gap-4 group hover:bg-white hover:shadow-md transition-all font-black">
              <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                 <Target size={20} />
              </div>
              <div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Acerto Médio</span>
                 <p className="font-black text-green-600 leading-none">{stats.accuracy}%</p>
              </div>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 -mt-4 relative z-10 space-y-6">
        
        {/* Cicatrização Alert (If any) */}
        {stats.dueCards > 0 && (
          <Link href="/dashboard/revisar" className="block animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-amber-600 rounded-3xl p-6 text-white flex items-center justify-between shadow-xl shadow-amber-200 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-150 transition-transform">
                <RotateCcw size={80} />
              </div>
              <div className="flex items-center gap-5">
                 <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                    <RotateCcw size={28} className="animate-spin-slow" />
                 </div>
                 <div>
                    <h2 className="text-xl font-black">Cicatrizar Erros</h2>
                    <p className="text-amber-100 text-xs font-semibold">{stats.dueCards} cards pendentes no radar.</p>
                 </div>
              </div>
              <ChevronRight size={24} className="text-amber-200" />
            </div>
          </Link>
        )}

        {/* Missão do Dia (The Spotlight) */}
        <section className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
           <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                 <Zap size={18} className="text-blue-600 fill-blue-600" />
                 <h3 className="font-black text-slate-900 tracking-tight uppercase text-xs tracking-widest">Missão do Dia</h3>
              </div>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                mission.type === 'Focar Erros' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
              )}>
                {mission.type}
              </span>
           </div>

           <h2 className="text-3xl font-black text-slate-900 mb-2 leading-tight">
             {mission.title}
           </h2>
           <p className="text-slate-600 font-medium mb-8 leading-relaxed">
             {mission.description}
             <span className="block mt-2 text-xs text-blue-600 font-bold italic">{mission.explanation}</span>
           </p>

           <div className="space-y-4">
              <div className="flex justify-between items-end mb-1">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progresso da Operação</span>
                 <span className="text-blue-600 font-black text-sm">{mission.progress}%</span>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                   style={{ width: `${mission.progress}%` }} 
                 />
              </div>
           </div>

           <div className="flex gap-3 mt-8">
              <Link href="/dashboard/registrar" className="flex-1">
                <Button className="w-full py-8 h-12 rounded-2xl shadow-lg shadow-blue-200 font-black text-lg">
                   Registrar Treino
                   <Plus size={20} className="ml-2" />
                </Button>
              </Link>
           </div>
        </section>

        {/* Activity Feed / Health */}
        <section className="space-y-4">
           <div className="flex justify-between items-center px-2">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Atividade Recente</h3>
              <Link href="/dashboard/stats" className="text-xs font-bold text-blue-600 py-1 px-3 bg-blue-50 rounded-full flex items-center gap-1">
                Ver Tudo <ChevronRight size={12} />
              </Link>
           </div>
           
           <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                    <BarChart3 size={24} />
                 </div>
                 <div>
                    <h4 className="font-bold text-slate-900 text-sm">Resumo da Semana</h4>
                    <p className="text-xs text-slate-500 font-medium">{stats.totalQuestions} questões resolvidas.</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="font-black text-slate-900 leading-none">+{stats.accuracy}%</p>
                 <span className="text-[10px] text-green-600 font-bold uppercase">Tendência</span>
              </div>
           </div>
        </section>

      </main>
      
      {/* Bottom Padding for Navbar */}
      <div className="h-10" />
    </div>
  );
}
