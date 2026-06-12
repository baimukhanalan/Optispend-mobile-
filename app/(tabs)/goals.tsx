import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/auth';
import { Goal } from '../../src/types';
import { Card } from '../../src/components/ui/Card';
import { ProgressRing } from '../../src/components/ui/ProgressRing';
import { CardSkeleton } from '../../src/components/ui/SkeletonLoader';
import { colors, typography } from '../../src/lib/theme';
import { formatMoney, formatDate } from '../../src/lib/format';

const GOAL_EMOJIS: Record<string, string> = {
  emergency_fund: '🛡',
  vacation: '✈️',
  real_estate: '🏠',
  education: '📚',
  car: '🚗',
  business: '💼',
  retirement: '🌅',
  other: '🎯',
};

export default function GoalsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGoals = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('priority', { ascending: true });
    setGoals((data as Goal[]) ?? []);
  };

  useEffect(() => {
    setLoading(true);
    loadGoals().finally(() => setLoading(false));
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Цели</Text>
          <Text style={styles.subtitle}>{goals.length} активных</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/goal-detail' as any)} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ Добавить</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <><CardSkeleton /><CardSkeleton /></>
      ) : goals.length === 0 ? (
        <Card>
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>Цели не заданы</Text>
            <Text style={styles.emptySub}>Добавьте первую цель — накопления, отпуск, резервный фонд.</Text>
          </View>
        </Card>
      ) : (
        goals.map((goal, i) => (
          <Animated.View key={goal.id} entering={FadeInDown.duration(400).delay(i * 80)}>
            <GoalCard goal={goal} onPress={() => router.push({ pathname: '/goal-detail', params: { goalId: goal.id } } as any)} />
          </Animated.View>
        ))
      )}
    </ScrollView>
  );
}

function GoalCard({ goal, onPress }: { goal: Goal; onPress: () => void }) {
  const percent = goal.target_amount > 0
    ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    : 0;

  const monthsLeft = goal.monthly_contribution && goal.monthly_contribution > 0
    ? Math.ceil((goal.target_amount - goal.current_amount) / goal.monthly_contribution)
    : null;

  const emoji = GOAL_EMOJIS[goal.category] ?? '🎯';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card>
        <View style={styles.goalHeader}>
          <View style={styles.goalLeft}>
            <View style={styles.goalEmoji}>
              <Text style={{ fontSize: 22 }}>{emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.goalName}>{goal.name}</Text>
              {goal.description && (
                <Text style={styles.goalDesc} numberOfLines={1}>{goal.description}</Text>
              )}
            </View>
          </View>
          <ProgressRing
            percent={percent}
            size={64}
            strokeWidth={5}
            color={colors.accent}
            label={`${Math.round(percent)}%`}
            sublabel="готово"
          />
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percent}%` as any }]} />
        </View>

        <View style={styles.goalFooter}>
          <View>
            <Text style={styles.footerLabel}>Накоплено</Text>
            <Text style={styles.footerValue}>{formatMoney(goal.current_amount)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.footerLabel}>Цель</Text>
            <Text style={styles.footerValue}>{formatMoney(goal.target_amount)}</Text>
          </View>
        </View>

        {monthsLeft !== null && monthsLeft > 0 && (
          <View style={styles.monthsLeft}>
            <Text style={styles.monthsText}>
              При взносе {formatMoney(goal.monthly_contribution ?? 0)}/мес — ещё {monthsLeft} мес.
            </Text>
          </View>
        )}

        {goal.target_date && (
          <View style={styles.deadline}>
            <Text style={styles.deadlineText}>Срок: {formatDate(goal.target_date)}</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { ...typography.h2 },
  subtitle: { ...typography.bodySmall, marginTop: 3 },
  addBtn: { backgroundColor: colors.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  goalLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 12 },
  goalEmoji: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.softBlue, alignItems: 'center', justifyContent: 'center',
  },
  goalName: { fontSize: 15, fontWeight: '600', color: colors.text },
  goalDesc: { fontSize: 12, color: colors.muted, marginTop: 2 },
  progressBar: { backgroundColor: colors.border, borderRadius: 6, height: 7, marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6, backgroundColor: colors.accent },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  footerLabel: { fontSize: 11, color: colors.muted },
  footerValue: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 2 },
  monthsLeft: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 12, paddingTop: 10 },
  monthsText: { fontSize: 13, color: colors.secondary },
  deadline: { marginTop: 4 },
  deadlineText: { fontSize: 12, color: colors.muted },
  empty: { alignItems: 'center', paddingVertical: 28 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.secondary, textAlign: 'center', lineHeight: 20 },
});
