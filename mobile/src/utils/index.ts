export const formatAccuracy = (value: number): string => {
  return `${Math.round(value)}%`;
};

export const getAccuracyColor = (value: number): string => {
  if (value >= 80) return '#10B981';
  if (value >= 60) return '#F59E0B';
  return '#EF4444';
};

export const calculateMissionReason = (mission: { type: string; accuracy?: number; daysSinceReview?: number }): string => {
  switch (mission.type) {
    case 'review':
      return 'Revisão programada espaçada';
    case 'practice':
      return 'Prática needed to maintain';
    case 'weak_topic':
      return `Baixo desempenho (${mission.accuracy}% accuracy)`;
    case 'recovery':
      return `${mission.daysSinceReview} dias sem revisão`;
    default:
      return 'Missão do dia';
  }
};

export const getPhaseColor = (phase: number): string => {
  switch (phase) {
    case 1:
      return '#3B82F6';
    case 2:
      return '#8B5CF6';
    case 3:
      return '#EC4899';
    case 4:
      return '#F59E0B';
    case 5:
      return '#10B981';
    default:
      return '#6B7280';
  }
};

export const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

export const getPlatformIcon = (platform: string): string => {
  const icons: Record<string, string> = {
    questoes: '📝',
    tec: '🎯',
    approva: '✅',
    gran: '🏆',
    simulado: '📊',
    estrategia: '🎓',
    other: '📚',
  };
  return icons[platform] || '📚';
};

export const getMissionTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    review: '🔄',
    practice: '✏️',
    weak_topic: '⚠️',
    recovery: '🔧',
  };
  return icons[type] || '📌';
};