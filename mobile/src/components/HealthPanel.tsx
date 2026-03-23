import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { HealthMetrics } from '../types';
import { formatAccuracy, getAccuracyColor } from '../utils';

interface HealthPanelProps {
  health: HealthMetrics;
}

export const HealthPanel: React.FC<HealthPanelProps> = ({ health }) => {
  const trendIcon = health.accuracyTrend === 'up' ? '↑' : health.accuracyTrend === 'down' ? '↓' : '→';
  const trendColor = health.accuracyTrend === 'up' ? '#10B981' : health.accuracyTrend === 'down' ? '#EF4444' : '#F59E0B';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Painel de Saúde</Text>
      
      <View style={styles.accuracyRow}>
        <View style={styles.accuracyMain}>
          <Text style={styles.accuracyLabel}>Taxa de Acerto</Text>
          <View style={styles.accuracyValueRow}>
            <Text style={[styles.accuracyValue, { color: getAccuracyColor(health.accuracyRate) }]}>
              {formatAccuracy(health.accuracyRate)}
            </Text>
            <Text style={[styles.trendIcon, { color: trendColor }]}>{trendIcon}</Text>
          </View>
        </View>
        <View style={styles.consistencyBox}>
          <Text style={styles.consistencyLabel}>Consistência</Text>
          <Text style={styles.consistencyValue}>{health.consistency}%</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Matéria Mais Fraca</Text>
          <Text style={styles.statValue}>{health.weakestSubject}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Tópico Crítico</Text>
          <Text style={styles.statValue}>{health.criticalTopic}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  accuracyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  accuracyMain: {
    flex: 1,
  },
  accuracyLabel: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 4,
  },
  accuracyValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accuracyValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  trendIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  consistencyBox: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  consistencyLabel: {
    color: '#64748B',
    fontSize: 10,
    marginBottom: 4,
  },
  consistencyValue: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    marginRight: 8,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '500',
  },
});