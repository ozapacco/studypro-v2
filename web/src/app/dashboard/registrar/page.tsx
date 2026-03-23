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
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

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
        // Redireciona com um pequeno delay para mostrar sucesso
        setTimeout(() => router.push('/dashboard'), 1000);
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
            {SUBJECTS.slice(0, 4).map((s) => (
              <button
                key={s}
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
          <input 
            type="text" 
            placeholder="Assunto (ex: Inquérito Policial)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full p-5 bg-white border-2 border-white rounded-2xl font-bold shadow-sm focus:border-blue-600 transition-all outline-none"
          />
        </section>

        {/* Questões e Acertos */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center relative overflow-hidden group">
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              <button onClick={() => setQuestions(q => q + 1)} className="p-1 hover:bg-slate-50 rounded"><Plus size={14} /></button>
              <button onClick={() => setQuestions(q => Math.max(1, q - 1))} className="p-1 hover:bg-slate-50 rounded"><Minus size={14} /></button>
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Total</span>
            <input 
              type="number" 
              value={questions}
              onChange={(e) => setQuestions(Number(e.target.value))}
              className="text-4xl font-black text-slate-900 w-full text-center bg-transparent outline-none"
            />
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center relative overflow-hidden group">
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              <button onClick={() => setHits(h => Math.min(questions, h + 1))} className="p-1 hover:bg-slate-50 rounded text-green-600"><Plus size={14} /></button>
              <button onClick={() => setHits(h => Math.max(0, h - 1))} className="p-1 hover:bg-slate-50 rounded"><Minus size={14} /></button>
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Acertos</span>
            <input 
              type="number" 
              value={hits}
              onChange={(e) => setHits(Number(e.target.value))}
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

        {/* Tipo de Erro */}
        <section className="space-y-4">
          <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Qual foi a maior dificuldade?</label>
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
    </div>
  );
}
