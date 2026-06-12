import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography } from '../../lib/theme';
import { formatMoney, formatRelativeDate } from '../../lib/format';
import { useAuthStore } from '../../store/auth';
import { useExpensesStore } from '../../store/expenses';
import { Card } from '../../components/ui/Card';
import { CountUp } from '../../components/ui/CountUp';
import { CardSkeleton, TransactionSkeleton } from '../../components/ui/SkeletonLoader';
import { CATEGORY_LABELS, CATEGORY_COLORS, Expense } from '../../types';

const QUICK_ACTIONS = [
  { icon: '＋', label: 'Добавить', color: colors.softBlue, iconColor: colors.accent, route: '/add-expense' },
  { icon: '📷', label: 'Чек', color: colors.softGreen, iconColor: colors.success, route: '/receipt-scanner' },
  { icon: '📄', label: 'Выписка', color: colors.softYellow, iconColor: colors.warning, route: '/statement-import' },
  { icon: '📊', label: 'Отчет', color: '#FEE2E2', iconColor: colors.danger, route: '/(tabs)/reports' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { expenses, todayExpenses, loading, fetchExpenses, fetchDailySnapshot, dailySnapshot, getSafeToSpend } = useExpensesStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (user) {
      fetchExpenses(user.id);
      fetchDailySnapshot(user.id);
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user) await Promise.all([fetchExpenses(user.id), fetchDailySnapshot(user.id)]);
    setRefreshing(false);
  }, [user]);

  const monthlyIncome = profile?.monthly_income ?? 0;
  const monthlyFixed = profile?.monthly_fixed_expenses ?? 0;
  const safeToSpend = getSafeToSpend(monthlyIncome, monthlyFixed);
  const spentToday = todayExpenses.reduce((s, e) => s + e.amount, 0);
  const dailyBudget = monthlyIncome > 0 ? (monthlyIncome - monthlyFixed) / 30 : 0;
  const spentPercent = dailyBudget > 0 ? Math.min((spentToday / dailyBudget) * 100, 100) : 0;

  const firstName = user?.full_name?.split(' ')[0] ?? 'Пользователь';
  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'ФИ';

  const today = new Date();
  const dateStr = today.toLocaleDateString('ru-KZ', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateLabel}>{dateStr}</Text>
            <Text style={styles.greeting}>Привет, {firstName}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={styles.avatar}
            activeOpacity={0.7}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        </View>

        {/* Alert if limit exceeded */}
        {spentPercent >= 90 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); router.push('/(tabs)/leaks'); }}
            activeOpacity={0.8}
          >
            <Text style={styles.alertIcon}>⚠️</Text>
            <Text style={styles.alertText}>Дневной лимит почти исчерпан</Text>
            <Text style={styles.alertAction}>→</Text>
          </TouchableOpacity>
        )}

        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Можно потратить сегодня</Text>
          <CountUp value={safeToSpend} currency="₸" style={styles.balanceAmount} duration={1000} />
          <View style={styles.balanceRow}>
            <Text style={styles.balanceSub}>Потрачено: {formatMoney(spentToday)}</Text>
            <View style={styles.percentBadge}>
              <Text style={styles.percentText}>{Math.round(spentPercent)}%</Text>
            </View>
          </View>
          <View style={styles.progressWrap}>
            <View
              style={[
                styles.progressFill,
                { width: `${spentPercent}%` as any },
                spentPercent >= 90 && { backgroundColor: '#FFB347' },
              ]}
            />
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map((qa) => (
            <TouchableOpacity
              key={qa.label}
              style={styles.qaBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(qa.route as any); }}
              activeOpacity={0.75}
            >
              <View style={[styles.qaIcon, { backgroundColor: qa.color }]}>
                <Text style={{ fontSize: 18 }}>{qa.icon}</Text>
              </View>
              <Text style={styles.qaLabel}>{qa.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Safe to save card */}
        {profile && monthlyIncome > 0 && (
          <Card variant="success" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.savingsIcon}>
              <Text style={{ fontSize: 20 }}>🐷</Text>
            </View>
            <View>
              <Text style={styles.savingsLabel}>Можно безопасно отложить</Text>
              <CountUp
                value={Math.max(0, monthlyIncome * 0.2 - spentToday * 0.1)}
                currency="₸"
                style={styles.savingsAmount}
                duration={1300}
              />
            </View>
          </Card>
        )}

        {/* Recent transactions */}
        <Card>
          <Text style={styles.sectionTitle}>Последние операции</Text>
          {loading ? (
            <>
              <TransactionSkeleton />
              <TransactionSkeleton />
              <TransactionSkeleton />
            </>
          ) : expenses.slice(0, 5).length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>Операций пока нет.</Text>
              <Text style={styles.emptySubtext}>Добавьте первый расход или загрузите выписку.</Text>
            </View>
          ) : (
            expenses.slice(0, 5).map((expense) => (
              <TransactionRow key={expense.id} expense={expense} />
            ))
          )}
          {expenses.length > 5 && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/expenses')} style={styles.seeAll}>
              <Text style={styles.seeAllText}>Все операции →</Text>
            </TouchableOpacity>
          )}
        </Card>
      </Animated.View>
    </ScrollView>
  );
}

