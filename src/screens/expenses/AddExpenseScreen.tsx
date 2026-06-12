import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { theme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { useExpensesStore } from '@/store/expenses';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ExpenseCategory, CATEGORY_META } from '@/types';

const schema = z.object({
  amount: z
    .string()
    .min(1, 'Укажите сумму')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Сумма должна быть больше 0'),
  description: z.string().min(1, 'Укажите описание').max(200),
  category: z.string().min(1, 'Выберите категорию'),
  merchant_name: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const CATEGORIES: { key: ExpenseCategory; label: string; emoji: string; color: string }[] = [
  { key: 'food_groceries', label: 'Продукты', emoji: '🛒', color: '#22C55E' },
  { key: 'food_delivery', label: 'Доставка', emoji: '🛵', color: '#EF4444' },
  { key: 'cafe_restaurants', label: 'Кафе', emoji: '☕', color: '#F59E0B' },
  { key: 'transport', label: 'Транспорт', emoji: '🚌', color: '#3B82F6' },
  { key: 'taxi', label: 'Такси', emoji: '🚕', color: '#8B5CF6' },
  { key: 'utilities', label: 'Коммунальные', emoji: '💡', color: '#06B6D4' },
  { key: 'rent', label: 'Аренда', emoji: '🏠', color: '#64748B' },
  { key: 'healthcare', label: 'Здоровье', emoji: '💊', color: '#EC4899' },
  { key: 'education', label: 'Образование', emoji: '📚', color: '#6366F1' },
  { key: 'subscriptions', label: 'Подписки', emoji: '📱', color: '#F97316' },
  { key: 'entertainment', label: 'Развлечения', emoji: '🎬', color: '#14B8A6' },
  { key: 'shopping', label: 'Шопинг', emoji: '🛍️', color: '#FB923C' },
  { key: 'sports', label: 'Спорт', emoji: '🏃', color: '#84CC16' },
  { key: 'kids', label: 'Дети', emoji: '👶', color: '#FDE68A' },
  { key: 'debt_payment', label: 'Долги', emoji: '💳', color: '#FCA5A5' },
  { key: 'other', label: 'Другое', emoji: '📦', color: '#94A3B8' },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const { addExpense } = useExpensesStore();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: params.amount ? String(params.amount) : '',
      description: params.description ? String(params.description) : '',
      category: params.category ? String(params.category) : '',
      merchant_name: params.merchant_name ? String(params.merchant_name) : '',
      notes: '',
    },
  });

  const selectedCategory = watch('category');

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const { data: expense, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          amount: Number(data.amount),
          description: data.description,
          category: data.category,
          merchant_name: data.merchant_name || null,
          notes: data.notes || null,
          date: new Date().toISOString().split('T')[0],
          source: 'manual',
        })
        .select()
        .single();

      if (error) throw error;

      addExpense(expense);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Не удалось добавить расход');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Новый расход</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Amount */}
        <Card style={styles.amountCard}>
          <Text style={styles.label}>Сумма</Text>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.amountInput}
                value={value}
                onChangeText={onChange}
                placeholder="0"
                placeholderTextColor={theme.colors.border}
                keyboardType="numeric"
                autoFocus={!params.amount}
              />
            )}
          />
          <Text style={styles.currency}>₸</Text>
          {errors.amount && <Text style={styles.error}>{errors.amount.message}</Text>}
        </Card>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Описание</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder="Кофе, такси, продукты..."
                placeholderTextColor={theme.colors.secondary}
              />
            )}
          />
          {errors.description && <Text style={styles.error}>{errors.description.message}</Text>}
        </View>

        {/* Merchant */}
        <View style={styles.field}>
          <Text style={styles.label}>Магазин / место (необязательно)</Text>
          <Controller
            control={control}
            name="merchant_name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder="Magnum, Яндекс Go..."
                placeholderTextColor={theme.colors.secondary}
              />
            )}
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Категория</Text>
          {errors.category && <Text style={styles.error}>{errors.category.message}</Text>}
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryItem,
                    isSelected && { backgroundColor: cat.color + '20', borderColor: cat.color },
                  ]}
                  onPress={() => {
                    setValue('category', cat.key);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      isSelected && { color: cat.color, fontWeight: '600' },
                    ]}
                    numberOfLines={1}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Text style={styles.label}>Заметка (необязательно)</Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={value}
                onChangeText={onChange}
                placeholder="Дополнительные детали..."
                placeholderTextColor={theme.colors.secondary}
                multiline
                numberOfLines={3}
              />
            )}
          />
        </View>

        <Button
          label="Сохранить"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
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
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 18,
    color: theme.colors.secondary,
  },
  scroll: { flex: 1 },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: 40,
  },
  amountCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    position: 'relative',
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    minWidth: 120,
  },
  currency: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.xl + 10,
    fontSize: 24,
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  field: {
    gap: theme.spacing.sm,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    ...theme.typography.body,
    color: theme.colors.text,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.sm + 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoryItem: {
    width: '22%',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    gap: 4,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryLabel: {
    fontSize: 10,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  error: {
    fontSize: 12,
    color: theme.colors.danger,
  },
  submitBtn: {
    marginTop: theme.spacing.sm,
  },
});
