import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';

const CONCOURSES = ['PF', 'PRF', 'PC-SP', 'PF-CE', 'Escrivão', 'Delegado', 'Outro'];
const STEPS = [
  { title: 'Bem-vindo ao StudyPro', description: 'Sua jornada de estudos começa aqui' },
  { title: 'Selecione seu concurso', description: 'Qual concurso você está estudando?' },
  { title: 'Data da prova', description: 'Quando será sua prova?' },
  { title: 'Tempo disponível', description: 'Quanto tempo você pode estudar por dia?' },
  { title: 'Pronto!', description: 'Vamos começar sua jornada' },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [selectedConcourse, setSelectedConcourse] = useState('');
  const [examDate, setExamDate] = useState('');
  const [dailyTime, setDailyTime] = useState('2');

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const progress = (step + 1) / STEPS.length;

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepIcon}>📚</Text>
            <Text style={styles.stepTitle}>{STEPS[0].title}</Text>
            <Text style={styles.stepDescription}>{STEPS[0].description}</Text>
            <View style={styles.features}>
              <Text style={styles.featureItem}>📊 Acompanhe seu progresso</Text>
              <Text style={styles.featureItem}>🎯 Foque no que importa</Text>
              <Text style={styles.featureItem}>🔄 Revisão espaçada inteligente</Text>
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{STEPS[1].title}</Text>
            <Text style={styles.stepDescription}>{STEPS[1].description}</Text>
            <View style={styles.concoursesContainer}>
              {CONCOURSES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.concourseChip, selectedConcourse === c && styles.concourseChipSelected]}
                  onPress={() => { setSelectedConcourse(c); Haptics.selectionAsync(); }}
                >
                  <Text style={[styles.concourseText, selectedConcourse === c && styles.concourseTextSelected]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{STEPS[2].title}</Text>
            <Text style={styles.stepDescription}>{STEPS[2].description}</Text>
            <TextInput
              style={styles.dateInput}
              value={examDate}
              onChangeText={setExamDate}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
            />
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{STEPS[3].title}</Text>
            <Text style={styles.stepDescription}>{STEPS[3].description}</Text>
            <View style={styles.timeOptions}>
              {['1', '2', '3', '4', '5'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeChip, dailyTime === t && styles.timeChipSelected]}
                  onPress={() => { setDailyTime(t); Haptics.selectionAsync(); }}
                >
                  <Text style={[styles.timeText, dailyTime === t && styles.timeTextSelected]}>{t}h</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepIcon}>🎉</Text>
            <Text style={styles.stepTitle}>{STEPS[4].title}</Text>
            <Text style={styles.stepDescription}>{STEPS[4].description}</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Concurso</Text>
                <Text style={styles.summaryValue}>{selectedConcourse || 'Não selecionado'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Data da prova</Text>
                <Text style={styles.summaryValue}>{examDate || 'Não definida'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tempo diário</Text>
                <Text style={styles.summaryValue}>{dailyTime}h</Text>
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{step + 1}/{STEPS.length}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {renderStep()}
      </ScrollView>

      <View style={styles.buttons}>
        {step > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.nextButton, step === 0 && styles.nextButtonFull]} onPress={handleNext}>
          <Text style={styles.nextButtonText}>{step === STEPS.length - 1 ? 'Começar' : 'Próximo'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  progressContainer: {
    padding: 16,
    paddingTop: 48,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  progressText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  stepContent: {
    alignItems: 'center',
  },
  stepIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  stepTitle: {
    color: '#F1F5F9',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    color: '#64748B',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  features: {
    alignItems: 'flex-start',
  },
  featureItem: {
    color: '#94A3B8',
    fontSize: 16,
    marginBottom: 12,
  },
  concoursesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  concourseChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    margin: 6,
  },
  concourseChipSelected: {
    backgroundColor: '#3B82F6',
  },
  concourseText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  concourseTextSelected: {
    color: '#FFFFFF',
  },
  dateInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    color: '#F1F5F9',
    fontSize: 24,
    textAlign: 'center',
    width: 200,
  },
  timeOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  timeChip: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  timeChipSelected: {
    backgroundColor: '#3B82F6',
  },
  timeText: {
    color: '#94A3B8',
    fontSize: 20,
    fontWeight: '600',
  },
  timeTextSelected: {
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  summaryLabel: {
    color: '#64748B',
    fontSize: 14,
  },
  summaryValue: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '500',
  },
  buttons: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  backButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});