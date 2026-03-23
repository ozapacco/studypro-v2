import type { Request, Response } from 'express';
import { db } from '../../lib/db';
import type { QuestionSession, Card, TopicPerformance } from '../../models';

export async function getOverview(req: Request, res: Response): Promise<void> {
  try {
    const sessions = db.findAll<QuestionSession>('sessions');
    const cards = db.findAll<Card>('cards');
    const subjects = db.findAll<{ name: string; questionCount: number }>('subjects');
    
    const totalSessions = sessions.length;
    const totalQuestions = sessions.reduce((acc, s) => acc + s.correctCount + s.incorrectCount, 0);
    const totalCorrect = sessions.reduce((acc, s) => acc + s.correctCount, 0);
    const totalIncorrect = sessions.reduce((acc, s) => acc + s.incorrectCount, 0);
    const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    
    const cardStats = {
      total: cards.length,
      new: cards.filter(c => c.state === 'new').length,
      learning: cards.filter(c => c.state === 'learning').length,
      review: cards.filter(c => c.state === 'review').length,
      relearning: cards.filter(c => c.state === 'relearning').length,
    };
    
    const recentSessions = sessions
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, 7);
    
    const dailyStats = recentSessions.map(s => ({
      date: s.startedAt.split('T')[0],
      questions: s.correctCount + s.incorrectCount,
      accuracy: s.correctCount + s.incorrectCount > 0
        ? (s.correctCount / (s.correctCount + s.incorrectCount)) * 100
        : 0,
    }));
    
    res.json({
      overview: {
        totalSessions,
        totalQuestions,
        totalCorrect,
        totalIncorrect,
        overallAccuracy: Math.round(overallAccuracy * 10) / 10,
        totalSubjects: subjects.length,
      },
      cards: cardStats,
      dailyStats,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get overview stats' });
  }
}

export async function getEvolution(req: Request, res: Response): Promise<void> {
  try {
    const { subject } = req.params;
    
    const topics = db.findAll<TopicPerformance>('topic_performance', { subject });
    
    const evolution = topics.map(t => ({
      topic: t.topic,
      totalQuestions: t.totalQuestions,
      accuracy: Math.round(t.accuracy * 10) / 10,
      recurrenceScore: Math.round(t.recurrenceScore * 100) / 100,
      lastStudied: t.lastStudied,
    }));
    
    const sessions = db.findAll<QuestionSession>('sessions', { subject });
    
    const timeline = sessions
      .map(s => ({
        date: s.startedAt.split('T')[0],
        questions: s.correctCount + s.incorrectCount,
        accuracy: s.correctCount + s.incorrectCount > 0
          ? Math.round((s.correctCount / (s.correctCount + s.incorrectCount)) * 100)
          : 0,
      }))
      .reduce((acc, curr) => {
        const existing = acc.find(a => a.date === curr.date);
        if (existing) {
          existing.questions += curr.questions;
          existing.accuracy = (existing.accuracy + curr.accuracy) / 2;
        } else {
          acc.push(curr);
        }
        return acc;
      }, [] as { date: string; questions: number; accuracy: number }[])
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
    
    res.json({
      subject,
      topics: evolution.sort((a, b) => b.totalQuestions - a.totalQuestions),
      timeline,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get evolution stats' });
  }
}

export async function getHeatmap(req: Request, res: Response): Promise<void> {
  try {
    const sessions = db.findAll<QuestionSession>('sessions');
    const cards = db.findAll<Card>('cards');
    
    const heatmapData: Record<string, number> = {};
    
    sessions.forEach(s => {
      const date = s.startedAt.split('T')[0];
      const questions = s.correctCount + s.incorrectCount;
      heatmapData[date] = (heatmapData[date] || 0) + questions;
    });
    
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hourDistribution: Record<string, number> = {};
    
    sessions.forEach(s => {
      const hour = new Date(s.startedAt).getHours();
      hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
    });
    
    const weeklyPattern = daysOfWeek.map(day => {
      const daySessions = sessions.filter(s => {
        const sessionDay = daysOfWeek[new Date(s.startedAt).getDay()];
        return sessionDay === day;
      });
      return {
        day,
        sessions: daySessions.length,
        questions: daySessions.reduce((acc, s) => acc + s.correctCount + s.incorrectCount, 0),
      };
    });
    
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const dailyActivity = [];
    for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyActivity.push({
        date: dateStr,
        questions: heatmapData[dateStr] || 0,
      });
    }
    
    res.json({
      dailyActivity,
      weeklyPattern,
      hourDistribution,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get heatmap' });
  }
}

export async function getSubjectStats(req: Request, res: Response): Promise<void> {
  try {
    const subjects = db.findAll<{ name: string; questionCount: number; accuracy: number }>('subjects');
    
    const subjectStats = subjects.map(s => {
      const sessions = db.findAll<QuestionSession>('sessions', { subject: s.name });
      const cards = db.findAll<Card>('cards', { subject: s.name });
      const topics = db.findAll<TopicPerformance>('topic_performance', { subject: s.name });
      
      return {
        name: s.name,
        totalQuestions: sessions.reduce((acc, sess) => acc + sess.correctCount + sess.incorrectCount, 0),
        totalSessions: sessions.length,
        totalCards: cards.length,
        totalTopics: topics.length,
        accuracy: Math.round(s.accuracy * 10) / 10,
      };
    });
    
    res.json({ subjects: subjectStats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get subject stats' });
  }
}