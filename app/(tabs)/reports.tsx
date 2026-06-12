import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/auth';
import { WeeklyReport, CATEGORY_LABELS } from '../../src/types';
import { Card } from '../../src/components/ui/Card';
import { CountUp } from '../../src/components/ui/CountUp';
import { CardSkeleton } from '../../src/components/ui/SkeletonLoader';
import { colors, typography } from '../../src/lib/theme';
import { formatMoney, formatDate } from '../../src/lib/format';

export default function ReportsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const loadReport = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(1)
      .single();
    if (data) setReport(data as WeeklyReport);
  };

  useEffect(() => {
    setLoading(true);
    loadReport().finally(() => setLoading(false));
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReport();
    setRefreshing(false);
  };

  const generateReport = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data } = await supabase.functions.invoke('generate-weekly-report', {
        body: { user_id: user.id },
      });
      if (data) setReport(data as WeeklyReport);
    } finally {
      setGenerating(false);
    }
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
          <Text style={styles.title}>Отчёты</Text>
          <Text style={styles.subtitle}>Еженедельный финансовый анализ</Text>
        </View>
        <TouchableOpacity
          style={[styles.generateBtn, generating && { opacity: 0.6 }]}
          onPress={generateReport}
          disabled={generating}
          activeOpacity={0.8}
        >
          <Text style={styles.generateBtnText}>{generating ? '...' : '↻ Создать'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <><CardSkeleton /><CardSkeleton /><CardSkeleton /></>
      ) : !report ? (
        <Card>
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>Отчёт ещё не готов</Text>
            <Text style={styles.emptySub}>Нажмите «Создать», чтобы сгенерировать недельный отчёт на основе ваших операций.</Text>
            <TouchableOpacity style={styles.createBtn} onPress={generateReport} activeOpacity={0.8}>
              <Text style={styles.createBtnText}>Создать отчёт</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ) : (
        <>
          <Animated.View entering={FadeInDown.duration(350)}>
            <View style={styles.periodHeader}>
              <Text style={styles.period}>
                {formatDate(report.week_start)} — {formatDate(report.week_end)}
              </Text>
            </View>

            {/* Summary */}
            <Card>
              <Text style={styles.sectionTitle}>Итого</Text>
              {[
                { label: 'Доход', value: report.total_income, good: true },
                { label: 'Расходы', value: report.total_expenses, good: false },
                { label: 'Остаток', value: report.total_income - report.total_expenses },
                { label: 'Можно отложить', value: report.savings_amount, good: true },
              ].map(({ label, value, good }) => (
                <View key={label} style={styles.statRow}>
                  <Text style={styles.statLabel}>{label}</Text>
                  <Text style={[
                    styles.statValue,
                    good === true && { color: colors.success },
                    good === false && { color: colors.danger },
                  ]}>
                    {formatMoney(value)}
                  </Text>
                </View>
              ))}
            </Card>

            {/* Savings rate */}
            {report.savings_rate !== undefined && (
              <Card variant={report.savings_rate >= 20 ? 'success' : report.savings_rate >= 10 ? 'default' : 'danger'}>
                <Text style={styles.sectionTitle}>Норма сбережений</Text>
                <Text style={[styles.bigNumber, { color: report.savings_rate >= 20 ? colors.success : report.savings_rate >= 10 ? colors.text : colors.danger }]}>
                  {report.savings_rate.toFixed(1)}%
                </Text>
                <Text style={styles.bigSubtext}>
                  {report.savings_rate >= 20
                    ? 'Отлично. Продолжайте в том же духе.'
                    : report.savings_rate >= 10
                    ? 'Неплохо, но есть резерв для роста.'
                    : 'Норма сбережений ниже нормы. Нужно сократить расходы.'}
                </Text>
              </Card>
            )}

            {/* Top categories */}
            {(report.top_categories as any[])?.length > 0 && (
              <Card>
                <Text style={styles.sectionTitle}>Топ категорий</Text>
                {(report.top_categories as any[]).slice(0, 5).map((cat: any, i: number) => (
                  <View key={i} style={styles.catRow}>
                    <View style={styles.catLeft}>
                      <Text style={styles.catName}>{CATEGORY_LABELS[cat.category as keyof typeof CATEGORY_LABELS] ?? cat.category}</Text>
                    </View>
                    <Text style={[styles.catAmount, ['food_delivery', 'taxi'].includes(cat.category) && { color: colors.danger }]}>
                      {formatMoney(cat.amount)}
                    </Text>
                  </View>
                ))}
              </Card>
            )}

            {/* AI Summary */}
            {report.ai_summary && (
              <Card variant="soft">
                <Text style={styles.sectionTitle}>AI Вывод</Text>
                <Text style={styles.aiText}>{report.ai_summary}</Text>
              </Card>
            )}

            {/* Main leak */}
            {report.main_leak_id && (
              <Card variant="danger">
                <Text style={styles.sectionTitle}>Главная утечка недели</Text>
                <Text style={styles.leakText}>Обнаружена крупная статья расходов.</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/leaks')} style={styles.leakLink}>
                  <Text style={styles.leakLinkText}>Посмотреть →</Text>
                </TouchableOpacity>
              </Card>
            )}

            {/* Reduction plan */}
            {(report.reduction_plan as string[])?.length > 0 && (
              <Card>
                <Text style={styles.sectionTitle}>План на следующую неделю</Text>
                {(report.reduction_plan as string[]).map((item, i) => (
                  <View key={i} style={styles.planRow}>
                    <Text style={styles.planCheck}>✓</Text>
                    <Text style={styles.planText}>{item}</Text>
                  </View>
                ))}
              </Card>
            )}
          </Animated.View>

          <Text style={styles.disclaimer}>Не является финансовой консультацией. Только для информационных целей.</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { ...typography.h2 },
  subtitle: { ...typography.bodySmall, marginTop: 3 },
  generateBtn: { backgroundColor: colors.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  generateBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  periodHeader: { marginBottom: 12 },
  period: { fontSize: 14, color: colors.secondary, fontWeight: '500' },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: colors.muted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  statLabel: { fontSize: 14, color: colors.secondary },
  statValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  bigNumber: { fontSize: 36, fontWeight: '700', letterSpacing: -0.5 },
  bigSubtext: { fontSize: 13, color: colors.secondary, marginTop: 4 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  catLeft: { flex: 1 },
  catName: { fontSize: 14, color: colors.text },
  catAmount: { fontSize: 14, fontWeight: '600', color: colors.text },
  aiText: { fontSize: 14, color: colors.text, lineHeight: 22 },
  leakText: { fontSize: 14, color: '#DC2626' },
  leakLink: { marginTop: 10 },
  leakLinkText: { fontSize: 14, fontWeight: '600', color: colors.danger },
  planRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 8 },
  planCheck: { fontSize: 13, color: colors.success, marginTop: 2 },
  planText: { fontSize: 14, color: colors.text, flex: 1, lineHeight: 20 },
  empty: { alignItems: 'center', paddingVertical: 24 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.secondary, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  createBtn: { backgroundColor: colors.accent, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  createBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  disclaimer: { fontSize: 11, color: colors.muted, textAlign: 'center', paddingVertical: 12, lineHeight: 16 },
});
