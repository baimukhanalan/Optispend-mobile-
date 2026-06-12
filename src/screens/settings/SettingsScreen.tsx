import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type SettingsSection = {
  title: string;
  items: SettingsItem[];
};

type SettingsItem =
  | { type: 'nav'; label: string; value?: string; onPress: () => void }
  | { type: 'toggle'; label: string; value: boolean; onToggle: (v: boolean) => void }
  | { type: 'info'; label: string; value: string };

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [weeklyEmail, setWeeklyEmail] = useState(true);
  const [telegramToken, setTelegramToken] = useState('');
  const [linkingTelegram, setLinkingTelegram] = useState(false);
  const [showTelegramInput, setShowTelegramInput] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Выйти?', 'Вы уверены, что хотите выйти из аккаунта?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Удалить аккаунт?',
      'Все ваши данные будут удалены безвозвратно. Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            // In production: call Edge Function to delete user + data
            Alert.alert('Для удаления аккаунта обратитесь в поддержку: support@optispend.kz');
          },
        },
      ]
    );
  };

  const linkTelegram = async () => {
    if (!telegramToken.trim() || !user) return;
    setLinkingTelegram(true);
    try {
      const { error } = await supabase
        .from('telegram_accounts')
        .upsert({ user_id: user.id, link_token: telegramToken.trim() });
      if (error) throw error;
      setShowTelegramInput(false);
      Alert.alert('Готово', 'Отправьте /link ' + telegramToken.trim() + ' боту @OptiSpendBot');
    } catch (err: any) {
      Alert.alert('Ошибка', err.message);
    } finally {
      setLinkingTelegram(false);
    }
  };

  const avatarInitials = user?.email?.slice(0, 2).toUpperCase() || '??';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Настройки</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile */}
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarInitials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.full_name || 'Пользователь'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/pricing')}>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>
                {profile?.subscription_plan?.toUpperCase() || 'FREE'}
              </Text>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Subscription */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Подписка</Text>
          <Card>
            <TouchableOpacity style={styles.row} onPress={() => router.push('/pricing')}>
              <Text style={styles.rowLabel}>Тариф</Text>
              <Text style={styles.rowValue}>
                {profile?.subscription_plan === 'free'
                  ? 'Free →'
                  : profile?.subscription_plan === 'plus'
                  ? 'Plus →'
                  : profile?.subscription_plan === 'family'
                  ? 'Family →'
                  : 'Premium →'}
              </Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Уведомления</Text>
          <Card style={styles.cardNoPad}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.rowLabel}>Push-уведомления</Text>
                <Text style={styles.rowHint}>Лимиты, утечки, напоминания</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={(v) => {
                  setNotifications(v);
                  Haptics.selectionAsync();
                }}
                trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                thumbColor="#fff"
              />
            </View>
            <View style={[styles.toggleRow, styles.toggleRowBorder]}>
              <View>
                <Text style={styles.rowLabel}>Еженедельный отчёт на email</Text>
                <Text style={styles.rowHint}>Каждое воскресенье в 20:00</Text>
              </View>
              <Switch
                value={weeklyEmail}
                onValueChange={(v) => {
                  setWeeklyEmail(v);
                  Haptics.selectionAsync();
                }}
                trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                thumbColor="#fff"
              />
            </View>
          </Card>
        </View>

        {/* Telegram */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Telegram-бот</Text>
          <Card>
            <Text style={styles.telegramHint}>
              Добавляйте расходы через Telegram. Напишите "кофе 800" — и готово.
            </Text>
            {showTelegramInput ? (
              <View style={styles.telegramInput}>
                <TextInput
                  style={styles.input}
                  value={telegramToken}
                  onChangeText={setTelegramToken}
                  placeholder="Токен привязки (из бота)"
                  placeholderTextColor={theme.colors.secondary}
                  autoCapitalize="none"
                />
                <View style={styles.telegramBtns}>
                  <Button
                    label="Привязать"
                    onPress={linkTelegram}
                    loading={linkingTelegram}
                    size="sm"
                    style={{ flex: 1 }}
                  />
                  <Button
                    label="Отмена"
                    variant="ghost"
                    size="sm"
                    onPress={() => setShowTelegramInput(false)}
                    style={{ flex: 1 }}
                  />
                </View>
                <Text style={styles.telegramInstructions}>
                  1. Найдите @OptiSpendBot в Telegram{'\n'}
                  2. Напишите /start{'\n'}
                  3. Скопируйте токен и вставьте сюда
                </Text>
              </View>
            ) : (
              <Button
                label="Привязать Telegram"
                variant="secondary"
                onPress={() => setShowTelegramInput(true)}
                style={{ marginTop: theme.spacing.sm }}
              />
            )}
          </Card>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Помощь</Text>
          <Card style={styles.cardNoPad}>
            {[
              { label: 'Поддержка', value: 'support@optispend.kz' },
              { label: 'Telegram поддержки', value: '@optispend_support' },
              { label: 'Версия приложения', value: '1.0.0 (MVP)' },
            ].map((item, i) => (
              <View
                key={item.label}
                style={[styles.row, i > 0 && styles.rowBorder]}
              >
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowValue}>{item.value}</Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <Button
            label="Выйти из аккаунта"
            variant="secondary"
            onPress={handleSignOut}
          />
          <Button
            label="Удалить аккаунт"
            variant="danger"
            onPress={handleDeleteAccount}
            style={{ marginTop: theme.spacing.sm }}
          />
        </View>
      </ScrollView>
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
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 20, color: theme.colors.secondary },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  profileInfo: { flex: 1 },
  profileName: { ...theme.typography.body, color: theme.colors.text, fontWeight: '600' },
  profileEmail: { ...theme.typography.caption, color: theme.colors.secondary, marginTop: 2 },
  planBadge: {
    backgroundColor: theme.colors.softBlue,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  planBadgeText: {
    fontSize: 11,
    color: theme.colors.accent,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  section: { gap: theme.spacing.sm },
  sectionTitle: {
    ...theme.typography.caption,
    color: theme.colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardNoPad: { padding: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: theme.colors.border },
  rowLabel: { ...theme.typography.body, color: theme.colors.text },
  rowHint: { ...theme.typography.caption, color: theme.colors.secondary, marginTop: 2 },
  rowValue: { ...theme.typography.body, color: theme.colors.secondary },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  toggleRowBorder: { borderTopWidth: 1, borderTopColor: theme.colors.border },
  telegramHint: { ...theme.typography.body, color: theme.colors.secondary, lineHeight: 22 },
  telegramInput: { gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    ...theme.typography.body,
    color: theme.colors.text,
  },
  telegramBtns: { flexDirection: 'row', gap: theme.spacing.sm },
  telegramInstructions: {
    ...theme.typography.caption,
    color: theme.colors.secondary,
    lineHeight: 20,
  },
});
