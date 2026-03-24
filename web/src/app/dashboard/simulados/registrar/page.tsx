'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Target,
  Search,
  Trophy,
  BarChart3,
  Calendar,
  Layers,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const SUBJECTS_LIST = [
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

export default function RegistrarSimuladoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [platform, setPlatform] = useState('Projeto Caveira');
  const [cutoff, setCutoff] = useState(70);
  
  const [subjects, setSubjects] = useState([
    { name: 'Português', total: 10, hits: 8 },
    { name: 'Direito Penal', total: 10, hits: 5 }
  ]);

  const totalQuestions = subjects.reduce((acc, s) => acc + s.total, 0);
  const totalHits = subjects.reduce((acc, s) => acc + s.hits, 0);
  const totalScore = totalQuestions > 0 ? Math.round((totalHits / totalQuestions) * 100) : 0;
  const diff = totalScore - cutoff;

  const addSubject = () => {
    setSubjects([...subjects, { name: 'Nova Matéria', total: 10, hits: 0 }]);
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const updateSubject = (index: number, field: string, value: any) => {
    const newSubjects = [...subjects];
    (newSubjects[index] as any)[field] = field === 'name' ? value : Number(value);
    setSubjects(newSubjects);
  };

  const handleSubmit = async () => {
    if (!name || subjects.length === 0) {
      alert('Favor preencher o nome e pelo menos uma matéria.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/simulados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          examDate,
          platform,
          cutoff,
          totalScore,
          subjects
        })
      });

      if (res.ok) {
        router.push('/dashboard/saude');
      } else {
        alert('Erro ao registrar simulado.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="bg-white px-6 pt-10 pb-8 rounded-b-[40px] shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Resultado do Simulado</h1>
        <p className="text-slate-500 text-sm font-medium">Diagnóstico de guerra rápida.</p>
      </header>

      <div className="max-w-md mx-auto p-6 space-y-8">
        
        {/* Basic Info */}
        <section className="space-y-4">
          <input 
            type="text" 
            placeholder="Nome (ex: Simulado 01 - PC-SP)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-5 bg-white border-2 border-white rounded-3xl font-bold shadow-sm focus:border-blue-600 transition-all outline-none"
          />
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-3">
                <Calendar size={18} className="text-slate-400" />
                <input 
                  type="date" 
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="bg-transparent font-bold text-xs outline-none w-full"
                />
             </div>
             <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-3">
                <Target size={18} className="text-slate-400" />
                <input 
                  type="number" 
                  placeholder="Corte"
                  value={cutoff}
                  onChange={(e) => setCutoff(Number(e.target.value))}
                  className="bg-transparent font-bold text-xs outline-none w-full"
                />
             </div>
          </div>
        </section>

        {/* Global Summary Card */}
        <section className={cn(
          "rounded-[40px] p-8 text-white relative overflow-hidden shadow-xl transition-all",
          diff >= 0 ? "bg-green-600 shadow-green-200" : "bg-red-600 shadow-red-200"
        )}>
           <div className="flex justify-between items-center mb-6 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Desempenho Geral</span>
              <Trophy size={20} className="opacity-80" />
           </div>
           
           <div className="text-center relative z-10 mb-6">
              <span className="text-6xl font-black">{totalScore}%</span>
              <p className="text-xs font-bold mt-1 opacity-90">
                {diff >= 0 ? `Vencendo o corte por ${diff} pts 🔥` : `Faltaram ${Math.abs(diff)} pts para o corte 🩹`}
              </p>
           </div>
        </section>

        {/* Subjects Breakdown */}
        <section className="space-y-4">
           <div className="flex justify-between items-center px-2">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Desempenho por Matéria</h3>
              <button onClick={addSubject} className="text-blue-600 p-2 bg-blue-50 rounded-xl">
                 <Plus size={18} />
              </button>
           </div>

           <div className="space-y-4">
              {subjects.map((s, idx) => (
                <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                   <div className="flex justify-between items-center">
                      <select 
                        value={s.name}
                        onChange={(e) => updateSubject(idx, 'name', e.target.value)}
                        className="font-black text-slate-800 bg-transparent outline-none text-sm"
                      >
                         {SUBJECTS_LIST.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      <button onClick={() => removeSubject(idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                         <Trash2 size={16} />
                      </button>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Questões</span>
                         <input 
                           type="number" 
                           value={s.total}
                           onChange={(e) => updateSubject(idx, 'total', e.target.value)}
                           className="w-full p-3 bg-slate-50 rounded-2xl font-bold text-center outline-none"
                         />
                      </div>
                      <div className="space-y-1">
                         <span className={cn(
                           "text-[10px] font-black uppercase tracking-tight",
                           (s.hits/s.total) < 0.5 ? "text-red-500" : "text-slate-400"
                         )}>Acertos</span>
                         <input 
                           type="number" 
                           value={s.hits}
                           onChange={(e) => updateSubject(idx, 'hits', e.target.value)}
                           className="w-full p-3 bg-slate-50 rounded-2xl font-bold text-center outline-none"
                         />
                      </div>
                   </div>

                   {/* Progress Visual */}
                   <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-500",
                          (s.hits/s.total) >= 0.75 ? "bg-green-500" : (s.hits/s.total) >= 0.5 ? "bg-blue-500" : "bg-red-500"
                        )}
                        style={{ width: `${(s.hits/s.total) * 100}%` }}
                      />
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Submit Button */}
        <Button 
          className="w-full py-8 h-20 rounded-3xl text-xl font-black shadow-xl shadow-blue-200 active:scale-95 transition-all"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Processando Diagnóstico...' : 'Finalizar Simulado'}
        </Button>
      </div>
    </div>
  );
}
