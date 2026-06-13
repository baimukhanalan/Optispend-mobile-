import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Rect, Line, Circle } from 'react-native-svg';

const MAX_CONTENT_W = 680;
import { colors, type as t, radius, shadow, spacing } from '../../lib/theme';
import { formatMoney, formatRelativeDate } from '../../lib/format';
import { useAuthStore } from '../../store/auth';
import { useExpensesStore } from '../../store/expenses';
import { useT, useLangStore } from '../../lib/i18n';
import { CATEGORY_LABELS, Expense } from '../../types';

// ─── Quick action icons ───────────────────────────────────────────────────────
const PlusIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke={colors.accent} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const CameraIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
      stroke={colors.success} strokeWidth={1.6} strokeLinejoin="round" />
    <Circle cx={12} cy={13} r={4} stroke={colors.success} strokeWidth={1.6} />
  </Svg>
);
const FileIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
      stroke={colors.warning} strokeWidth={1.6} strokeLinejoin="round" />
    <Line x1="9" y1="13" x2="15" y2="13" stroke={colors.warning} strokeWidth={1.6} strokeLinecap="round" />
    <Line x1="9" y1="17" x2="13" y2="17" stroke={colors.warning} strokeWidth={1.6} strokeLinecap="round" />
  </Svg>
);
const ChartIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="20" height="20" rx="3" stroke={colors.danger} strokeWidth={1.6} />
    <Path d="M7 16l4-5 3 3 4-6" stroke={colors.danger} strokeWidth={1.6}
      strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Category dot colors ──────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  food_delivery: '#EF4444', groceries: '#22C55E', transport: '#3B82F6',
  taxi: '#8B5CF6', entertainment: '#EC4899', subscriptions: '#0EA5E9',
  cafe_restaurants: '#F59E0B', health: '#14B8A6', education: '#6366F1',
  shopping: '#F97316', utilities: '#84CC16', housing: '#06B6D4',
  debt_payment: '#EF4444', savings: '#10B981', family: '#8B5CF6',
};

