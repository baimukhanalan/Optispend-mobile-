import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { formatMoney, formatDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

type ImportedTransaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  merchant_name: string | null;
  is_expense: boolean;
};

const CATEGORY_EMOJIS: Record<string, string> = {
  food_groceries: '🛒',
  food_delivery: '🛵',
  cafe_restaurants: '☕',
  transport: '🚌',
  taxi: '🚕',
  utilities: '💡',
  rent: '🏠',
  healthcare: '💊',
  education: '📚',
  subscriptions: '📱',
  entertainment: '🎬',
  shopping: '🛍️',
  sports: '🏃',
  kids: '👶',
  debt_payment: '💳',
  other: '📦',
};

export default function StatementPreviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<ImportedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTransactions();
  }, [id]);

  const loadTransactions = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('imported_transactions')
      .select('*')
      .eq('statement_id', id)
      .eq('is_expense', true)
      .order('date', { ascending: false });

    if (!error && data) {
      setTransactions(data);
      setSelected(new Set(data.map((t: ImportedTransaction) => t.id)));
    }
    setLoading(false);
  };

  const toggleSelect = (txId: string) => {
    Haptics.selectionAsync();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(txId)) next.delete(txId);
      else next.add(txId);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(transactions.map((t) => t.id)));
  const deselectAll = () => setSelected(new Set());

  const confirmImport = async () => {
    if (selected.size === 0) {
      Alert.alert('Ничего не выбрано', 'Выберите хотя бы одну транзакцию');
      return;
    }
    if (!user) return;
    setImporting(true);

    try {
      const toImport = transactions.filter((t) => selected.has(t.id));
      const expenses = toImport.map((t) => ({
        user_id: user.id,
        amount: Math.abs(t.amount),
        description: t.description,
        category: t.category,
        merchant_name: t.merchant_name,
        date: t.date,
        source: 'statement',
        imported_transaction_id: t.id,
      }));

      const { error } = await supabase.from('expenses').insert(expenses);
      if (error) throw error;

      // Mark transactions as imported
      await supabase
        .from('imported_transactions')
        .update({ is_imported: true })
        .in('id', Array.from(selected));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Готово', `Импортировано ${expenses.length} операций`, [
        { text: 'OK', onPress: () => router.push('/(tabs)/') },
      ]);
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Не удалось импортировать');
    } finally {
      setImporting(false);
    }
  };

  const renderItem = ({ item }: { item: ImportedTransaction }) => {
    const isSelected = selected.has(item.id);
    const emoji = CATEGORY_EMOJIS[item.category] || '📦';
    return (
      <TouchableOpacity
        style={[styles.txRow, !isSelected && styles.txRowDeselected]}
        onPress={() => toggleSelect(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkboxMark}>✓</Text>}
        </View>
        <Text style={styles.txEmoji}>{emoji}</Text>
        <View style={styles.txInfo}>
          <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.txDate}>{formatDate(item.date)}</Text>
        </View>
        <Text style={[styles.txAmount, !isSelected && { color: theme.colors.secondary }]}>
          -{formatMoney(Math.abs(item.amount))}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Транзакции</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonLoader key={i} width="100%" height={60} style={{ marginBottom: 8 }} />
          ))}
        </View>
      ) : (
        <>
          <View style={styles.controls}>
            <Text style={styles.controlsText}>
              Выбрано: {selected.size} из {transactions.length}
            </Text>
            <View style={styles.controlsBtns}>
              <TouchableOpacity onPress={selectAll}>
                <Text style={styles.controlBtn}>Все</Text>
              </TouchableOpacity>
              <Text style={styles.controlsSep}>·</Text>
              <TouchableOpacity onPress={deselectAll}>
                <Text style={styles.controlBtn}>Снять</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Расходы не найдены в выписке</Text>
              </View>
            }
          />

          <View style={styles.footer}>
            <Button
              label={`Импортировать ${selected.size} операций`}
              onPress={confirmImport}
              loading={importing}
              disabled={selected.size === 0}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: { ...theme.typography.h3, color: theme.colors.text },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 20, color: theme.colors.secondary },
  loadingContainer: { padding: theme.spacing.lg },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  controlsText: { ...theme.typography.caption, color: theme.colors.secondary },
  controlsBtns: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'center' },
  controlBtn: { ...theme.typography.caption, color: theme.colors.accent, fontWeight: '600' },
  controlsSep: { color: theme.colors.border },
  listContent: { padding: theme.spacing.md, gap: theme.spacing.sm, paddingBottom: 100 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  txRowDeselected: { opacity: 0.5 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  checkboxMark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  txEmoji: { fontSize: 20 },
  txInfo: { flex: 1 },
  txDesc: { ...theme.typography.body, color: theme.colors.text, fontWeight: '500' },
  txDate: { ...theme.typography.caption, color: theme.colors.secondary, marginTop: 2 },
  txAmount: { ...theme.typography.body, color: theme.colors.danger, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { ...theme.typography.body, color: theme.colors.secondary },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    paddingBottom: 34,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
