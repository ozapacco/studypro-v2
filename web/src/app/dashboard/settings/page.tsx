'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, 
  Settings, 
  Target, 
  Clock, 
  Zap, 
  LogOut, 
  FileDown, 
  ShieldCheck,
  BrainCircuit,
  Save,
  CheckCircle2,
  Moon,
  Sun
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Configurando Cockpit...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="bg-white px-6 pt-12 pb-10 rounded-b-[40px] shadow-sm flex justify-between items-center">
        <Link href="/dashboard" className="p-2 bg-slate-100 rounded-xl">
           <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <h1 className="text-xl font-black text-slate-900 uppercase tracking-widest">Ajustes</h1>
        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
           <Settings size={20} />
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-8">
        
        {/* Metas de Estudo (Fase 1 legacy adjustment) */}
        <section className="space-y-4">
           <h3 className="font-black text-slate-900 text-sm tracking-widest uppercase flex items-center gap-2">
              <Target size={16} className="text-blue-600" />
              Metas de Estudo
           </h3>
           <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Acurácia Alvo (%)</label>
                 <input 
                   type="range" min="50" max="95" step="5"
                   value={profile?.target_accuracy || 70}
                   onChange={(e) => setProfile({...profile, target_accuracy: parseInt(e.target.value)})}
                   className="w-full accent-blue-600"
                 />
                 <div className="flex justify-between mt-1">
                    <span className="text-xs font-bold text-slate-900">{profile?.target_accuracy || 70}%</span>
                    <span className="text-[10px] font-bold text-slate-400 italic">Recomendado: 70-80%</span>
                 </div>
              </div>
              
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Tempo Diário (minutos)</label>
                 <div className="flex items-center gap-3">
                    <Clock size={16} className="text-slate-400" />
                    <input 
                      type="number"
                      value={profile?.daily_time_minutes || 180}
                      onChange={(e) => setProfile({...profile, daily_time_minutes: parseInt(e.target.value)})}
                      className="bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-slate-900 w-24"
                    />
                 </div>
              </div>
           </div>
        </section>

        {/* FSRS Avançado (F3.6) */}
        <section className="space-y-4">
           <h3 className="font-black text-slate-900 text-sm tracking-widest uppercase flex items-center gap-2">
              <BrainCircuit size={16} className="text-amber-500" />
              Motor FSRS v2.2
           </h3>
           <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Retenção Desejada</label>
                 <select 
                   value={profile?.fsrs_retention || 0.9}
                   onChange={(e) => setProfile({...profile, fsrs_retention: parseFloat(e.target.value)})}
                   className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-slate-900 border-none"
                 >
                    <option value="0.7">70% (Menos revisões, menor retenção)</option>
                    <option value="0.8">80% (Equilibrado)</option>
                    <option value="0.9">90% (Padrão Otimizado)</option>
                    <option value="0.95">95% (Máxima Retenção, Múltiplas Revisões)</option>
                 </select>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                 <p className="text-[10px] font-bold text-amber-900 leading-tight">
                    <Zap size={12} className="inline mr-1" />
                    A alteração do motor FSRS recalibra todas as datas de vencimento na próxima rodada.
                 </p>
              </div>
           </div>
        </section>

        {/* Modo Dark (F3.5) */}
        <section className="space-y-4">
           <h3 className="font-black text-slate-900 text-sm tracking-widest uppercase flex items-center gap-2">
              {profile?.dark_mode ? <Moon size={16} /> : <Sun size={16} />}
              Visual
           </h3>
           <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                 <p className="font-black text-slate-900 text-sm">Modo Escuro (BETA)</p>
                 <span className="text-[10px] font-bold text-slate-400">Ideal para estudos noturnos.</span>
              </div>
              <button 
                onClick={() => setProfile({...profile, dark_mode: !profile.dark_mode})}
                className={`w-14 h-8 rounded-full transition-all duration-300 relative ${profile?.dark_mode ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                 <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${profile?.dark_mode ? 'left-7' : 'left-1'}`} />
              </button>
           </div>
        </section>
        <section className="space-y-4 pt-4">
           <Button 
            className="w-full justify-between py-6 h-auto bg-slate-900 text-white rounded-2xl font-bold"
            onClick={() => window.print()}
           >
              <span>Exportar PDF de Batalha (F3.2)</span>
              <FileDown size={18} />
           </Button>

           <Button 
            variant="outline" 
            className="w-full justify-between py-6 h-auto border-red-200 text-red-600 hover:bg-red-50 rounded-2xl font-bold"
            onClick={logout}
           >
              <span>Encerrar Operação (Logout)</span>
              <LogOut size={18} />
           </Button>
        </section>

      </main>

      {/* Save Button Floating */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 pointer-events-none">
         <Button 
           disabled={saving}
           onClick={handleSave}
           className={`w-full py-6 h-auto rounded-3xl shadow-2xl flex items-center justify-center gap-3 transition-all pointer-events-auto active:scale-95 font-black text-sm ${saved ? 'bg-green-600' : 'bg-blue-600'}`}
         >
            {saving ? (
               <RefreshCw size={18} className="animate-spin" />
            ) : saved ? (
               <>
                 <CheckCircle2 size={18} />
                 Alterações Salvas
               </>
            ) : (
               <>
                 <Save size={18} />
                 Salvar Ajustes
               </>
            )}
         </Button>
      </div>
    </div>
  );
}

function RefreshCw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}
