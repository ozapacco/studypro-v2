import { db } from '../db';
import type { TopicPerformance } from '../../models';
import type { ErrorType } from '../../types';

const NORMALIZATION_RULES: Record<string, string[]> = {
  'direito constitucional': ['constitucional', 'direito const'],
  'direito administrativo': ['admin', 'adm'],
  'direito penal': ['penal', 'crime'],
  'processo penal': ['processo penal', 'proc penal'],
  'direito civil': ['civil'],
  'direito processual civil': ['processo civil', 'proc civil'],
  'contabilidade': ['contab', 'contabilidade'],
  'matemática financeira': ['mat fin', 'matemática fin'],
  'raciocínio lógico': ['rlm', 'raciocinio logico'],
  'informática': ['info', 'informática', 'ti'],
};

export function normalize(rawTag: string, subject: string): string {
  const normalized = rawTag.toLowerCase().trim();
  
  const existing = db.find<{ normalizedTopic: string }>('topic_normalizations', {
    rawTag: normalized,
    subject,
  });
  
  if (existing) return existing.normalizedTopic;
  
  for (const [topic, keywords] of Object.entries(NORMALIZATION_RULES)) {
    if (keywords.some(k => normalized.includes(k))) {
      saveNormalization(rawTag, subject, topic, 0.9);
      return topic;
    }
  }
  
  const saved = saveNormalization(rawTag, subject, rawTag, 0.5);
  return saved?.normalizedTopic || rawTag;
}

function saveNormalization(rawTag: string, subject: string, normalizedTopic: string, confidence: number) {
  try {
    return db.create('topic_normalizations', {
      rawTag: rawTag.toLowerCase().trim(),
      normalizedTopic,
      subject,
      confidence,
    });
  } catch {
    return db.find<{ normalizedTopic: string }>('topic_normalizations', {
      rawTag: rawTag.toLowerCase().trim(),
      subject,
    });
  }
}

export function updatePerformance(session: {
  subject: string;
  topic: string;
  correctCount: number;
  incorrectCount: number;
  errorTypes: ErrorType[];
}): TopicPerformance {
  const normalizedTopic = normalize(session.topic, session.subject);
  
  let performance = db.find<TopicPerformance>('topic_performance', {
    subject: session.subject,
    topic: normalizedTopic,
  });
  
  const totalQuestions = session.correctCount + session.incorrectCount;
  const correctAnswers = session.correctCount;
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  
  const errorTypesRecord: Record<ErrorType, number> = {
    forgot: 0,
    confused: 0,
    never_learned: 0,
  };
  
  session.errorTypes.forEach(et => {
    errorTypesRecord[et] = (errorTypesRecord[et] || 0) + 1;
  });
  
  if (performance) {
    const newTotal = performance.totalQuestions + totalQuestions;
    const newCorrect = performance.correctAnswers + correctAnswers;
    const newAccuracy = newTotal > 0 ? (newCorrect / newTotal) * 100 : 0;
    
    performance = db.update('topic_performance', performance.id, {
      totalQuestions: newTotal,
      correctAnswers: newCorrect,
      accuracy: newAccuracy,
      errorTypes: errorTypesRecord,
      lastStudied: new Date().toISOString(),
    }) as TopicPerformance;
  } else {
    performance = db.create('topic_performance', {
      subject: session.subject,
      topic: normalizedTopic,
      totalQuestions,
      correctAnswers,
      accuracy,
      errorTypes: errorTypesRecord,
      recurrenceScore: 0,
      lastStudied: new Date().toISOString(),
    }) as unknown as TopicPerformance;
  }
  
  return performance;
}

export function calculateRecurrenceScore(subject: string, topic: string): number {
  const sessions = db.findAll('sessions', { subject, topic });
  
  if (sessions.length === 0) return 0;
  
  const recentSessions = sessions.slice(-5);
  const errors = recentSessions.filter(s => s.incorrectCount > s.correctCount * 0.5);
  
  const frequency = recentSessions.length / 30;
  const errorRate = errors.length / recentSessions.length;
  
  return Math.min(frequency * 0.4 + errorRate * 0.6, 1);
}

export function fuzzySearch(query: string, options: string[]): string[] {
  const normalizedQuery = query.toLowerCase();
  
  const scored = options.map(option => {
    const normalizedOption = option.toLowerCase();
    
    if (normalizedOption.includes(normalizedQuery)) {
      return { option, score: 1 - (normalizedOption.indexOf(normalizedQuery) / normalizedOption.length) };
    }
    
    let score = 0;
    let queryIdx = 0;
    
    for (let i = 0; i < normalizedOption.length && queryIdx < normalizedQuery.length; i++) {
      if (normalizedOption[i] === normalizedQuery[queryIdx]) {
        score += 1 / (i + 1);
        queryIdx++;
      }
    }
    
    if (queryIdx === normalizedQuery.length) {
      score = score / normalizedOption.length;
    } else {
      score = 0;
    }
    
    return { option, score };
  });
  
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.option);
}

export function getSuggestedTopics(subject: string, limit: number = 10): { topic: string; priority: number }[] {
  const topics = db.findAll<{ topic: string; recurrenceScore: number; accuracy: number }>('topic_performance', { subject });
  
  return topics
    .map(t => ({
      topic: t.topic,
      priority: t.recurrenceScore * 0.5 + (100 - t.accuracy) * 0.5,
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

export function getTopicsBySubject(subject: string): TopicPerformance[] {
  return db.findAll<TopicPerformance>('topic_performance', { subject });
}