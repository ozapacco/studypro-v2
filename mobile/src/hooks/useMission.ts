import { useEffect } from 'react';
import { useMissionStore } from '../stores/useMissionStore';

export const useMission = () => {
  const { currentMission, backlog, isLoading, fetchMission, completeMission } = useMissionStore();

  useEffect(() => {
    fetchMission();
  }, []);

  return {
    currentMission,
    backlog,
    isLoading,
    refresh: fetchMission,
    complete: completeMission,
  };
};