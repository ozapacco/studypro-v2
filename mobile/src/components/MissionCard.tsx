import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Mission } from '../types';
import { formatTime, getMissionTypeIcon, getPlatformIcon } from '../utils';

interface MissionCardProps {
  mission: Mission;
  onComplete?: () => void;
}

export const MissionCard: React.FC<MissionCardProps> = ({ mission, onComplete }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>{getMissionTypeIcon(mission.type)}</Text>
        <View style={styles.headerText}>
          <Text style={styles.type}>{mission.type.toUpperCase()}</Text>
          <Text style={styles.reason}>{mission.reason}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Matéria:</Text>
          <Text style={styles.value}>{mission.subject}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Tópico:</Text>
          <Text style={styles.value}>{mission.topic}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Plataforma:</Text>
          <Text style={styles.value}>{getPlatformIcon(mission.platform)} {mission.platform}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Tempo:</Text>
          <Text style={styles.value}>{formatTime(mission.estimatedTime)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>Concluir Missão</Text>
      </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  type: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  reason: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 2,
  },
  content: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    color: '#64748B',
    fontSize: 14,
  },
  value: {
    color: '#F1F5F9',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});