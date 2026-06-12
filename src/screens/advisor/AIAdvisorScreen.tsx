import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { AIAdvice, CATEGORY_LABELS } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, typography } from '../../lib/theme';
import { formatMoney } from '../../lib/format';

export default function AIAdvisorScreen() {
  const { user, profile } = useAuthStore();
  const [advice, setAdvice] = useState<AIAdvice | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadAdvice = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();
    if (data) setAdvice(data as AIAdvice);
  };

  useEffect(() => {
    setLoading(true);
    loadAdvice().finally(() => setLoading(false));
  }, [user]);

  const generate = async () => {
    if (!user) return;
    setGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-advice', {
        body: { user_id: user.id },
      });
      if (error) throw error;
      if (data) setAdvice(data as AIAdvice);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.aiIcon}>
          <Text style={{ fontSize: 20 }}>🧠</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>AI Советник</Text>
          <Text style={styles.sub}>
            {advice ? `Обновлено ${new Date(advice.generated_at).toLocaleDateString('ru-KZ')}` : 'Готов к анализу'}
          </Text>
        </View>
        <Button
          onPress={generate}
          label={generating ? '...' : '↻ Обновить'}
          variant="secondary"
          size="sm"
          loading={generating}
        />
      </View>

      {!advice ? (
        <Card>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💡</Text>
            <Text style={styles.emptyTitle}>Запустите анализ</Text>
            <Text style={styles.emptySub}>AI проанализирует ваши расходы и даст конкретные рекомендации с цифрами.</Text>
            <Button onPress={generate} label="Запустить анализ" loading={generating} style={{ marginTop: 16, width: '100%' }} />
          </View>
        </Card>
      ) : (
        <>
          {/* Main conclusion */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <Card variant="danger" style={{ borderLeftWidth: 3, borderLeftColor: colors.danger, borderRadius: 0, borderTopRightRadius: 16, borderBottomRightRadius: 16 }}>
              <View style={styles.labelRow}>
                <View style={[styles.label, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.labelText, { color: '#991B1B' }]}>⚠ Главный вывод</Text>
                </View>
              </View>
              <Text style={styles.conclusionText}>{advice.main_conclusion}</Text>
            </Card>
          </Animated.View>

          {/* Top leaks */}
          <Animated.View entering={FadeInDown.duration(400).delay(80)}>
            <Card>
              <View style={styles.labelRow}>
                <View style={[styles.label, { backgroundColor: colors.softYellow }]}>
                  <Text style={[styles.labelText, { color: '#92400E' }]}>📈 Топ-3 утечки</Text>
                </View>
              </View>
              {advice.top_leaks.map((leak, i) => (
                <View key={i} style={styles.leakRow}>
                  <Text style={styles.leakCat}>{CATEGORY_LABELS[leak.category]}</Text>
                  <Text style={[styles.leakAmt, { color: i === 0 ? colors.danger : colors.warning }]}>
                    {formatMoney(leak.amount)}
                  </Text>
                </View>
              ))}
            </Card>
          </Animated.View>

          {/* What to cut */}
          <Animated.View entering={FadeInDown.duration(400).delay(160)}>
            <Card>
              <View style={styles.labelRow}>
                <View style={[styles.label, { backgroundColor: colors.softYellow }]}>
                  <Text style={[styles.labelText, { color: '#92400E' }]}>✂ На этой неделе сократить</Text>
                </View>
              </View>
              <Text style={styles.bodyText}>{advice.what_to_cut_this_week}</Text>
            </Card>
          </Animated.View>

          {/* Safe to save */}
          <Animated.View entering={FadeInDown.duration(400).delay(240)}>
            <Card variant="success">
              <View style={styles.labelRow}>
                <View style={[styles.label, { backgroundColor: '#BBF7D0' }]}>
                  <Text style={[styles.labelText, { color: '#14532D' }]}>🐷 Безопасно отложить</Text>
                </View>
              </View>
              <Text style={styles.saveAmount}>{formatMoney(advice.safe_to_save)}</Text>
              <Text style={styles.saveNote}>При сокращении выявленных утечек.</Text>
            </Card>
          </Animated.View>

          {/* Debt advice */}
          <Animated.View entering={FadeInDown.duration(400).delay(320)}>
            <Card>
              <View style={styles.labelRow}>
                <View style={[styles.label, { backgroundColor: colors.softBlue }]}>
                  <Text style={[styles.labelText, { color: '#1E3A8A' }]}>💳 Долги</Text>
                </View>
              </View>
              <Text style={styles.bodyText}>{advice.debt_advice}</Text>
            </Card>
          </Animated.View>

          {/* Investment */}
          {advice.investment_advice && (
            <Animated.View entering={FadeInDown.duration(400).delay(400)}>
              <Card>
                <View style={styles.labelRow}>
                  <View style={[styles.label, { backgroundColor: advice.can_invest ? '#BBF7D0' : '#FEE2E2' }]}>
                    <Text style={[styles.labelText, { color: advice.can_invest ? '#14532D' : '#991B1B' }]}>
                      {advice.can_invest ? '📈 Инвестиции' : '🚫 Инвестиции'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.bodyText}>{advice.investment_advice}</Text>
              </Card>
            </Animated.View>
          )}

          {/* Cannot do */}
          <Animated.View entering={FadeInDown.duration(400).delay(480)}>
            <Card variant="danger">
              <View style={styles.labelRow}>
                <View style={[styles.label, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.labelText, { color: '#991B1B' }]}>🚫 Нельзя делать</Text>
                </View>
              </View>
              {advice.forbidden_actions.map((action, i) => (
                <View key={i} style={styles.forbidRow}>
                  <Text style={styles.forbidX}>✕</Text>
                  <Text style={styles.forbidText}>{action}</Text>
                </View>
              ))}
            </Card>
          </Animated.View>

          <Text style={styles.disclaimer}>{advice.disclaimer}</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  aiIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  title: { ...typography.h3 },
  sub: { ...typography.caption, marginTop: 2 },
  labelRow: { marginBottom: 8 },
  label: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  labelText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  conclusionText: { fontSize: 14, color: colors.text, lineHeight: 21 },
  leakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  leakCat: { fontSize: 14, color: colors.text },
  leakAmt: { fontSize: 14, fontWeight: '600' },
  bodyText: { fontSize: 14, color: colors.text, lineHeight: 21 },
  saveAmount: { fontSize: 26, fontWeight: '600', color: '#15803D', letterSpacing: -0.5, marginVertical: 2 },
  saveNote: { fontSize: 13, color: '#166534' },
  forbidRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 6 },
  forbidX: { fontSize: 13, color: colors.danger, marginTop: 2 },
  forbidText: { fontSize: 13, color: colors.text, flex: 1 },
  disclaimer: { fontSize: 11, color: colors.muted, textAlign: 'center', paddingVertical: 16, lineHeight: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { ...typography.h4, marginBottom: 8 },
  emptySub: { ...typography.bodySmall, textAlign: 'center', lineHeight: 20 },
});
