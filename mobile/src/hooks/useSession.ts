import { useState, useCallback } from 'react';
import { useSessionStore } from '../stores/useSessionStore';
import { sessionsApi } from '../services/api';
import type { Session } from '../types';

export const useSession = () => {
  const { sessions, addSession, getRecentSessions, getAccuracyBySubject } = useSessionStore();
  const [isLoading, setIsLoading] = useState(false);

  const createSession = useCallback(async (data: Omit<Session, 'id' | 'createdAt'>) => {
    setIsLoading(true);
    try {
      const session = await sessionsApi.create(data);
      addSession(session);
      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [addSession]);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await sessionsApi.list();
      data.forEach(addSession);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [addSession]);

  return {
    sessions,
    isLoading,
    createSession,
    loadSessions,
    getRecentSessions,
    getAccuracyBySubject,
  };
};