import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Session, Platform, ErrorType } from '../types';

interface SessionFormProps {
  onSubmit: (data: Omit<Session, 'id' | 'createdAt'>) => void;
  isLoading?: boolean;
}

const SUBJECTS = ['Matemática', 'Português', 'Direito Constitucional', 'Direito Administrativo', 'Informática', 'Raciocínio Lógico', 'Atualidades'];
const PLATFORMS: Platform[] = ['questoes', 'tec', 'aprova', 'gran', 'simulado', 'estrategia', 'other'];
const ERROR_TYPES: ErrorType[] = ['interpretacao', 'cálculo', 'conceito', 'memória', 'desatenção', 'metodo', 'outro'];

export const SessionForm: React.FC<SessionFormProps> = ({ onSubmit, isLoading }) => {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<Platform>('questoes');
  const [questionsTotal, setQuestionsTotal] = useState('');
  const [questionsCorrect, setQuestionsCorrect] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [errorTypes, setErrorTypes] = useState<ErrorType[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  const handleSubmit = () => {
    if (!subject || !topic || !questionsTotal || !questionsCorrect) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit({
      subject,
      topic,
      platform,
      questionsTotal: parseInt(questionsTotal),
      questionsCorrect: parseInt(questionsCorrect),
      difficulty,
      errorTypes,
      tags,
    });
    resetForm();
  };

  const resetForm = () => {
    setSubject('');
    setTopic('');
    setPlatform('questoes');
    setQuestionsTotal('');
    setQuestionsCorrect('');
    setDifficulty(3);
    setErrorTypes([]);
    setTags([]);
    setTagInput('');
  };

  const toggleErrorType = (type: ErrorType) => {
    Haptics.selectionAsync();
    setErrorTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags((prev) => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.label}>Matéria *</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowSubjectDropdown(!showSubjectDropdown)}>
          <Text style={subject ? styles.inputText : styles.placeholder}>{subject || 'Selecione a matéria'}</Text>
        </TouchableOpacity>
        {showSubjectDropdown && (
          <View style={styles.dropdown}>
            {SUBJECTS.map((s) => (
              <TouchableOpacity key={s} style={styles.dropdownItem} onPress={() => { setSubject(s); setShowSubjectDropdown(false); }}>
                <Text style={styles.dropdownText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Tópico *</Text>
        <TextInput style={styles.input} value={topic} onChangeText={setTopic} placeholder="Ex: Frações, Concordância" placeholderTextColor="#64748B" />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Plataforma</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.platformsContainer}>
          {PLATFORMS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.platformChip, platform === p && styles.platformChipSelected]}
              onPress={() => { setPlatform(p); Haptics.selectionAsync(); }}
            >
              <Text style={[styles.platformText, platform === p && styles.platformTextSelected]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.row}>
        <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Total de Questões *</Text>
          <TextInput style={styles.input} value={questionsTotal} onChangeText={setQuestionsTotal} keyboardType="numeric" placeholder="10" placeholderTextColor="#64748B" />
        </View>
        <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Acertos *</Text>
          <TextInput style={styles.input} value={questionsCorrect} onChangeText={setQuestionsCorrect} keyboardType="numeric" placeholder="8" placeholderTextColor="#64748B" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Dificuldade: {difficulty}</Text>
        <View style={styles.sliderContainer}>
          {[1, 2, 3, 4, 5].map((val) => (
            <TouchableOpacity
              key={val}
              style={[styles.sliderDot, difficulty >= val && styles.sliderDotActive]}
              onPress={() => { setDifficulty(val); Haptics.selectionAsync(); }}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Tipos de Erro</Text>
        <View style={styles.errorTypesContainer}>
          {ERROR_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.errorTypeChip, errorTypes.includes(type) && styles.errorTypeChipSelected]}
              onPress={() => toggleErrorType(type)}
            >
              <Text style={[styles.errorTypeText, errorTypes.includes(type) && styles.errorTypeTextSelected]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Tags</Text>
        <View style={styles.tagInputRow}>
          <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} value={tagInput} onChangeText={setTagInput} placeholder="Adicionar tag" placeholderTextColor="#64748B" />
          <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
            <Text style={styles.addTagText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tagsContainer}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
              <TouchableOpacity onPress={() => removeTag(tag)}>
                <Text style={styles.removeTag}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isLoading}>
        <Text style={styles.submitText}>{isLoading ? 'Salvando...' : 'Salvar Sessão'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    color: '#F1F5F9',
    fontSize: 16,
  },
  placeholder: {
    color: '#64748B',
  },
  inputText: {
    color: '#F1F5F9',
  },
  dropdown: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  dropdownText: {
    color: '#F1F5F9',
    fontSize: 16,
  },
  platformsContainer: {
    flexDirection: 'row',
  },
  platformChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    marginRight: 8,
  },
  platformChipSelected: {
    backgroundColor: '#3B82F6',
  },
  platformText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  platformTextSelected: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  sliderDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
  },
  sliderDotActive: {
    backgroundColor: '#3B82F6',
  },
  errorTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  errorTypeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    marginRight: 8,
    marginBottom: 8,
  },
  errorTypeChipSelected: {
    backgroundColor: '#EF4444',
  },
  errorTypeText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  errorTypeTextSelected: {
    color: '#FFFFFF',
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTagButton: {
    width: 48,
    height: 48,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#F1F5F9',
    fontSize: 14,
    marginRight: 6,
  },
  removeTag: {
    color: '#94A3B8',
    fontSize: 18,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});