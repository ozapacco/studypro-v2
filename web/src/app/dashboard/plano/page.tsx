'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

type Subject = {
  id: string;
  name: string;
  weight: number;
  target_accuracy: number;
  current_accuracy?: number;
};

type Topic = {
  id: string;
  subject: string;
  canonical: string;
  aliases: string[];
};

export default function PlannerPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectWeight, setNewSubjectWeight] = useState(20);
  const [newSubjectTarget, setNewSubjectTarget] = useState(70);

  const [topicSubject, setTopicSubject] = useState('');
  const [topicCanonical, setTopicCanonical] = useState('');
  const [topicAliases, setTopicAliases] = useState('');

  const selectedSubjectTopics = useMemo(
    () => topics.filter((t) => t.subject === topicSubject),
    [topics, topicSubject]
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
      if (!topicSubject && Array.isArray(subjectsData) && subjectsData.length > 0) {
        setTopicSubject(subjectsData[0].name);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAddSubject() {
    if (!newSubjectName.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'subject',
          name: newSubjectName.trim(),
          weight: newSubjectWeight,
          target_accuracy: newSubjectTarget
        })
      });
      setNewSubjectName('');
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSubject(id: string) {
    setSaving(true);
    try {
      await fetch(`/api/subjects?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTopic() {
    if (!topicSubject || !topicCanonical.trim()) return;
    setSaving(true);
    try {
      const aliases = topicAliases
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'topic',
          subject: topicSubject,
          canonical: topicCanonical.trim(),
          aliases
        })
      });

      setTopicCanonical('');
      setTopicAliases('');
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTopic(id: string) {
    setSaving(true);
    try {
      await fetch(`/api/topics?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6">Carregando plano...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">Plano de Estudos (Disciplinas e Assuntos)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cadastro funcional orientado ao spec: disciplinas com peso/meta e assuntos canônicos por disciplina.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Cadastrar Disciplina</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              className="border border-slate-300 rounded-xl px-3 py-2 md:col-span-2"
              placeholder="Nome da disciplina"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
            />
            <input
              className="border border-slate-300 rounded-xl px-3 py-2"
              type="number"
              min={0}
              max={100}
              placeholder="Peso"
              value={newSubjectWeight}
              onChange={(e) => setNewSubjectWeight(Number(e.target.value))}
            />
            <input
              className="border border-slate-300 rounded-xl px-3 py-2"
              type="number"
              min={40}
              max={95}
              placeholder="Meta (%)"
              value={newSubjectTarget}
              onChange={(e) => setNewSubjectTarget(Number(e.target.value))}
            />
          </div>
          <Button onClick={handleAddSubject} disabled={saving}>
            Adicionar disciplina
          </Button>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Disciplinas Cadastradas</h2>
          {subjects.length === 0 && <p className="text-sm text-slate-500">Nenhuma disciplina cadastrada.</p>}
          <div className="space-y-2">
            {subjects.map((s) => (
              <div key={s.id} className="flex items-center justify-between border border-slate-200 rounded-xl p-3">
                <div>
                  <p className="font-medium text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500">
                    Peso: {s.weight}% | Meta: {s.target_accuracy}% | Atual: {Math.round(Number(s.current_accuracy || 0))}%
                  </p>
                </div>
                <Button variant="outline" onClick={() => handleDeleteSubject(s.id)} disabled={saving}>
                  Remover
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Cadastrar Assunto Canônico</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              className="border border-slate-300 rounded-xl px-3 py-2"
              value={topicSubject}
              onChange={(e) => setTopicSubject(e.target.value)}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              className="border border-slate-300 rounded-xl px-3 py-2"
              placeholder="Assunto canônico"
              value={topicCanonical}
              onChange={(e) => setTopicCanonical(e.target.value)}
            />
            <input
              className="border border-slate-300 rounded-xl px-3 py-2"
              placeholder="Aliases (separados por vírgula)"
              value={topicAliases}
              onChange={(e) => setTopicAliases(e.target.value)}
            />
          </div>
          <Button onClick={handleAddTopic} disabled={saving || !topicSubject}>
            Adicionar assunto
          </Button>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Assuntos da Disciplina: <span className="text-blue-700">{topicSubject || '-'}</span>
          </h2>
          {selectedSubjectTopics.length === 0 && <p className="text-sm text-slate-500">Nenhum assunto cadastrado.</p>}
          <div className="space-y-2">
            {selectedSubjectTopics.map((t) => (
              <div key={t.id} className="border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{t.canonical}</p>
                  <p className="text-xs text-slate-500">{(t.aliases || []).join(', ') || 'Sem aliases'}</p>
                </div>
                <Button variant="outline" onClick={() => handleDeleteTopic(t.id)} disabled={saving}>
                  Remover
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard" className="inline-block">
            <Button variant="outline">Voltar ao Dashboard</Button>
          </Link>
          <Link href="/dashboard/registrar" className="inline-block">
            <Button>Ir para Registrar Sessão</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
