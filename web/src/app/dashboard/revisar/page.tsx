'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ExternalLink, RefreshCw, Layers, Check, X, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Card {
  id: string;
  front: string;
  back: string;
  subject: string;
  canonical_topic: string;
  error_context?: string;
}

export default function RevisarPage() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reviews/pending');
      const data = await res.json();
      setCards(data.cards || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (rating: number) => {
    if (cards.length === 0) return;
    setProcessing(true);
    const currentCard = cards[0];

    try {
      await fetch('/api/reviews/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: currentCard.id, rating })
      });

      // Remove the reviewed card
      setCards(prev => prev.slice(1));
      setShowAnswer(false);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-slate-400">Carregando Recuperação...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <Check size={48} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Zero Pendências</h2>
        <p className="text-slate-500 text-center max-w-sm mb-8 font-medium">
          Você não tem nenhum gap mapeado para revisão agora. Seu radar está limpo.
        </p>
        <Link href="/dashboard">
          <Button className="py-6 px-10 rounded-2xl font-bold shadow-xl shadow-slate-200">
            Voltar ao Cockpit
          </Button>
        </Link>
      </div>
    );
  }

  const card = cards[0];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-md px-6 pt-12 pb-6 flex justify-between items-center text-white">
        <Link href="/dashboard" className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
          <ArrowLeft size={20} />
        </Link>
        <div className="text-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Cicatrizador de Gaps</span>
          <p className="text-sm font-bold bg-white/10 px-3 py-1 rounded-full">{cards.length} Pendentes</p>
        </div>
        <div className="w-10 h-10 flex items-center justify-center bg-amber-500/20 text-amber-500 rounded-xl">
          <Layers size={20} />
        </div>
      </header>

      {/* Main Card Area */}
      <main className="w-full max-w-md px-6 flex-1 flex flex-col justify-center pb-32">
        <div className="relative w-full aspect-[3/4] perspective-1000">
          <div className={`w-full h-full transition-transform duration-700 preserve-3d relative ${showAnswer ? 'rotate-y-180' : ''}`}>
            
            {/* Front of Card */}
            <div className={`absolute inset-0 backface-hidden bg-white rounded-[40px] shadow-2xl p-8 flex flex-col border border-slate-100 ${showAnswer ? 'hidden' : ''}`}>
              <div className="flex justify-between items-start mb-auto">
                <div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1 block">Contexto</span>
                   <h3 className="text-lg font-black text-slate-900 leading-tight">{card.subject}</h3>
                   <p className="text-slate-500 text-xs font-bold mt-1 max-w-[80%]">{card.canonical_topic}</p>
                </div>
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                   <RotateCcw size={20} />
                </div>
              </div>
              
              <div className="text-center my-auto">
                <p className="text-2xl font-black text-slate-800 leading-snug">
                   {card.front}
                </p>
              </div>

              <div className="mt-auto">
                <Button 
                  className="w-full py-8 h-16 rounded-2xl text-lg font-black bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/30"
                  onClick={() => setShowAnswer(true)}
                >
                  Revelar
                </Button>
              </div>
            </div>

            {/* Back of Card */}
            <div className={`absolute inset-0 bg-slate-50 rounded-[40px] shadow-2xl p-8 flex flex-col border border-slate-200 ${!showAnswer ? 'hidden' : ''}`}>
              <div className="text-center mb-6">
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">Resolução</span>
              </div>
              
              <div className="my-auto overflow-y-auto pr-2 custom-scrollbar">
                 <p className="text-xl font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {card.back}
                 </p>
                 {card.error_context && (
                    <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                       <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block mb-1">Causa da Falha</span>
                       <p className="text-xs font-bold text-amber-800 italic leading-snug">{card.error_context}</p>
                    </div>
                 )}
              </div>

              <div className="mt-auto pt-6 grid grid-cols-2 gap-3">
                 <Button 
                   onClick={() => handleReview(1)} 
                   disabled={processing}
                   className="flex flex-col items-center justify-center py-6 h-auto bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 rounded-2xl"
                 >
                    <span className="font-black text-lg">Errei</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">&lt; 10 min</span>
                 </Button>
                 <Button 
                   onClick={() => handleReview(2)} 
                   disabled={processing}
                   className="flex flex-col items-center justify-center py-6 h-auto bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200 rounded-2xl"
                 >
                    <span className="font-black text-lg">Difícil</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">12h</span>
                 </Button>
                 <Button 
                   onClick={() => handleReview(3)} 
                   disabled={processing}
                   className="flex flex-col items-center justify-center py-6 h-auto bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 rounded-2xl"
                 >
                    <span className="font-black text-lg">Bom</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">1 - 3 dias</span>
                 </Button>
                 <Button 
                   onClick={() => handleReview(4)} 
                   disabled={processing}
                   className="flex flex-col items-center justify-center py-6 h-auto bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 rounded-2xl"
                 >
                    <span className="font-black text-lg">Fácil</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">5+ dias</span>
                 </Button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