const LOCALE_MAP: Record<string, string> = { ru: 'ru-KZ', kk: 'kk-KZ', en: 'en-KZ' };

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const router   = useRouter();
  const T        = useT();
  const { lang } = useLangStore();
  const { width: W } = useWindowDimensions();
  const insets   = useSafeAreaInsets();
  const { user, profile } = useAuthStore();
  const { expenses, todayExpenses, loading, fetchExpenses, fetchDailySnapshot, getSafeToSpend } = useExpensesStore();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (user) {
      fetchExpenses(user.id);
      fetchDailySnapshot(user.id);
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 360, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 360, useNativeDriver: true }),
    ]).start();
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user) await Promise.all([fetchExpenses(user.id), fetchDailySnapshot(user.id)]);
    setRefreshing(false);
  }, [user]);

  const monthlyIncome  = profile?.monthly_income ?? 0;
  const monthlyFixed   = profile?.monthly_fixed_expenses ?? 0;
  const safeToSpend    = getSafeToSpend(monthlyIncome, monthlyFixed);
  const spentToday     = todayExpenses.reduce((s, e) => s + e.amount, 0);
  const dailyBudget    = monthlyIncome > 0 ? (monthlyIncome - monthlyFixed) / 30 : 0;
  const spentPercent   = dailyBudget > 0 ? Math.min((spentToday / dailyBudget) * 100, 100) : 0;

  const firstName = user?.full_name?.split(' ')[0] ?? (lang === 'en' ? 'User' : lang === 'kk' ? 'Пайдаланушы' : 'Пользователь');
  const initials  = user?.full_name
    ?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '--';

  const today   = new Date();
  const locale  = LOCALE_MAP[lang] ?? 'ru-KZ';
  const dateStr = today.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });

  const recentExpenses = expenses.slice(0, 6);
  const contentW = Math.min(W, MAX_CONTENT_W);
  const topPad   = Math.max(16, insets.top);

  const quickActions = [
    { label: T.qa_add,       bg: colors.accentLight,  Icon: PlusIcon,   route: '/add-expense' },
    { label: T.qa_receipt,   bg: colors.successLight, Icon: CameraIcon, route: '/receipt-scanner' },
    { label: T.qa_statement, bg: colors.warningLight, Icon: FileIcon,   route: '/statement-import' },
    { label: T.qa_report,    bg: colors.dangerLight,  Icon: ChartIcon,  route: '/(tabs)/reports' },
  ];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { alignItems: 'center', paddingTop: topPad }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], width: contentW }}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateLabel}>{dateStr}</Text>
            <Text style={styles.greeting}>{T.greet}, {firstName}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push('/settings')}
            activeOpacity={0.75}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Overspend warning ── */}
        {spentPercent >= 90 && (
          <View style={styles.alertBanner}>
            <View style={styles.alertDot} />
            <Text style={styles.alertText}>{T.alert_limit}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/leaks')}>
              <Text style={styles.alertLink}>{T.alert_details}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Balance card ── */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceSuperLabel}>{T.spend_today_label}</Text>
          <Text style={styles.balanceAmount}>
            {formatMoney(safeToSpend)}
          </Text>

          <View style={styles.progressWrap}>
            <View style={[styles.progressFill, {
              width: `${spentPercent}%` as any,
              backgroundColor: spentPercent >= 90
                ? 'rgba(251,191,36,0.9)'
                : 'rgba(255,255,255,0.85)',
            }]} />
          </View>

          <View style={styles.balanceMeta}>
            <Text style={styles.balanceMetaText}>
              {T.spent} {formatMoney(spentToday)}
            </Text>
            <Text style={styles.balanceMetaText}>
              {Math.round(spentPercent)}{T.of_limit}
            </Text>
          </View>
        </View>

        {/* ── Quick actions ── */}
        <View style={styles.quickRow}>
          {quickActions.map(({ label, bg, Icon, route }) => (
            <TouchableOpacity
              key={label}
              style={[styles.qaCard, { backgroundColor: bg }]}
              onPress={() => router.push(route as any)}
              activeOpacity={0.75}
            >
              <View style={styles.qaIconWrap}><Icon /></View>
              <Text style={styles.qaLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Monthly savings callout ── */}
        {monthlyIncome > 0 && (
          <View style={styles.savingsCard}>
            <View>
              <Text style={styles.savingsLabel}>{T.safe_save_label}</Text>
              <Text style={styles.savingsAmount}>
                {formatMoney(Math.max(0, monthlyIncome * 0.2 - spentToday * 0.1))}
              </Text>
            </View>
            <View style={styles.savingsTag}>
              <Text style={styles.savingsTagText}>{T.safe_save_tag}</Text>
            </View>
          </View>
        )}

        {/* ── Recent transactions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{T.recent_title}</Text>
          {loading ? (
            <View style={styles.skeleton}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.skeletonRow}>
                  <View style={styles.skeletonDot} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={[styles.skeletonLine, { width: '60%' }]} />
                    <View style={[styles.skeletonLine, { width: '35%', opacity: 0.5 }]} />
                  </View>
                  <View style={[styles.skeletonLine, { width: 60 }]} />
                </View>
              ))}
            </View>
          ) : recentExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{T.empty_title}</Text>
              <Text style={styles.emptyBody}>{T.empty_body}</Text>
            </View>
          ) : (
            recentExpenses.map((expense) => (
              <TransactionRow key={expense.id} expense={expense} />
            ))
          )}
          {expenses.length > 6 && (
            <TouchableOpacity style={styles.seeAll} onPress={() => router.push('/(tabs)/reports')}>
              <Text style={styles.seeAllText}>{T.see_all}</Text>
            </TouchableOpacity>
          )}
        </View>

      </Animated.View>
    </ScrollView>
  );
}

// ─── Transaction row ──────────────────────────────────────────────────────────
function TransactionRow({ expense }: { expense: Expense }) {
  const dot = CAT_COLORS[expense.category] ?? colors.muted;
  return (
    <View style={styles.txRow}>
      <View style={[styles.txDot, { backgroundColor: dot + '22', borderColor: dot + '44' }]}>
        <View style={[styles.txDotInner, { backgroundColor: dot }]} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txName} numberOfLines={1}>
          {expense.merchant_name ?? CATEGORY_LABELS[expense.category]}
        </Text>
        <Text style={styles.txCat}>{CATEGORY_LABELS[expense.category]}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={styles.txAmount}>−{formatMoney(expense.amount)}</Text>
        <Text style={styles.txDate}>{formatRelativeDate(expense.date)}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 110 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  dateLabel: { ...t.sm, color: colors.muted, textTransform: 'capitalize', marginBottom: 2 },
  greeting:  { ...t.h2, color: colors.text },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.accentLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.accent + '30',
  },
  avatarText: { ...t.smMd, color: colors.accent },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.warningLight,
    borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 14,
    marginBottom: 14, borderWidth: 1, borderColor: '#FDE68A',
  },
  alertDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.warning },
  alertText: { ...t.sm, flex: 1, color: '#92400E' },
  alertLink: { ...t.smMd, color: colors.warning },

  balanceCard: {
    backgroundColor: colors.accent,
    borderRadius: radius.xl, padding: 22, marginBottom: 14, ...shadow.md,
  },
  balanceSuperLabel: { ...t.xsMd, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5, marginBottom: 10 },
  balanceAmount:     { ...t.d2, color: '#FFFFFF', marginBottom: 18 },
  progressWrap:      { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.full, height: 4, overflow: 'hidden', marginBottom: 10 },
  progressFill:      { height: '100%', borderRadius: radius.full },
  balanceMeta:       { flexDirection: 'row', justifyContent: 'space-between' },
  balanceMetaText:   { ...t.sm, color: 'rgba(255,255,255,0.65)' },

  quickRow:   { flexDirection: 'row', gap: 8, marginBottom: 14 },
  qaCard:     { flex: 1, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center', gap: 7 },
  qaIconWrap: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  qaLabel:    { ...t.xs, color: colors.secondary },

  savingsCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 14, borderWidth: 1, borderColor: colors.border, ...shadow.xs,
  },
  savingsLabel:   { ...t.sm, color: colors.secondary, marginBottom: 3 },
  savingsAmount:  { ...t.h3, color: colors.success },
  savingsTag:     { backgroundColor: colors.successLight, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5 },
  savingsTagText: { ...t.xsMd, color: colors.success },

  section:      { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadow.xs },
  sectionTitle: { ...t.h4, color: colors.text, marginBottom: 16 },

  txRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  txDot:      { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  txDotInner: { width: 10, height: 10, borderRadius: 5 },
  txInfo:     { flex: 1 },
  txName:     { ...t.bodyMd, color: colors.text },
  txCat:      { ...t.sm, color: colors.muted, marginTop: 1 },
  txRight:    { alignItems: 'flex-end' },
  txAmount:   { ...t.bodyMd, color: colors.text },
  txDate:     { ...t.xs, color: colors.muted, marginTop: 2 },

  emptyState: { paddingVertical: 28, alignItems: 'center' },
  emptyTitle: { ...t.h4, color: colors.secondary, marginBottom: 6 },
  emptyBody:  { ...t.sm, color: colors.muted, textAlign: 'center', maxWidth: 220 },

  skeleton:    { gap: 0 },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  skeletonDot: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surfaceAlt },
  skeletonLine: { height: 10, borderRadius: 5, backgroundColor: colors.surfaceAlt },

  seeAll:     { paddingTop: 14, alignItems: 'center' },
  seeAllText: { ...t.smMd, color: colors.accent },
});
