import type { TopicPerformance } from '../../types';

export function calculateTopicPriority(
  topic: TopicPerformance,
  config: PriorityConfig = { recurrenceWeight: 0.3, accuracyWeight: 0.4, phaseWeight: 0.3 },
  phase: StudyPhase = 'base'
): number {
  const weights = getPhaseWeights(phase);
  const phaseWeight = weights[phase];
  
  const normalizedAccuracyGap = Math.max(0, 100 - topic.accuracy) / 100;
  const normalizedRecurrenceScore = Math.min(1, topic.recurrenceScore);
  
  return (
    normalizedRecurrenceScore * config.recurrenceWeight +
    normalizedAccuracyGap * config.accuracyWeight +
    phaseWeight * config.phaseWeight
  );
}

export function getPriorityReason(topic: TopicPerformance, priority: number): string {
  if (priority > 0.7) {
    if (topic.accuracy < 50) return 'Prioridade máxima: taxa de acerto muito baixa';
    if (topic.recurrenceScore > 0.8) return 'Erros recorrentes críticos';
    return 'Tópico com alta prioridade';
  }
  
  if (priority > 0.5) {
    if (topic.accuracy < 70) return 'Taxa de acerto abaixo da meta';
    if (topic.recurrenceScore > 0.6) return 'Erros recorrentes';
    return 'Prioridade média';
  }
  
  if (topic.accuracy < 80) return 'Taxa de acerto precisa de atenção';
  return 'Prioridade padrão';
}

export function recalculateTopicPriorities(
  topicPerformance: TopicPerformance[],
  phase: StudyPhase = 'base'
): { topic: string; priority: number; reason: string }[] {
  const priorities = topicPerformance.map(topic => {
    const priority = calculateTopicPriority(topic, { recurrenceWeight: 0.3, accuracyWeight: 0.4, phaseWeight: 0.3 }, phase);
    const reason = getPriorityReason(topic, priority);
    
    return {
      topic: topic.topic,
      priority,
      reason,
    };
  });
  
  return priorities.sort((a, b) => b.priority - a.priority);
}

export function detectCriticalTopics(
  topicPerformance: TopicPerformance[],
  accuracyThreshold: number = 50,
  recurrenceThreshold: number = 0.7
): string[] {
  return topicPerformance
    .filter(topic => 
      topic.accuracy < accuracyThreshold || 
      topic.recurrenceScore > recurrenceThreshold
    )
    .map(topic => topic.topic);
}