import axios from 'axios';
import type { Session, Card, Mission, StatsOverview, HealthMetrics } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
});

export const dashboardApi = {
  get: async (): Promise<{ mission: Mission; health: HealthMetrics; backlog: Mission[] }> => {
    const response = await api.get('/dashboard');
    return response.data;
  },
};

export const sessionsApi = {
  create: async (data: Omit<Session, 'id' | 'createdAt'>): Promise<Session> => {
    const response = await api.post('/sessions', data);
    return response.data;
  },
  list: async (): Promise<Session[]> => {
    const response = await api.get('/sessions');
    return response.data;
  },
};

export const reviewsApi = {
  getDue: async (): Promise<Card[]> => {
    const response = await api.get('/reviews/due');
    return response.data;
  },
  submit: async (id: string, rating: string): Promise<Card> => {
    const response = await api.post(`/reviews/${id}`, { rating });
    return response.data;
  },
};

export const statsApi = {
  getOverview: async (): Promise<StatsOverview> => {
    const response = await api.get('/stats/overview');
    return response.data;
  },
};

export default api;