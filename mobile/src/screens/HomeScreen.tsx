import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, StatusBar } from 'react-native';
import { useMission } from '../hooks/useMission';
import { MissionCard, HealthPanel } from '../components';
import type { HealthMetrics, Mission } from '../types';

const mockHealth: HealthMetrics = {
  accuracyRate: 72,
  accuracyTrend: 'up',
  weakestSubject: 'Direito Administrativo',
  criticalTopic: 'Agentes Públicos',
  consistency: 85,
};

const mockBacklog: Mission[] = [
  {
    id: '1',
    type: 'recovery',
    subject: 'Matemática',
    topic: 'Porcentagem',
    platform: 'questoes',
    estimatedTime: 25,
    reason: '3 dias sem revisão',
    priority: 2,
  },
  {
    id: '2',
    type: 'weak_topic',
    subject: 'Português',
    topic: 'Crase',
    platform: 'tec',
    estimatedTime: 30,
    reason: 'Baixo desempenho (45% accuracy)',
    priority: 1,
  },
];

export const HomeScreen: React.FC = () => {
  const { currentMission, backlog, isLoading, refresh } = useMission();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
      >
        <Text style={styles.greeting}>Olá! 👋</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>

        <Text style={styles.sectionTitle}>Missão do Dia</Text>
        {currentMission ? (
          <MissionCard mission={currentMission} onComplete={() => {}} />
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhuma missão disponível</Text>
          </View>
        )}

        <HealthPanel health={mockHealth} />

        <Text style={styles.sectionTitle}>Backlog ({backlog.length})</Text>
        {backlog.length > 0 ? (
          backlog.map((mission) => <MissionCard key={mission.id} mission={mission} />)
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Tudo em dia! 🎉</Text>
          </View>
        )}
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
  greeting: {
    color: '#F1F5F9',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  date: {
    color: '#64748B',
    fontSize: 14,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 16,
  },
});