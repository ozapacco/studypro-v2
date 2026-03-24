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
  LayoutDashboard,
  Clock,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { cn, formatPercentage } from '@/lib/utils';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { generateDailyMissionAsync, getMockImpact } from '@/lib/engines/planner';

async function getDashboardData() {
 try {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return { error: 'Supabase não configurado' };
  }
  // BYPASS AUTH: Hardcoding Guest User as requested
  const userId = 'c20f5854-5600-4075-a0f0-563ccf385a0b';
  const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  
  const user = {
    user_metadata: {
      full_name: userProfile?.full_name || 'Concurseiro',
      avatar_url: userProfile?.avatar_url
    }
  };

  // Chamar API interna (simulado via call direta se possível, mas aqui usamos a lógica)
  // Como estamos em Server Component, podemos ler do Supabase diretamente.
  
  // 1. Sessions de hoje
  const today = new Date().toISOString().split('T')[0];
  const { data: sessions } = await supabase
    .from('question_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('session_date', today);

  // 2. Cards Pendentes
  const { count: dueCards } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('due', new Date().toISOString());

  // 3. Matéria fraca e Tópico crítico
  const { data: weakTopics } = await supabase
    .from('topic_performance')
    .select('subject, canonical_topic, accuracy, attempts')
    .eq('user_id', userId)
    .gt('attempts', 5) // Mínimo de amostragem
    .order('accuracy', { ascending: true })
    .limit(3);

  const { data: weakSubject } = await supabase
    .from('subjects')
    .select('name, current_accuracy')
    .eq('user_id', userId)
    .order('current_priority', { ascending: false })
    .limit(1)
    .single();
 // Handle cases with no data

  // 4. Fila de Recuperação (F2.3)
  const { data: recoveryQueue } = await supabase
    .from('recovery_queue')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['open', 'in_progress'])
    .order('created_at', { ascending: false });

  // 4. Calcular Streak Real
  const { data: allSessions } = await supabase
    .from('question_sessions')
    .select('session_date')
    .eq('user_id', userId)
    .order('session_date', { ascending: false });

  let streak = 0;
  if (allSessions && allSessions.length > 0) {
    const dates = Array.from(new Set(allSessions.map((s: any) => (s.session_date as string).split('T')[0])));
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Se a última sessão não foi hoje nem ontem, streak é 0
    const lastSessionDate = dates[0] as string;
    const diff = (new Date(todayStr).getTime() - new Date(lastSessionDate).getTime()) / (1000 * 3600 * 24);
    
    if (diff <= 1) {
      streak = 1;
      for (let i = 0; i < dates.length - 1; i++) {
        const d1 = new Date(dates[i] as string);
        const d2 = new Date(dates[i+1] as string);
        const dayDiff = (d1.getTime() - d2.getTime()) / (1000 * 3600 * 24);
        if (dayDiff === 1) {
          streak++;
        } else {
          break;
        }
      }
    }
  }

  const totalQuestions = sessions?.reduce((acc: number, s: any) => acc + s.total_questions, 0) || 0;
  const totalHits = sessions?.reduce((acc: number, s: any) => acc + s.correct_answers, 0) || 0;
  const accuracy = totalQuestions > 0 ? (totalHits / totalQuestions) * 100 : 0;

  const mockImpact = await getMockImpact(userId);
  const dailyMission = await generateDailyMissionAsync(userId);

  const isNewUser = (allSessions?.length || 0) === 0;

  return {
    isNewUser,
    isPostImpact: mockImpact?.isFailed || false,
    user: {
      name: user.user_metadata?.full_name?.split(' ')[0] || 'Guerreiro',
      avatar: user.user_metadata?.avatar_url
    },
    stats: {
      totalQuestions,
      accuracy: Math.round(accuracy),
      dueCards: dueCards || 0,
      streak: streak || 0,
      weakSubject: weakSubject?.name || '---',
      criticalTopic: weakTopics?.[0]?.canonical_topic || '---',
      hasTrustedData: (weakTopics?.length || 0) > 0
    },
    mission: {
      title: dailyMission.missions[0]?.subject || 'Inicie seu Ciclo',
      description: dailyMission.missions[0]?.topic 
        ? `Prática de **${dailyMission.missions[0].topic}**.`
        : 'Sua meta é manter a constância hoje.',
      reason: dailyMission.explanation,
      progress: dailyMission.missions[0]?.targetCount 
        ? Math.min(100, Math.round((totalQuestions / dailyMission.missions[0].targetCount) * 100))
        : 0,
      type: dailyMission.missions[0]?.type === 'review' ? 'Manutenção' : 'Reforço',
      explanation: dailyMission.explanation
    },
    recoveryQueue: recoveryQueue || []
  };
 } catch (err: any) {
    // CRÍTICO: Não capturar NEXT_REDIRECT pois ele é usado pelo Next.js para redirecionar de fato.
    if (err?.message === 'NEXT_REDIRECT' || err?.digest?.includes('NEXT_REDIRECT')) {
       throw err;
    }
    console.error('DASHBOARD_FATAL:', err);
    return { error: err.message || 'Erro ao carregar dados' };
 }
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  
  if ('error' in data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-slate-50">
        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl max-w-lg w-full">
           <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-red-600" />
           </div>
           <h2 className="text-2xl font-black text-slate-900 mb-2">Falha de Conexão</h2>
           <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">
             O sistema não conseguiu se comunicar com o banco de dados Supabase. Verifique as configurações abaixo.
           </p>

           <div className="bg-slate-50 rounded-2xl p-6 text-left mb-8 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-400">
                <span>Diagnóstico Operacional</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-bold">Variáveis ENV:</span>
                <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? "text-green-600 font-black" : "text-red-500 font-black"}>
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? "DETECTADAS" : "AUSENTES"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-bold">Auth Session:</span>
                <span className="text-amber-500 font-black italic">AGUARDANDO SYNC</span>
              </div>
              <div className="mt-4 p-3 bg-red-50 rounded-xl text-[10px] font-mono text-red-600 overflow-hidden">
                ERROR_LOG: {String(data.error).toUpperCase()}
              </div>
           </div>

           <div className="space-y-3">
             <Link href="/" className="block w-full p-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                Tentar Novamente
             </Link>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Dica: Um "Redeploy" na Vercel é necessário após salvar chaves.</p>
           </div>
        </div>
      </div>
    );
  }

  const { user, stats, mission, recoveryQueue } = data;

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

      {/* Post-Impact HUD (F3.1) */}
      {data.isPostImpact && (
        <section className="px-6 -mt-2 mb-4 animate-pulse">
           <div className="bg-red-950/90 border-2 border-red-500 rounded-3xl p-5 flex items-center justify-between shadow-lg shadow-red-200">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-inner">
                    <AlertTriangle size={24} />
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-red-100 uppercase tracking-tighter">Modo Pós-Impacto Ativo</h3>
                    <p className="text-red-400 text-[10px] font-bold leading-none">SEU PLANO FOI ALTERADO PARA RECUPERAÇÃO</p>
                 </div>
              </div>
           </div>
        </section>
      )}

      {/* Main Content */}
      <main className="px-6 -mt-4 relative z-10 space-y-6">
        
        {/* New User Welcome CTA (F2.5.3) */}
        {data.isNewUser && (
           <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] p-8 text-white shadow-xl shadow-blue-200 text-center space-y-6">
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-2 animate-bounce">
                 <Zap size={40} className="text-white" />
              </div>
              <div>
                 <h2 className="text-3xl font-black">Pronto para a Glória?</h2>
                 <p className="text-blue-100 text-sm font-medium mt-2">Ainda não detectamos seus pontos cegos. Comece agora sua primeira bateria!</p>
              </div>
              <Link href="/dashboard/registrar" className="block">
                 <Button className="w-full bg-white text-blue-700 h-16 rounded-2xl font-black text-lg shadow-lg">
                   Primeira Bateria
                 </Button>
              </Link>
           </section>
        )}

        {/* Cicatrização Alert (If any) */}
        {!data.isNewUser && stats.dueCards > 0 && (
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

        {/* Health Panel (F2.5.1 / F2.5.4) */}
        {!data.isNewUser && (
           <section className="bg-white rounded-[40px] p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Health Panel</h3>
                 <div className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-lg">SISTEMA OK</div>
              </div>
              
              <div className="space-y-4">
                 {/* Only show if we have trusted samples (N>5) */}
                 {stats.hasTrustedData ? (
                   <>
                    <div className="flex items-center justify-between p-2">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                             <Target size={18} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Ponto Cego</p>
                             <h4 className="font-bold text-slate-900 text-sm truncate max-w-[150px]">{stats.criticalTopic}</h4>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Crítico</p>
                          <span className="text-xs font-black text-red-500">AÇÃO IMEDIATA</span>
                       </div>
                    </div>

                    <div className="flex items-center justify-between p-2">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                             <Clock size={18} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Matéria Fraca</p>
                             <h4 className="font-bold text-slate-900 text-sm">{stats.weakSubject}</h4>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Cards</p>
                          <span className="text-xs font-black text-blue-600">{stats.dueCards} Rev.</span>
                       </div>
                    </div>
                   </>
                 ) : (
                    <div className="py-4 text-center">
                       <p className="text-xs text-slate-400 font-semibold px-4 italic leading-tight">
                         Amostragem insuficiente para diagnóstico de saúde. Seus gatilhos de precisão aparecerão após algumas sessões.
                       </p>
                    </div>
                 )}
              </div>
           </section>
        )}

        {/* Fila de Recuperação (F2.3) */}
        {recoveryQueue && recoveryQueue.length > 0 && (
          <section className="space-y-4">
             <div className="flex justify-between items-center px-2">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
                   <RotateCcw size={16} className="text-amber-600" />
                   Fila de Recuperação
                </h3>
                <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-full uppercase">
                   {recoveryQueue.length} {recoveryQueue.length === 1 ? 'Tópico' : 'Tópicos'}
                </span>
             </div>
             
             <div className="space-y-3">
                {recoveryQueue.map((item: any) => (
                  <div key={item.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                     <div className="flex justify-between items-start mb-2">
                        <div>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.subject}</span>
                           <h4 className="font-bold text-slate-900 text-sm truncate max-w-[200px]">{item.canonical_topic}</h4>
                        </div>
                        <div className="p-2 bg-amber-50 rounded-xl group-hover:scale-110 transition-transform">
                           <Zap size={14} className="text-amber-500" />
                        </div>
                     </div>
                     <p className="text-[10px] text-slate-500 font-medium mb-4">
                        {item.reason === 'never_learned' ? '🚨 Base fraca detectada' : '🩹 Acurácia crítica'}
                     </p>
                     <Link href={`/dashboard/recuperacao/${item.id}`} className="block">
                        <Button className="w-full h-10 text-[10px] font-black uppercase text-amber-700 bg-amber-50 hover:bg-amber-100 border-none shadow-none rounded-xl">
                           Iniciar Plano de Ação
                        </Button>
                     </Link>
                  </div>
                ))}
             </div>
          </section>
        )}

        {/* Mission Card (F1.6.1) */}
        <section className="bg-blue-600 rounded-[40px] p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
               <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                 {mission.type}
               </span>
               <Target size={20} className="text-blue-200" />
            </div>

            <h2 className="text-3xl font-black leading-tight mb-2">
              {mission.title}
            </h2>
            <p className="text-blue-100 text-sm font-medium mb-6">
              {mission.description}
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-end mb-1">
                 <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Progresso da Missão</span>
                 <span className="text-lg font-black">{mission.progress}%</span>
              </div>
              <div className="h-3 bg-blue-900/40 rounded-full overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${mission.progress}%` }}
                />
              </div>
              <p className="text-[10px] text-blue-200 italic font-medium pt-2">
                 “{mission.explanation}”
              </p>
            </div>

            <div className="mt-8 flex gap-3">
               <Link href="/dashboard/registrar" className="flex-1">
                  <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 h-14 rounded-2xl font-black shadow-lg">
                    Registrar Treino
                  </Button>
               </Link>
            </div>
          </div>
        </section>

        {/* Activity Feed */}
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
                    <h4 className="font-bold text-slate-900 text-sm">Resumo do Dia</h4>
                    <p className="text-xs text-slate-500 font-medium">{stats.totalQuestions} questões hoje.</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="font-black text-slate-900 leading-none">{stats.accuracy}%</p>
                 <span className="text-[10px] text-green-600 font-bold uppercase">Taxa</span>
              </div>
           </div>
        </section>

      </main>
    </div>
  );
}