function TransactionRow({ expense }: { expense: Expense }) {
  const color = CATEGORY_COLORS[expense.category] ?? colors.muted;
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: color + '22' }]}>
        <Text style={{ fontSize: 16, color }}>{getCategoryEmoji(expense.category)}</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txName} numberOfLines={1}>
          {expense.merchant_name ?? CATEGORY_LABELS[expense.category]}
        </Text>
        <Text style={styles.txCat}>{CATEGORY_LABELS[expense.category]}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, expense.category === 'food_delivery' || expense.category === 'taxi' ? { color: colors.danger } : {}]}>
          −{formatMoney(expense.amount)}
        </Text>
        <Text style={styles.txDate}>{formatRelativeDate(expense.date)}</Text>
      </View>
    </View>
  );
}

function getCategoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    food_delivery: '🛵', groceries: '🛒', transport: '🚌',
    taxi: '🚗', entertainment: '🎬', subscriptions: '📱',
    cafe_restaurants: '☕', health: '💊', education: '📚',
    shopping: '🛍', utilities: '💡', housing: '🏠',
    debt_payment: '💳', savings: '🐷', family: '👨‍👩‍👧',
  };
  return map[cat] ?? '💰';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  dateLabel: { ...typography.caption, marginBottom: 2 },
  greeting: { ...typography.h3 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.softBlue,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '600', color: colors.accent },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.softYellow, borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: 12, padding: 12, marginBottom: 12,
  },
  alertIcon: { fontSize: 16 },
  alertText: { flex: 1, fontSize: 13, color: colors.text },
  alertAction: { fontSize: 14, color: '#B45309', fontWeight: '600' },
  balanceCard: {
    backgroundColor: colors.accent, borderRadius: 20, padding: 20, marginBottom: 12,
  },
  balanceLabel: { fontSize: 12, color: 'rgba(255,255,255,0.82)', marginBottom: 4 },
  balanceAmount: { fontSize: 32, fontWeight: '600', color: '#fff', letterSpacing: -0.5 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  balanceSub: { fontSize: 13, color: 'rgba(255,255,255,0.76)' },
  percentBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  percentText: { fontSize: 12, color: '#fff', fontWeight: '500' },
  progressWrap: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, height: 5, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.9)' },
  quickActions: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  qaBtn: {
    flex: 1, alignItems: 'center', gap: 6,
    backgroundColor: colors.card, borderRadius: 13,
    borderWidth: 1, borderColor: colors.border, paddingVertical: 12, paddingHorizontal: 4,
  },
  qaIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontSize: 11, fontWeight: '500', color: colors.text },
  savingsIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center',
  },
  savingsLabel: { fontSize: 12, color: '#14532D', marginBottom: 2 },
  savingsAmount: { fontSize: 20, fontWeight: '600', color: '#14532D' },
  sectionTitle: { ...typography.label, marginBottom: 12, textTransform: 'uppercase' },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  txIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txName: { fontSize: 14, fontWeight: '500', color: colors.text },
  txCat: { fontSize: 12, color: colors.muted, marginTop: 1 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontWeight: '500', color: colors.text },
  txDate: { fontSize: 11, color: colors.muted, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { ...typography.body, marginBottom: 4 },
  emptySubtext: { ...typography.bodySmall, textAlign: 'center' },
  seeAll: { paddingTop: 12, alignItems: 'center' },
  seeAllText: { fontSize: 13, fontWeight: '500', color: colors.accent },
});
