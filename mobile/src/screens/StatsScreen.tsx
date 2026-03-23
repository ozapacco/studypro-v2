import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { useStats } from '../hooks/useStats';
import { formatAccuracy, getAccuracyColor, getPhaseColor } from '../utils';

const { width } = Dimensions.get('window');

const mockStats = {
  projectedScore: 78,
  subjectEvolution: [
    { subject: 'Matemática', accuracy: 82, trend: 5 },
    { subject: 'Português', accuracy: 68, trend: -2 },
    { subject: 'Direito Const.', accuracy: 75, trend: 8 },
    { subject: 'Direito Adm.', accuracy: 55, trend: -5 },
    { subject: 'Informática', accuracy: 80, trend: 3 },
  ],
  criticalTopics: [
    { topic: 'Agentes Públicos', accuracy: 42, reviewCount: 12 },
    { topic: 'Crase', accuracy: 45, reviewCount: 8 },
    { topic: 'Juros Simples', accuracy: 48, reviewCount: 6 },
    { topic: 'Poderes Adm.', accuracy: 52, reviewCount: 10 },
  ],
  consistencyHeatmap: [
    { day: 'Seg', value: 90 },
    { day: 'Ter', value: 75 },
    { day: 'Qua', value: 85 },
    { day: 'Qui', value: 60 },
    { day: 'Sex', value: 95 },
    { day: 'Sáb', value: 40 },
    { day: 'Dom', value: 20 },
  ],
};

export const StatsScreen: React.FC = () => {
  const { stats, isLoading, refresh } = useStats();
  const data = stats || mockStats;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Estatísticas</Text>

        <View style={styles.projectedCard}>
          <Text style={styles.projectedLabel}>Projeção de Nota</Text>
          <View style={styles.projectedValueRow}>
            <Text style={[styles.projectedValue, { color: getAccuracyColor(data.projectedScore) }]}>
              {data.projectedScore}
            </Text>
            <Text style={styles.projectedSuffix}>pts</Text>
          </View>
          <View style={styles.projectedBar}>
            <View style={[styles.projectedFill, { width: `${data.projectedScore}%` }]} />
          </View>
          <Text style={styles.projectedHint}>Meta: 70+ para aprovação</Text>
        </View>

        <Text style={styles.sectionTitle}>Evolução por Matéria</Text>
        <View style={styles.evolutionCard}>
          {data.subjectEvolution.map((item, index) => (
            <View key={item.subject} style={styles.evolutionItem}>
              <View style={styles.evolutionHeader}>
                <Text style={styles.evolutionSubject}>{item.subject}</Text>
                <View style={styles.evolutionValueRow}>
                  <Text style={[styles.evolutionAccuracy, { color: getAccuracyColor(item.accuracy) }]}>
                    {formatAccuracy(item.accuracy)}
                  </Text>
                  <Text style={[styles.evolutionTrend, { color: item.trend >= 0 ? '#10B981' : '#EF4444' }]}>
                    {item.trend >= 0 ? '↑' : '↓'} {Math.abs(item.trend)}%
                  </Text>
                </View>
              </View>
              <View style={styles.evolutionBar}>
                <View style={[styles.evolutionFill, { width: `${item.accuracy}%`, backgroundColor: getPhaseColor(index + 1) }]} />
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Tópicos Críticos</Text>
        <View style={styles.criticalCard}>
          {data.criticalTopics.map((item, index) => (
            <View key={item.topic} style={styles.criticalItem}>
              <View style={styles.criticalInfo}>
                <Text style={styles.criticalTopic}>{item.topic}</Text>
                <Text style={styles.criticalReviews}>{item.reviewCount} revisões</Text>
              </View>
              <Text style={[styles.criticalAccuracy, { color: getAccuracyColor(item.accuracy) }]}>
                {formatAccuracy(item.accuracy)}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Consistência</Text>
        <View style={styles.heatmapCard}>
          <View style={styles.heatmapRow}>
            {data.consistencyHeatmap.map((item) => (
              <View key={item.day} style={styles.heatmapCell}>
                <View style={[styles.heatmapBox, { opacity: item.value / 100 }]}>
                  <Text style={styles.heatmapValue}>{item.value}%</Text>
                </View>
                <Text style={styles.heatmapDay}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 48,
  },
  title: {
    color: '#F1F5F9',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  projectedCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  projectedLabel: {
    color: '#64748B',
    fontSize: 14,
    marginBottom: 8,
  },
  projectedValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  projectedValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  projectedSuffix: {
    color: '#64748B',
    fontSize: 18,
    marginLeft: 4,
  },
  projectedBar: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  projectedFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  projectedHint: {
    color: '#64748B',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  evolutionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  evolutionItem: {
    marginBottom: 16,
  },
  evolutionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  evolutionSubject: {
    color: '#F1F5F9',
    fontSize: 14,
  },
  evolutionValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  evolutionAccuracy: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  evolutionTrend: {
    fontSize: 12,
  },
  evolutionBar: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
  },
  evolutionFill: {
    height: '100%',
    borderRadius: 3,
  },
  criticalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  criticalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  criticalInfo: {
    flex: 1,
  },
  criticalTopic: {
    color: '#F1F5F9',
    fontSize: 14,
  },
  criticalReviews: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  criticalAccuracy: {
    fontSize: 16,
    fontWeight: '600',
  },
  heatmapCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  heatmapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heatmapCell: {
    alignItems: 'center',
    flex: 1,
  },
  heatmapBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  heatmapValue: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  heatmapDay: {
    color: '#64748B',
    fontSize: 12,
  },
});