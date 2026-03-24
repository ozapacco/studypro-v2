'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Target,
  Search,
  Zap,
  RotateCcw,
  Loader2,
  BrainCircuit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const SUBJECTS = [
  'Direito Penal',
  'Processo Penal',
  'Direito Constitucional',
  'Direito Administrativo',
  'Português',
  'Raciocínio Lógico',
  'Informática',
  'Estatística',
  'Contabilidade',
  'Legislação Especial'
];

const PLATFORMS = [
  { id: 'qconcursos', name: 'QConcursos', icon: 'Q' },
  { id: 'tec', name: 'TEC Concursos', icon: 'T' },
  { id: 'other', name: 'Outra / Presencial', icon: 'O' }
];

const ERROR_TYPES = [
  { id: 'forgot', name: 'Esqueci / Não Lembrava', description: 'Revisar FSRS' },
  { id: 'confused', name: 'Confundi / Pegadinha', description: 'Atenção / Detalhe' },
  { id: 'never_learned', name: 'Nunca Estudei', description: 'Ir para Base' }
];

export default function RegistrarSessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState(10);
  const [hits, setHits] = useState(7);
  const [platform, setPlatform] = useState('qconcursos');
  const [errorType, setErrorType] = useState('forgot');
  const [difficulty, setDifficulty] = useState(3);
  
  // Feedback states
  const [showResult, setShowResult] = useState(false);
  const [feedback, setFeedback] = useState<{
    accuracy: number;
    historical: number;
    delta: number;
    status: string;
    recoveryTriggered: boolean;
  } | null>(null);

  // Autocomplete states
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [topicSuggestions, setTopicSuggestions] = useState<{canonical: string, aliases: string[]}[]>([]);
  const [searchingTopics, setSearchingTopics] = useState(false);

  useEffect(() => {
    fetch('/api/subjects')
      .then(res => res.json())
      .then(data => setAvailableSubjects(data));
  }, []);

  useEffect(() => {
    if (subject && topic.length > 2) {
      setSearchingTopics(true);
      const timer = setTimeout(() => {
        fetch(`/api/subjects?subject=${encodeURIComponent(subject)}&q=${encodeURIComponent(topic)}`)
          .then(res => res.json())
          .then(data => {
            setTopicSuggestions(data);
            setSearchingTopics(false);
          });
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setTopicSuggestions([]);
    }
  }, [subject, topic]);

  const accuracy = questions > 0 ? Math.round((hits / questions) * 100) : 0;

  const handleSubmit = async () => {
    if (!subject || !topic) {
      alert('Por favor, preencha a matéria e o tópico.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          questions,
          hits,
          platform,
          errorType,
          difficulty,
          sessionDate: new Date().toISOString()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFeedback({
           ...data.feedback,
           recoveryTriggered: data.recoveryTriggered
        });
        setShowResult(true);
      } else {
        alert('Erro ao registrar sessão.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white px-6 pt-8 pb-6 border-b border-slate-100 sticky top-0 z-10">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">O que você treinou?</h1>
        <p className="text-slate-500 text-sm font-medium">Capture seu desempenho agora.</p>
      </header>

      <div className="max-w-md mx-auto p-6 space-y-8">
        {/* Materia e Tópico */}
        <section className="space-y-4">
          <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Matéria e Assunto</label>
          <div className="grid grid-cols-2 gap-3 overflow-x-auto pb-2 no-scrollbar">
            {(availableSubjects.length > 0 ? availableSubjects : SUBJECTS).slice(0, 6).map((s: string) => (
              <button
                key={s}
                type="button"
                onClick={() => setSubject(s)}
                className={cn(
                  "p-3 rounded-2xl border-2 transition-all font-bold text-xs whitespace-nowrap text-center",
                  subject === s ? "border-blue-600 bg-blue-50 text-blue-700" : "border-white bg-white text-slate-600 shadow-sm"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Assunto (ex: Inquérito Policial)"
              value={topic}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
              className="w-full p-5 bg-white border-2 border-white rounded-2xl font-bold shadow-sm focus:border-blue-600 transition-all outline-none pr-12"
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2">
               {searchingTopics ? (
                 <Loader2 size={18} className="text-blue-600 animate-spin" />
               ) : (
                 <Search size={18} className="text-slate-300" />
               )}
            </div>
            
            {topicSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-20 animate-in fade-in slide-in-from-top-2">
                 {topicSuggestions.map((ts, idx: number) => (
                   <button
                     key={idx}
                     type="button"
                     onClick={() => {
                        setTopic(ts.canonical);
                        setTopicSuggestions([]);
                     }}
                     className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition-colors flex flex-col"
                   >
                     <span className="font-bold text-sm text-slate-900">{ts.canonical}</span>
                     {ts.aliases.length > 0 && (
                       <span className="text-[10px] text-slate-400 font-medium">Aliás: {ts.aliases.join(', ')}</span>
                     )}
                   </button>
                 ))}
              </div>
            )}
          </div>
        </section>

        {/* Questões e Acertos */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center relative overflow-hidden group">
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              <button type="button" onClick={() => setQuestions((q: number) => q + 1)} className="p-1 hover:bg-slate-50 rounded"><Plus size={14} /></button>
              <button type="button" onClick={() => setQuestions((q: number) => Math.max(1, q - 1))} className="p-1 hover:bg-slate-50 rounded"><Minus size={14} /></button>
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Total</span>
            <input 
              type="number" 
              value={questions}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuestions(Number(e.target.value))}
              className="text-4xl font-black text-slate-900 w-full text-center bg-transparent outline-none"
            />
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center relative overflow-hidden group">
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              <button type="button" onClick={() => setHits((h: number) => Math.min(questions, h + 1))} className="p-1 hover:bg-slate-50 rounded text-green-600"><Plus size={14} /></button>
              <button type="button" onClick={() => setHits((h: number) => Math.max(0, h - 1))} className="p-1 hover:bg-slate-50 rounded"><Minus size={14} /></button>
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Acertos</span>
            <input 
              type="number" 
              value={hits}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHits(Number(e.target.value))}
              className="text-4xl font-black text-green-600 w-full text-center bg-transparent outline-none"
            />
          </div>
        </section>

        {/* Desempenho Visual */}
        <section className="bg-blue-600 rounded-3xl p-6 text-white flex items-center justify-between shadow-lg shadow-blue-200">
          <div>
            <span className="text-blue-100 text-[10px] font-black uppercase tracking-widest">Taxa de Acerto</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black">{accuracy}%</span>
              <TrendingUp size={20} className="text-blue-200" />
            </div>
          </div>
          <div className="h-12 w-0.5 bg-blue-500/50" />
          <div className="text-right">
            <span className="text-blue-100 text-[10px] font-black uppercase tracking-widest">Status</span>
            <p className="font-bold text-sm">
              {accuracy >= 80 ? 'Excelente! 🔥' : accuracy >= 70 ? 'Na Meta 🎯' : 'Abaixo da Meta 🩹'}
            </p>
          </div>
        </section>

        {/* Plataforma */}
        <section className="space-y-4">
          <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Onde treinou?</label>
          <div className="grid grid-cols-3 gap-3">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all transition-all",
                  platform === p.id ? "border-blue-600 bg-white text-blue-700 shadow-md" : "border-white bg-white/50 text-slate-400"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-black",
                  platform === p.id ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"
                )}>
                  {p.icon}
                </div>
                <span className="text-[10px] font-bold uppercase">{p.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Dificuldade Percebida (Adicionado) */}
        <section className="space-y-4">
          <div className="flex justify-between items-center ml-1">
             <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Esforço Mental (Dificuldade)</label>
             <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{difficulty}/5</span>
          </div>
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
             <div className="flex-1 space-y-1">
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  step="1"
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[8px] font-black text-slate-300 uppercase tracking-tighter">
                   <span>Fácil</span>
                   <span>Moderado</span>
                   <span>Extremo</span>
                </div>
             </div>
             <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
                <BrainCircuit size={18} className="text-blue-500" />
             </div>
          </div>
        </section>

        {/* Tipo de Erro */}
        <section className="space-y-4">
          <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Qual foi a maior barreira?</label>
          <div className="space-y-3">
            {ERROR_TYPES.map((et) => (
              <button
                key={et.id}
                onClick={() => setErrorType(et.id)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left",
                  errorType === et.id ? "border-blue-600 bg-white text-slate-900 shadow-sm" : "border-white bg-white/50 text-slate-400"
                )}
              >
                <div>
                  <h4 className="font-black text-sm">{et.name}</h4>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">{et.description}</p>
                </div>
                {errorType === et.id && <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center"><CheckCircle2 size={12} className="text-white" /></div>}
              </button>
            ))}
          </div>
        </section>

        {/* Submit */}
        <Button 
          className="w-full py-10 h-20 rounded-3xl text-xl font-black shadow-xl shadow-blue-200 relative overflow-hidden group active:scale-95 transition-all"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
             <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin" />
                Cicatrizando Erros...
             </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Target size={24} />
              Registrar e Finalizar
            </div>
          )}
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </Button>
      </div>

      {/* SUCCESS SCREEN OVERLAY */}
      {showResult && feedback && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
           <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-10">
              
              {/* Status Header */}
              <div className="text-center space-y-2">
                 <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-200 animate-bounce">
                    <CheckCircle2 size={32} />
                 </div>
                 <h2 className="text-3xl font-black text-slate-900 leading-tight pt-4">Sessão Consolidada</h2>
                 <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Diagnóstico Completo da Operação</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 w-full gap-4">
                 
                 {/* Main Accuracy */}
                 <div className="bg-slate-50 border border-slate-100 p-8 rounded-[40px] text-center relative overflow-hidden group">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Performance Operacional</span>
                     <div className="flex items-center justify-center gap-3">
                        <span className="text-6xl font-black text-slate-900">{feedback.accuracy}%</span>
                        <div className="flex flex-col items-start leading-none mt-2">
                           {feedback.delta >= 0 ? (
                             <>
                               <span className="text-green-600 font-black text-lg">+{feedback.delta}%</span>
                               <span className="text-[10px] text-green-600 font-bold uppercase">Melhoria</span>
                             </>
                           ) : (
                             <>
                               <span className="text-red-600 font-black text-lg">{feedback.delta}%</span>
                               <span className="text-[10px] text-red-600 font-bold uppercase">Abaixo</span>
                             </>
                           )}
                        </div>
                     </div>
                     <p className="mt-4 font-bold text-slate-500">Média histórica: {feedback.historical}%</p>
                 </div>

                 {/* Actions Map */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-3 p-5 rounded-3xl bg-blue-50 border border-blue-100">
                       <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200">
                          <Zap size={20} className="fill-white" />
                       </div>
                       <div>
                          <h4 className="font-black text-blue-900 text-sm">Cicatrizando Erros...</h4>
                          <p className="text-[10px] text-blue-600 font-bold uppercase">{questions - hits} novos cards no radar FSRS</p>
                       </div>
                    </div>

                    {feedback.recoveryTriggered && (
                       <div className="flex items-center gap-3 p-5 rounded-3xl bg-amber-50 border border-amber-100 animate-pulse">
                          <div className="w-10 h-10 bg-amber-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-200">
                             <RotateCcw size={20} />
                          </div>
                          <div>
                             <h4 className="font-black text-amber-900 text-sm">Fila de Recuperação Ativada</h4>
                             <p className="text-[10px] text-amber-600 font-bold uppercase">Tópico adicionado ao backlog intensivo</p>
                          </div>
                       </div>
                    )}
                 </div>
              </div>

              {/* Action Button */}
              <Button 
                onClick={() => router.push('/dashboard')}
                className="w-full py-8 h-12 rounded-3xl font-black text-lg bg-slate-900 hover:bg-black shadow-xl shadow-slate-200"
              >
                Continuar Operação
                <ChevronRight size={20} className="ml-1" />
              </Button>
           </div>
        </div>
      )}
    </div>
  );
}
