import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { colors, typography } from '../../lib/theme';
import { Button } from '../../components/ui/Button';

interface Step {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
}

const STEPS: Step[] = [
  { id: 'welcome', title: 'Привет!', subtitle: 'Настроим финансовый профиль за 2 минуты.', emoji: '👋' },
  { id: 'income', title: 'Ваш доход', subtitle: 'Суммарный ежемесячный доход семьи.', emoji: '💰' },
  { id: 'fixed', title: 'Фиксированные расходы', subtitle: 'Аренда, кредиты, коммуналка, страховки.', emoji: '📋' },
  { id: 'debt', title: 'Долговая нагрузка', subtitle: 'Общая сумма кредитов (включая ипотеку).', emoji: '💳' },
  { id: 'goals', title: 'Ваши финансовые цели', subtitle: 'Выберите то, что важно для вас.', emoji: '🎯' },
  { id: 'done', title: 'Готово!', subtitle: 'Ваш финансовый профиль настроен. Начнём анализ.', emoji: '✅' },
];

const GOAL_OPTIONS = [
  { id: 'emergency_fund', label: '🛡 Резервный фонд' },
  { id: 'debt_payoff', label: '💳 Закрыть долги' },
  { id: 'vacation', label: '✈️ Отпуск / путешествие' },
  { id: 'real_estate', label: '🏠 Недвижимость' },
  { id: 'car', label: '🚗 Автомобиль' },
  { id: 'education', label: '📚 Образование' },
  { id: 'business', label: '💼 Бизнес' },
  { id: 'retirement', label: '🌅 Пенсия' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, fetchProfile } = useAuthStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const [income, setIncome] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState('');
  const [debt, setDebt] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const step = STEPS[stepIndex];

  const next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (stepIndex < STEPS.length - 1) setStepIndex((p) => p + 1);
  };

  const prev = () => {
    if (stepIndex > 0) setStepIndex((p) => p - 1);
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from('financial_profiles').upsert({
        user_id: user.id,
        monthly_income: parseFloat(income.replace(/\s/g, '')) || 0,
        monthly_fixed_expenses: parseFloat(fixedExpenses.replace(/\s/g, '')) || 0,
        total_debt: parseFloat(debt.replace(/\s/g, '')) || 0,
        financial_goals: selectedGoals,
        onboarding_completed: true,
      });

      await fetchProfile();

      // Trigger initial leak detection
      await supabase.functions.invoke('detect-financial-leaks', { body: { user_id: user.id } });

      router.replace('/(tabs)');
    } catch (err: unknown) {
      Alert.alert('Ошибка', 'Не удалось сохранить профиль. Попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.root}>
        {/* Progress */}
        <View style={styles.progress}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i <= stepIndex && { backgroundColor: colors.accent },
              ]}
            />
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInRight.duration(300)} key={step.id}>
            <Text style={styles.emoji}>{step.emoji}</Text>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.subtitle}>{step.subtitle}</Text>

            {step.id === 'income' && (
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={income}
                  onChangeText={setIncome}
                  keyboardType="numeric"
                  placeholder="350 000"
                  placeholderTextColor={colors.muted}
                  autoFocus
                />
                <Text style={styles.currency}>₸ / мес</Text>
              </View>
            )}

            {step.id === 'fixed' && (
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={fixedExpenses}
                  onChangeText={setFixedExpenses}
                  keyboardType="numeric"
                  placeholder="80 000"
                  placeholderTextColor={colors.muted}
                  autoFocus
                />
                <Text style={styles.currency}>₸ / мес</Text>
              </View>
            )}

            {step.id === 'debt' && (
              <>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    value={debt}
                    onChangeText={setDebt}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    autoFocus
                  />
                  <Text style={styles.currency}>₸</Text>
                </View>
                <Text style={styles.hint}>Не заполняйте, если долгов нет.</Text>
              </>
            )}

            {step.id === 'goals' && (
              <View style={styles.goalsGrid}>
                {GOAL_OPTIONS.map((goal) => (
                  <TouchableOpacity
                    key={goal.id}
                    style={[
                      styles.goalBtn,
                      selectedGoals.includes(goal.id) && styles.goalBtnActive,
                    ]}
                    onPress={() => toggleGoal(goal.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.goalLabel}>{goal.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {step.id === 'done' && (
              <View style={styles.doneCard}>
                <Text style={styles.doneRow}>💰 Доход: <Text style={styles.doneValue}>{parseInt(income || '0').toLocaleString('ru-KZ')} ₸</Text></Text>
                <Text style={styles.doneRow}>📋 Фиксированные: <Text style={styles.doneValue}>{parseInt(fixedExpenses || '0').toLocaleString('ru-KZ')} ₸</Text></Text>
                <Text style={styles.doneRow}>💳 Долги: <Text style={styles.doneValue}>{parseInt(debt || '0').toLocaleString('ru-KZ')} ₸</Text></Text>
                <Text style={styles.doneRow}>🎯 Цели: <Text style={styles.doneValue}>{selectedGoals.length}</Text></Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <View style={styles.actions}>
          {stepIndex > 0 && stepIndex < STEPS.length - 1 && (
            <TouchableOpacity onPress={prev} style={styles.backBtn}>
              <Text style={styles.backText}>← Назад</Text>
            </TouchableOpacity>
          )}

          {stepIndex < STEPS.length - 1 ? (
            <Button
              onPress={next}
              label={stepIndex === 0 ? 'Начать' : 'Далее'}
              style={{ flex: 1 }}
            />
          ) : (
            <Button
              onPress={finish}
              label="Запустить анализ"
              loading={saving}
              style={{ flex: 1 }}
            />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  progress: {
    flexDirection: 'row', gap: 6, padding: 24, paddingBottom: 8,
    paddingTop: 56, alignItems: 'center',
  },
  progressDot: {
    flex: 1, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
  },
  content: { padding: 24, flexGrow: 1 },
  emoji: { fontSize: 52, marginBottom: 20 },
  title: { ...typography.h1, marginBottom: 8 },
  subtitle: { ...typography.bodySmall, lineHeight: 22, marginBottom: 28 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, padding: 16,
  },
  input: {
    flex: 1, fontSize: 24, fontWeight: '600', color: colors.text,
  },
  currency: { fontSize: 16, color: colors.secondary },
  hint: { fontSize: 13, color: colors.muted, marginTop: 10 },
  goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goalBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  goalBtnActive: { backgroundColor: colors.softBlue, borderColor: colors.accent },
  goalLabel: { fontSize: 14, color: colors.text },
  doneCard: {
    backgroundColor: colors.card, borderRadius: 16, borderWidth: 1,
    borderColor: colors.border, padding: 20, gap: 10,
  },
  doneRow: { fontSize: 15, color: colors.secondary },
  doneValue: { fontWeight: '600', color: colors.text },
  actions: {
    flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 40,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  backBtn: { justifyContent: 'center', paddingHorizontal: 8 },
  backText: { fontSize: 15, color: colors.accent },
});
