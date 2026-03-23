import { create } from 'zustand';
import type { Mission } from '../types';
import { dashboardApi } from '../services/api';

interface MissionState {
  currentMission: Mission | null;
  backlog: Mission[];
  isLoading: boolean;
  fetchMission: () => Promise<void>;
  completeMission: () => void;
}

export const useMissionStore = create<MissionState>((set) => ({
  currentMission: null,
  backlog: [],
  isLoading: false,
  
  fetchMission: async () => {
    set({ isLoading: true });
    try {
      const data = await dashboardApi.get();
      set({
        currentMission: data.mission,
        backlog: data.backlog,
      });
    } catch (error) {
      console.error('Failed to fetch mission:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  completeMission: () => {
    set((state) => ({
      currentMission: state.backlog[0] || null,
      backlog: state.backlog.slice(1),
    }));
  },
}));