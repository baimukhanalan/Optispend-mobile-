import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { FinancialLeak, CATEGORY_LABELS, CATEGORY_COLORS } from '../../types';
import { Card } from '../../components/ui/Card';
import { CountUp } from '../../components/ui/CountUp';
import { CardSkeleton } from '../../components/ui/SkeletonLoader';
import { colors, typography } from '../../lib/theme';
import { formatMoney } from '../../lib/format';

const SEVERITY_CONFIG = {
  critical: { color: colors.danger, bg: '#FEE2E2', label: 'Критично' },
  high: { color: colors.danger, bg: '#FEE2E2', label: 'Высокий' },
  medium: { color: colors.warning, bg: colors.softYellow, label: 'Средний' },
  low: { color: colors.success, bg: colors.softGreen, label: 'Низкий' },
};

export default function LeaksScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [leaks, setLeaks] = useState<FinancialLeak[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLeaks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('financial_leaks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'detected')
      .order('total_amount', { ascending: false });
    setLeaks((data as FinancialLeak[]) ?? []);
  };

  useEffect(() => {
    setLoading(true);
    loadLeaks().finally(() => setLoading(false));
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaks();
    setRefreshing(false);
  };

  const totalLeak = leaks.reduce((s, l) => s + l.total_amount, 0);
  const totalSaveable = leaks.reduce((s, l) => s + l.estimated_savings, 0);

  const runDetection = async () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    await supabase.functions.invoke('detect-financial-leaks', { body: { user_id: user.id } });
    await loadLeaks();
    setLoading(false);
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
          <Text style={styles.title}>Утечки</Text>
          <Text style={styles.subtitle}>Находит, где деньги уходят незаметно</Text>
        </View>
        <TouchableOpacity style={styles.scanBtn} onPress={runDetection} activeOpacity={0.8}>
          <Text style={styles.scanBtnText}>🔍 Анализ</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <><CardSkeleton /><CardSkeleton /><CardSkeleton /></>
      ) : (
        <>
          {/* Total leak card */}
          {totalLeak > 0 && (
            <Animated.View entering={FadeInDown.duration(400)}>
              <Card variant="danger">
                <Text style={styles.totalLabel}>СУММАРНАЯ УТЕЧКА</Text>
                <CountUp value={totalLeak} currency="₸" style={styles.totalAmount} duration={800} />
                <Text style={styles.totalSub}>В месяц. Можно сократить на {formatMoney(totalSaveable)}.</Text>
              </Card>
            </Animated.View>
          )}

          {leaks.length === 0 ? (
            <Card>
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyTitle}>Серьёзных утечек не найдено</Text>
                <Text style={styles.emptySub}>Обновите анализ или добавьте больше операций.</Text>
              </View>
            </Card>
          ) : (
            <Card noPadding>
              {leaks.map((leak, i) => (
                <LeakRow key={leak.id} leak={leak} index={i} onPress={() => router.push({ pathname: '/leak-detail', params: { leakId: leak.id } })} />
              ))}
            </Card>
          )}
        </>
      )}

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Данные основаны на ваших операциях за текущий месяц. Не является финансовой консультацией.
        </Text>
      </View>
    </ScrollView>
  );
}

function LeakRow({ leak, index, onPress }: { leak: FinancialLeak; index: number; onPress: () => void }) {
  const sev = SEVERITY_CONFIG[leak.severity];
  const categoryColor = CATEGORY_COLORS[leak.category] ?? colors.muted;

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 80)}>
      <TouchableOpacity
        style={[styles.leakRow, index > 0 && styles.leakRowBorder]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <View style={[styles.severityDot, { backgroundColor: sev.color }]} />
        <View style={styles.leakInfo}>
          <Text style={styles.leakName}>{CATEGORY_LABELS[leak.category]}</Text>
          <Text style={styles.leakDesc}>{leak.transaction_count} операций · {leak.reason}</Text>
          <TouchableOpacity
            style={[styles.ruleBtn, { backgroundColor: sev.bg }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPress();
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.ruleBtnText, { color: sev.color }]}>+ Создать правило</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.leakRight}>
          <Text style={[styles.leakAmount, { color: sev.color }]}>{formatMoney(leak.total_amount)}</Text>
          <Text style={styles.leakMonth}>/мес</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { ...typography.h2 },
  subtitle: { ...typography.bodySmall, marginTop: 3 },
  scanBtn: {
    backgroundColor: colors.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10,
  },
  scanBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  totalLabel: { fontSize: 11, fontWeight: '600', color: '#991B1B', letterSpacing: 0.6, marginBottom: 4 },
  totalAmount: { fontSize: 28, fontWeight: '600', color: colors.danger, letterSpacing: -0.5 },
  totalSub: { fontSize: 13, color: '#DC2626', marginTop: 6 },
  leakRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
  leakRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  severityDot: { width: 7, height: 7, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  leakInfo: { flex: 1 },
  leakName: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 },
  leakDesc: { fontSize: 12, color: colors.muted, marginBottom: 7 },
  ruleBtn: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 7 },
  ruleBtnText: { fontSize: 11, fontWeight: '600' },
  leakRight: { alignItems: 'flex-end' },
  leakAmount: { fontSize: 14, fontWeight: '600' },
  leakMonth: { fontSize: 11, color: colors.muted, marginTop: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 28 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.secondary, textAlign: 'center' },
  disclaimer: { paddingVertical: 12 },
  disclaimerText: { fontSize: 11, color: colors.muted, textAlign: 'center', lineHeight: 16 },
});
