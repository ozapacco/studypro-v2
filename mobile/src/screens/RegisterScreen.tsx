import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { SessionForm } from '../components';
import { useSession } from '../hooks/useSession';
import type { Session } from '../types';
import * as Haptics from 'expo-haptics';

export const RegisterScreen: React.FC = () => {
  const { createSession, isLoading } = useSession();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedData, setSavedData] = useState<any>(null);

  const handleSubmit = async (data: Omit<Session, 'id' | 'createdAt'>) => {
    try {
      await createSession(data);
      setSavedData(data);
      setShowSuccessModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const accuracy = savedData ? Math.round((savedData.questionsCorrect / savedData.questionsTotal) * 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.header}>
        <Text style={styles.title}>Nova Sessão</Text>
        <Text style={styles.subtitle}>Registre sua sessão de estudos</Text>
      </View>
      <SessionForm onSubmit={handleSubmit} isLoading={isLoading} />

      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>✅</Text>
            <Text style={styles.modalTitle}>Sessão Salva!</Text>
            <View style={styles.modalStats}>
              <View style={styles.modalStat}>
                <Text style={styles.modalStatValue}>{savedData?.questionsCorrect}/{savedData?.questionsTotal}</Text>
                <Text style={styles.modalStatLabel}>Questões</Text>
              </View>
              <View style={styles.modalStat}>
                <Text style={styles.modalStatValue}>{accuracy}%</Text>
                <Text style={styles.modalStatLabel}>Acerto</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowSuccessModal(false)}>
              <Text style={styles.modalButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 16,
    paddingTop: 48,
  },
  title: {
    color: '#F1F5F9',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  modalTitle: {
    color: '#F1F5F9',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  modalStats: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  modalStat: {
    alignItems: 'center',
    marginHorizontal: 24,
  },
  modalStatValue: {
    color: '#3B82F6',
    fontSize: 24,
    fontWeight: '700',
  },
  modalStatLabel: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  modalButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});