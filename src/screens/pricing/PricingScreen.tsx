import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../lib/theme';
import { useAuthStore } from '../../store/auth';
import { SubscriptionPlan, PLAN_PRICES } from '../../types';

interface PlanFeature {
  label: string;
  included: boolean;
}

interface Plan {
  id: SubscriptionPlan;
  name: string;
  price: number | null;
  priceLabel: string;
  description: string;
  popular?: boolean;
  features: PlanFeature[];
  color: string;
  bg: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: null,
    priceLabel: 'Бесплатно',
    description: 'Для старта',
    color: colors.secondary,
    bg: colors.background,
    features: [
      { label: 'Ручной ввод расходов', included: true },
      { label: 'До 20 операций / мес', included: true },
      { label: 'Базовая статистика', included: true },
      { label: 'Сканирование чеков', included: false },
      { label: 'Импорт выписок', included: false },
      { label: 'AI-рекомендации', included: false },
      { label: 'Недельный отчёт (email)', included: false },
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 2990,
    priceLabel: '2 990 ₸/мес',
    description: 'Для личного контроля',
    popular: true,
    color: colors.accent,
    bg: colors.softBlue,
    features: [
      { label: 'Неограниченные операции', included: true },
      { label: 'Сканирование чеков (OCR)', included: true },
      { label: 'Импорт выписок (Kaspi, Halyk...)', included: true },
      { label: 'AI-рекомендации', included: true },
      { label: 'Недельный отчёт (email)', included: true },
      { label: 'Leak Report', included: true },
      { label: 'Семья до 5 человек', included: false },
    ],
  },
  {
    id: 'family',
    name: 'Family',
    price: 5990,
    priceLabel: '5 990 ₸/мес',
    description: 'Для всей семьи',
    color: colors.success,
    bg: colors.softGreen,
    features: [
      { label: 'Всё из Plus', included: true },
      { label: 'До 5 членов семьи', included: true },
      { label: 'Семейные лимиты', included: true },
      { label: 'Семейные цели', included: true },
      { label: 'Семейный отчёт', included: true },
      { label: 'Ежемесячный отчёт (PDF)', included: false },
      { label: 'План закрытия долгов', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 14990,
    priceLabel: '14 990 ₸/мес',
    description: 'Полный контроль',
    color: '#A855F7',
    bg: '#F5F3FF',
    features: [
      { label: 'Всё из Family', included: true },
      { label: 'Ежемесячный deep report', included: true },
      { label: 'План закрытия долгов', included: true },
      { label: 'Экспорт PDF / CSV', included: true },
      { label: 'Приоритетный OCR', included: true },
      { label: 'Поддержка 24/7', included: true },
      { label: 'Ранний доступ к функциям', included: true },
    ],
  },
];

export default function PricingScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState<SubscriptionPlan | null>(null);

  const currentPlan = user?.subscription_plan ?? 'free';

  const handleSubscribe = async (plan: Plan) => {
    if (plan.id === 'free' || plan.id === currentPlan) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(plan.id);

    try {
      // In production: trigger RevenueCat purchase flow
      // For now, show instructions
      Alert.alert(
        `Подписка ${plan.name}`,
        `Откройте App Store / Google Play для оформления подписки.\n\nЦена: ${plan.priceLabel}`,
        [{ text: 'Понятно' }],
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Тарифы</Text>
        <Text style={styles.subtitle}>Выберите подходящий план</Text>
      </View>

      {PLANS.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          isCurrent={plan.id === currentPlan}
          loading={loading === plan.id}
          onSubscribe={() => handleSubscribe(plan)}
        />
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Подписка оформляется через App Store или Google Play.{'\n'}
          Отмена в любой момент. Без скрытых платежей.
        </Text>
      </View>
    </ScrollView>
  );
}

function PlanCard({
  plan, isCurrent, loading, onSubscribe,
}: { plan: Plan; isCurrent: boolean; loading: boolean; onSubscribe: () => void }) {
  return (
    <View style={[
      styles.planCard,
      { borderColor: plan.popular ? plan.color : colors.border },
      plan.popular && { borderWidth: 2 },
    ]}>
      {plan.popular && (
        <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
          <Text style={styles.popularText}>Популярный</Text>
        </View>
      )}

      <View style={styles.planHeader}>
        <View style={[styles.planIconBg, { backgroundColor: plan.bg }]}>
          <Text style={[styles.planInitial, { color: plan.color }]}>{plan.name[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planDesc}>{plan.description}</Text>
        </View>
        <Text style={[styles.planPrice, { color: plan.color }]}>{plan.priceLabel}</Text>
      </View>

      <View style={styles.featuresWrap}>
        {plan.features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={[styles.featureCheck, { color: f.included ? colors.success : colors.muted }]}>
              {f.included ? '✓' : '–'}
            </Text>
            <Text style={[styles.featureLabel, !f.included && styles.featureDisabled]}>
              {f.label}
            </Text>
          </View>
        ))}
      </View>

      {isCurrent ? (
        <View style={[styles.currentBadge, { backgroundColor: plan.bg }]}>
          <Text style={[styles.currentText, { color: plan.color }]}>✓ Текущий тариф</Text>
        </View>
      ) : plan.id !== 'free' ? (
        <TouchableOpacity
          style={[styles.subscribeBtn, { backgroundColor: plan.color }]}
          onPress={onSubscribe}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.subscribeBtnText}>
            {loading ? 'Загрузка...' : `Подключить ${plan.name}`}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 100 },
  header: { marginBottom: 20 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 15, color: colors.accent },
  title: { ...typography.h1, marginBottom: 4 },
  subtitle: { ...typography.bodySmall },
  planCard: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: 20, marginBottom: 12, position: 'relative',
  },
  popularBadge: {
    position: 'absolute', top: -1, right: 16,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
  },
  popularText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  planIconBg: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  planInitial: { fontSize: 20, fontWeight: '700' },
  planName: { fontSize: 17, fontWeight: '600', color: colors.text },
  planDesc: { fontSize: 13, color: colors.secondary, marginTop: 1 },
  planPrice: { fontSize: 14, fontWeight: '600' },
  featuresWrap: { gap: 7, marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureCheck: { fontSize: 14, fontWeight: '600', width: 16 },
  featureLabel: { fontSize: 14, color: colors.text },
  featureDisabled: { color: colors.muted },
  subscribeBtn: {
    borderRadius: radius.md, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  subscribeBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  currentBadge: {
    borderRadius: radius.md, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  currentText: { fontSize: 14, fontWeight: '600' },
  footer: { paddingVertical: 16 },
  footerText: { fontSize: 12, color: colors.muted, textAlign: 'center', lineHeight: 18 },
});
