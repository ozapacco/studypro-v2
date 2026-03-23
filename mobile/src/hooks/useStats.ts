import { useState, useEffect } from 'react';
import { statsApi } from '../services/api';
import type { StatsOverview } from '../types';

export const useStats = () => {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await statsApi.getOverview();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    refresh: fetchStats,
  };
};