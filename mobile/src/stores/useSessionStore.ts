import { create } from 'zustand';
import type { Session } from '../types';

interface SessionState {
  sessions: Session[];
  addSession: (session: Session) => void;
  getRecentSessions: (days: number) => Session[];
  getAccuracyBySubject: (subject: string) => number;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  
  addSession: (session) => {
    set((state) => ({
      sessions: [...state.sessions, session],
    }));
  },
  
  getRecentSessions: (days) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return get().sessions.filter((s) => new Date(s.createdAt) >= cutoff);
  },
  
  getAccuracyBySubject: (subject) => {
    const subjectSessions = get().sessions.filter((s) => s.subject === subject);
    if (subjectSessions.length === 0) return 0;
    const totalQuestions = subjectSessions.reduce((sum, s) => sum + s.questionsTotal, 0);
    const correctQuestions = subjectSessions.reduce((sum, s) => sum + s.questionsCorrect, 0);
    return totalQuestions > 0 ? (correctQuestions / totalQuestions) * 100 : 0;
  },
}));