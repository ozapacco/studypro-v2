'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Settings2, 
  BarChart3, 
  Plus, 
  Trash2, 
  Target, 
  TrendingUp, 
  AlertCircle,
  BrainCircuit,
  Dna,
  Zap,
  BookOpen
} from 'lucide-react';

type Subject = {
  id: string;
  name: string;
  weight: number;
  importance: number;
  target_accuracy: number;
  current_accuracy?: number;
};

type Topic = {
  id: string;
  subject: string;
  canonical: string;
  aliases: string[];
  importance: number;
  general_difficulty: number;
};

export default function PlannerPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'disciplinas' | 'assuntos'>('disciplinas');

  // Input States
  const [newSubject, setNewSubject] = useState({ name: '', weight: 50, importance: 50, target: 70 });
  const [newTopic, setNewTopic] = useState({ subject: '', canonical: '', aliases: '', importance: 50, difficulty: 50 });

  const selectedSubjectTopics = useMemo(
    () => topics.filter((t) => t.subject === (newTopic.subject || (subjects[0]?.name))),
    [topics, newTopic.subject, subjects]
  );

  async function loadData() {
    setLoading(true);
    try {
      const [subjectsRes, topicsRes] = await Promise.all([
        fetch('/api/subjects?detailed=1'),
        fetch('/api/topics')
      ]);
      const subjectsData = await subjectsRes.json();
      const topicsData = await topicsRes.json();

      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      setTopics(Array.isArray(topicsData) ? topicsData : []);
      
      if (!newTopic.subject && Array.isArray(subjectsData) && subjectsData.length > 0) {
        setNewTopic(prev => ({ ...prev, subject: subjectsData[0].name }));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAddSubject() {
    if (!newSubject.name.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'subject',
          name: newSubject.name.trim(),
          weight: newSubject.weight,
          importance: newSubject.importance,
          target_accuracy: newSubject.target
        })
      });
      setNewSubject({ name: '', weight: 50, importance: 50, target: 70 });
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSubject(id: string) {
    if (!confirm('Excluir disciplina e todos os dados associados?')) return;
    setSaving(true);
    try {
      await fetch(`/api/subjects?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTopic() {
    if (!newTopic.subject || !newTopic.canonical.trim()) return;
    setSaving(true);
    try {
      const aliases = newTopic.aliases
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'topic',
          subject: newTopic.subject,
          canonical: newTopic.canonical.trim(),
          aliases,
          importance: newTopic.importance,
          difficulty: newTopic.difficulty
        })
      });

      setNewTopic(prev => ({ ...prev, canonical: '', aliases: '' }));
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
           <p className="text-blue-200 font-bold animate-pulse uppercase tracking-widest text-xs">Sincronizando Estratégia...</p>
        </div>
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

      <div className="max-w-5xl mx-auto px-4 pt-12 relative z-10">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <Link href="/dashboard" className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors">
                  <ChevronLeft size={20} className="text-slate-400" />
               </Link>
               <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  Centro de Inteligência
               </span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Mapa Estratégico</h1>
            <p className="text-slate-400 font-medium">Configure a engine para priorizar onde a aprovação acontece.</p>
          </div>
          
          <div className="flex items-center gap-2 p-1 bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-xl">
             <button 
               onClick={() => setActiveTab('disciplinas')}
               className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'disciplinas' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'}`}
             >
                Disciplinas
             </button>
             <button 
               onClick={() => setActiveTab('assuntos')}
               className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'assuntos' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'}`}
             >
                Assuntos
             </button>
          </div>
        </header>

        {activeTab === 'disciplinas' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-1 space-y-6">
              <section className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-8 backdrop-blur-xl sticky top-8">
                <div className="flex items-center gap-3 mb-8">
                   <div className="p-2 bg-blue-600 rounded-xl">
                      <Plus size={20} className="text-white" />
                   </div>
                   <h2 className="text-xl font-black text-white">Nova Disciplina</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do Pilar</label>
                    <input
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                      placeholder="Ex: Direito Penal"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Peso no Edital ({newSubject.weight}%)</label>
                      <Zap size={14} className="text-amber-500" />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      value={newSubject.weight}
                      onChange={(e) => setNewSubject({ ...newSubject, weight: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Importância da Banca ({newSubject.importance}%)</label>
                      <Target size={14} className="text-red-500" />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                      value={newSubject.importance}
                      onChange={(e) => setNewSubject({ ...newSubject, importance: Number(e.target.value) })}
                    />
                  </div>

                  <Button 
                    className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20"
                    onClick={handleAddSubject}
                    disabled={saving}
                  >
                    Adicionar à Estratégia
                  </Button>
                </div>
              </section>
            </div>

            {/* List Column */}
            <div className="lg:col-span-2">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjects.map((sub) => (
                    <div key={sub.id} className="group bg-slate-900/40 border border-slate-800 rounded-[32px] p-6 hover:border-slate-700 transition-all hover:bg-slate-900/60 relative overflow-hidden">
                       <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                       
                       <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center">
                             <span className="text-blue-500 font-black text-lg">{sub.name[0]}</span>
                          </div>
                          <button 
                            onClick={() => handleDeleteSubject(sub.id)}
                            className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                       </div>

                       <h3 className="text-lg font-black text-white mb-1">{sub.name}</h3>
                       <div className="flex items-center gap-2 mb-6">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Score Atual:</span>
                          <span className={`${(sub.current_accuracy || 0) >= (sub.target_accuracy || 70) ? 'text-green-500' : 'text-amber-500'} font-black text-xs`}>
                             {Math.round(sub.current_accuracy || 0)}%
                          </span>
                       </div>

                       <div className="space-y-4">
                          <div className="flex justify-between text-[9px] font-black uppercase text-slate-600 tracking-tighter">
                             <span>Peso Edital</span>
                             <span className="text-slate-400">{sub.weight}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                             <div className="h-full bg-blue-600 rounded-full" style={{ width: `${sub.weight}%` }} />
                          </div>

                          <div className="flex justify-between text-[9px] font-black uppercase text-slate-600 tracking-tighter">
                             <span>Fator Relevância (Banca)</span>
                             <span className="text-slate-400">{sub.importance}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                             <div className="h-full bg-red-600 rounded-full" style={{ width: `${sub.importance}%` }} />
                          </div>
                       </div>
                    </div>
                  ))}

                  {subjects.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-[40px]">
                       <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-4">
                          <BrainCircuit size={32} className="text-slate-700" />
                       </div>
                       <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Nenhuma disciplina integrada</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Topic Form Column */}
            <div className="lg:col-span-1 space-y-6">
              <section className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-8 backdrop-blur-xl sticky top-8">
                <div className="flex items-center gap-3 mb-8">
                   <div className="p-2 bg-indigo-600 rounded-xl">
                      <Dna size={20} className="text-white" />
                   </div>
                   <h2 className="text-xl font-black text-white">Novo Assunto</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Disciplina Pai</label>
                    <select
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold transition-all outline-none appearance-none"
                      value={newTopic.subject}
                      onChange={(e) => setNewTopic({ ...newTopic, subject: e.target.value })}
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.name} className="bg-slate-900">{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assunto Canônico</label>
                    <input
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                      placeholder="Ex: Legítima Defesa"
                      value={newTopic.canonical}
                      onChange={(e) => setNewTopic({ ...newTopic, canonical: e.target.value })}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Incidência em Prova ({newTopic.importance}%)</label>
                      <TrendingUp size={14} className="text-green-500" />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-green-600"
                      value={newTopic.importance}
                      onChange={(e) => setNewTopic({ ...newTopic, importance: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dificuldade Geral ({newTopic.difficulty}%)</label>
                      <AlertCircle size={14} className="text-amber-500" />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
                      value={newTopic.difficulty}
                      onChange={(e) => setNewTopic({ ...newTopic, difficulty: Number(e.target.value) })}
                    />
                  </div>

                  <Button 
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-900/20"
                    onClick={handleAddTopic}
                    disabled={saving}
                  >
                    Mapear DNA do Erro
                  </Button>
                </div>
              </section>
            </div>

            {/* Topic List Column */}
            <div className="lg:col-span-2 space-y-4">
               <div className="flex items-center justify-between px-4 mb-2">
                  <h3 className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    Assuntos Mapeados: <span className="text-white">{newTopic.subject || subjects[0]?.name}</span>
                  </h3>
               </div>

               <div className="space-y-3">
                  {selectedSubjectTopics.map((topic) => (
                    <div key={topic.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:bg-slate-900/70 transition-all flex items-center justify-between gap-6 group">
                       <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 text-indigo-400 group-hover:scale-110 transition-transform">
                             <BookOpen size={18} />
                          </div>
                          <div>
                             <h4 className="font-bold text-white leading-tight">{topic.canonical}</h4>
                             <div className="flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1 text-[9px] font-black text-green-500 uppercase">
                                   <TrendingUp size={10} /> Incidência: {topic.importance}%
                                </span>
                                <span className="flex items-center gap-1 text-[9px] font-black text-amber-500 uppercase">
                                   <AlertCircle size={10} /> Dificuldade: {topic.general_difficulty}%
                                </span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            className="h-9 px-3 border-slate-800 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded-xl"
                            onClick={async () => {
                               if (!confirm('Excluir assunto?')) return;
                               setSaving(true);
                               try {
                                 await fetch(`/api/topics?id=${encodeURIComponent(topic.id)}`, { method: 'DELETE' });
                                 await loadData();
                               } finally {
                                 setSaving(false);
                               }
                            }}
                          >
                             <Trash2 size={16} />
                          </Button>
                       </div>
                    </div>
                  ))}

                  {selectedSubjectTopics.length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-[40px] bg-slate-950/30">
                       <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-4">
                          <BrainCircuit size={32} className="text-slate-700" />
                       </div>
                       <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Nenhum assunto mapeado nesta disciplina</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
