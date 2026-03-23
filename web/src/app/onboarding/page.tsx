'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Trophy, 
  Calendar, 
  Clock, 
  Target, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Search,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const STEPS = [
  { id: 1, name: 'Concurso', icon: Target },
  { id: 2, name: 'Data', icon: Calendar },
  { id: 3, name: 'Meta', icon: Clock },
  { id: 4, name: 'Missão', icon: Zap },
  { id: 5, name: 'Registro', icon: CheckCircle2 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availableExams, setAvailableExams] = useState<string[]>([]);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [onboardingId, setOnboardingId] = useState<string | null>(null);
  const [examDate, setExamDate] = useState<string>('');
  const [dailyTime, setDailyTime] = useState<number>(180);
  const [firstSessionData, setFirstSessionData] = useState({
    subject: 'Direito Penal',
    questions: 10,
    hits: 7
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resExams = await fetch('/api/onboarding/exams');
        const dataExams = await resExams.json();
        setAvailableExams(dataExams.exams || []);

        const resStart = await fetch('/api/onboarding/start', { method: 'POST' });
        const dataStart = await resStart.json();
        setOnboardingId(dataStart.id);
      } catch (err) {
        console.error('Falha ao inicializar onboarding', err);
      }
    };
    fetchData();
  }, []);

  const handleNext = () => {
    if (step === 1 && selectedExams.length === 0) return;
    if (step === 2 && !examDate) return;
    if (step < 5) {
      setStep(step + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exams: selectedExams,
          examDate: examDate,
          dailyTime: dailyTime,
          firstSession: firstSessionData
        })
      });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 md:p-12">
      {/* Step Tracker */}
      <div className="w-full max-w-lg flex justify-between mb-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
        {STEPS.map((s) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isDone = step > s.id;

          return (
            <div key={s.id} className="relative z-10 flex flex-col items-center">
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
                  isActive ? "bg-blue-600 text-white ring-4 ring-blue-100 scale-110" : 
                  isDone ? "bg-green-500 text-white" : "bg-white text-slate-400 border border-slate-200"
                )}
              >
                {isDone ? <CheckCircle2 size={20} /> : <Icon size={18} />}
              </div>
              <span className={cn(
                "text-[10px] mt-2 font-bold uppercase tracking-tighter",
                isActive ? "text-blue-600" : "text-slate-400"
              )}>
                {s.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[400px] flex flex-col">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Qual seu foco?</h2>
            <p className="text-slate-500 mb-6 font-medium">Selecione os concursos que você pretende prestar.</p>
            <div className="grid grid-cols-1 gap-3">
              {availableExams.map((exam) => (
                <button
                  key={exam}
                  onClick={() => {
                    setSelectedExams(prev => 
                      prev.includes(exam) ? prev.filter(e => e !== exam) : [...prev, exam]
                    );
                  }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left",
                    selectedExams.includes(exam) 
                      ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm" 
                      : "border-slate-100 hover:border-slate-300 text-slate-600"
                  )}
                >
                  <span className="font-bold">{exam}</span>
                  {selectedExams.includes(exam) && <CheckCircle2 size={20} className="text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar size={40} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Quando é a prova?</h2>
            <p className="text-slate-500 mb-8 font-medium">Usamos isso para calcular suas fases de estudo.</p>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-bold text-lg text-center"
            />
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Tempo de Voo</h2>
            <p className="text-slate-500 mb-8 font-medium">Quanto tempo (min) você pode dedicar por dia?</p>
            
            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 mb-6 text-center">
              <span className="text-5xl font-black text-blue-600">{dailyTime}</span>
              <span className="text-slate-400 font-bold ml-2">min</span>
            </div>

            <input
              type="range"
              min="30"
              max="480"
              step="30"
              value={dailyTime}
              onChange={(e) => setDailyTime(Number(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-8"
            />
            
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
              <span>30 Min</span>
              <span>8 Horas</span>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Target size={32} className="text-amber-600" />
             </div>
             <h2 className="text-2xl font-black text-slate-900 mb-2">Primeira Missão</h2>
             <p className="text-slate-500 mb-8 font-medium">Geramos uma meta inicial baseada no seu concurso.</p>
             
             <div className="w-full p-6 bg-amber-50 rounded-3xl border-2 border-amber-200 text-left relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-200/30 rounded-full blur-2xl" />
                <span className="text-[10px] font-black text-amber-600 uppercase mb-2 block tracking-widest">Missão do Dia</span>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Direito Penal</h3>
                <p className="text-slate-600 text-sm">Resolver 20 questões de **Tipicidade** (Cicatrizar Gap Inicial).</p>
             </div>
          </div>
        )}

        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Como foi o treino?</h2>
            <p className="text-slate-500 mb-8 font-medium">Registre seu primeiro desempenho para calibrar o motor.</p>
            
            <div className="space-y-4">
               <div>
                  <label className="text-xs font-black uppercase text-slate-400 ml-1 mb-2 block tracking-widest">Questões Resolvidas</label>
                  <input 
                    type="number" 
                    value={firstSessionData.questions}
                    onChange={(e) => setFirstSessionData({...firstSessionData, questions: Number(e.target.value)})}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-blue-600 transition-all outline-none"
                  />
               </div>
               <div>
                  <label className="text-xs font-black uppercase text-slate-400 ml-1 mb-2 block tracking-widest">Acertos</label>
                  <input 
                    type="number" 
                    value={firstSessionData.hits}
                    onChange={(e) => setFirstSessionData({...firstSessionData, hits: Number(e.target.value)})}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-blue-600 transition-all outline-none text-green-600"
                  />
               </div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-auto pt-8 flex gap-3">
          {step > 1 && step < 4 && (
            <Button 
              variant="outline" 
              className="flex-1 py-8 h-14 rounded-2xl border-2"
              onClick={() => setStep(step - 1)}
            >
              <ChevronLeft size={20} className="mr-2" />
              Voltar
            </Button>
          )}
          <Button 
            className="flex-1 py-8 h-14 rounded-2xl text-lg font-black shadow-lg shadow-blue-200"
            onClick={handleNext}
            disabled={loading}
          >
            {loading ? 'Preparando Cockpit...' : step === 5 ? 'Iniciar Jornada' : 'Continuar'}
            {!loading && <ChevronRight size={20} className="ml-2" />}
          </Button>
        </div>
      </div>
      
      <p className="text-slate-400 text-[10px] mt-8 font-bold uppercase tracking-widest">
        StudyPro v2.1 — Adaptive Intelligence
      </p>
    </div>
  );
}
