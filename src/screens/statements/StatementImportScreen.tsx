import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { theme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KazakhstanBank } from '@/types';

const BANKS: { key: KazakhstanBank; label: string; formats: string[]; color: string }[] = [
  { key: 'kaspi', label: 'Kaspi Bank', formats: ['CSV', 'PDF'], color: '#F2232A' },
  { key: 'halyk', label: 'Halyk Bank', formats: ['CSV', 'XLS'], color: '#00843D' },
  { key: 'forte', label: 'Forte Bank', formats: ['CSV', 'PDF'], color: '#0057A8' },
  { key: 'jusan', label: 'Jusan Bank', formats: ['CSV', 'PDF'], color: '#E4732B' },
  { key: 'freedom', label: 'Freedom Bank', formats: ['CSV'], color: '#003087' },
  { key: 'other', label: 'Другой банк', formats: ['CSV', 'PDF', 'XLS'], color: '#64748B' },
];

type Phase = 'idle' | 'uploading' | 'parsing' | 'done' | 'error';

export default function StatementImportScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedBank, setSelectedBank] = useState<KazakhstanBank | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [parsedCount, setParsedCount] = useState(0);
  const [statementId, setStatementId] = useState<string | null>(null);

  const pickAndUpload = async () => {
    if (!selectedBank) {
      Alert.alert('Выберите банк', 'Укажите из какого банка выписка для точного парсинга');
      return;
    }
    if (!user) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/pdf', 'application/vnd.ms-excel',
               'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const ext = file.name.split('.').pop()?.toLowerCase() || 'csv';
      const fileType = ext === 'pdf' ? 'pdf' : ext === 'csv' ? 'csv' : 'xlsx';

      setPhase('uploading');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Create statement record
      const { data: statement, error: stmtError } = await supabase
        .from('statements')
        .insert({
          user_id: user.id,
          bank: selectedBank,
          file_type: fileType,
          parse_status: 'pending',
        })
        .select()
        .single();

      if (stmtError) throw stmtError;

      // Upload file
      const filePath = `${user.id}/${statement.id}.${ext}`;
      const fileContent = await fetch(file.uri);
      const blob = await fileContent.blob();

      const { error: uploadError } = await supabase.storage
        .from('statements')
        .upload(filePath, blob, { contentType: file.mimeType || 'text/csv' });

      if (uploadError) throw uploadError;

      // Update storage path
      await supabase
        .from('statements')
        .update({ storage_path: filePath })
        .eq('id', statement.id);

      setPhase('parsing');

      // Call Edge Function
      const { data: parseResult, error: parseError } = await supabase.functions.invoke(
        'parse-statement',
        { body: { statement_id: statement.id } }
      );

      if (parseError) throw parseError;

      setParsedCount(parseResult?.imported_count || 0);
      setStatementId(statement.id);
      setPhase('done');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setPhase('error');
      Alert.alert('Ошибка', err.message || 'Не удалось импортировать выписку');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const reset = () => {
    setPhase('idle');
    setParsedCount(0);
    setStatementId(null);
  };

  if (phase === 'done') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Импорт выписки</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.resultContainer}>
          <Text style={styles.resultIcon}>✅</Text>
          <Text style={styles.resultTitle}>Выписка загружена</Text>
          <Text style={styles.resultSubtitle}>
            Распознано {parsedCount} транзакций
          </Text>
          <Button
            label="Посмотреть транзакции"
            onPress={() => router.push({ pathname: '/statement-preview', params: { id: statementId } })}
            style={styles.resultBtn}
          />
          <Button
            label="Загрузить ещё"
            variant="ghost"
            onPress={reset}
            style={{ marginTop: theme.spacing.sm }}
          />
        </View>
      </View>
    );
  }

  if (phase === 'uploading' || phase === 'parsing') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ width: 32 }} />
          <Text style={styles.headerTitle}>Импорт выписки</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.resultContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={styles.resultTitle}>
            {phase === 'uploading' ? 'Загружаем файл...' : 'AI парсит транзакции...'}
          </Text>
          <Text style={styles.resultSubtitle}>
            {phase === 'parsing' ? 'GPT-4o распознаёт категории. Это займёт 15–30 секунд.' : ''}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Импорт выписки</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Выберите банк</Text>

        {BANKS.map((bank) => (
          <TouchableOpacity
            key={bank.key}
            style={[
              styles.bankRow,
              selectedBank === bank.key && {
                borderColor: bank.color,
                backgroundColor: bank.color + '10',
              },
            ]}
            onPress={() => {
              setSelectedBank(bank.key);
              Haptics.selectionAsync();
            }}
          >
            <View style={[styles.bankDot, { backgroundColor: bank.color }]} />
            <View style={styles.bankInfo}>
              <Text style={styles.bankName}>{bank.label}</Text>
              <Text style={styles.bankFormats}>Форматы: {bank.formats.join(', ')}</Text>
            </View>
            {selectedBank === bank.key && (
              <Text style={[styles.bankCheck, { color: bank.color }]}>✓</Text>
            )}
          </TouchableOpacity>
        ))}

        <Card style={styles.howToCard}>
          <Text style={styles.howToTitle}>Как скачать выписку?</Text>
          {selectedBank === 'kaspi' && (
            <Text style={styles.howToText}>
              Kaspi.kz → История → Период → CSV
            </Text>
          )}
          {selectedBank === 'halyk' && (
            <Text style={styles.howToText}>
              Halyk Home Bank → Счета → Выписка → Excel
            </Text>
          )}
          {selectedBank === 'forte' && (
            <Text style={styles.howToText}>
              ForteBank App → История → Экспорт → CSV
            </Text>
          )}
          {(!selectedBank || selectedBank === 'other' || selectedBank === 'freedom' || selectedBank === 'jusan') && (
            <Text style={styles.howToText}>
              Откройте мобильный банк → История операций → Экспорт / Скачать выписку
            </Text>
          )}
        </Card>

        <Button
          label="Выбрать файл"
          onPress={pickAndUpload}
          disabled={!selectedBank}
          style={styles.uploadBtn}
        />

        <Text style={styles.disclaimer}>
          Файл загружается на защищённый сервер и используется только для анализа расходов.
        </Text>
      </ScrollView>
    </View>
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
    gap: theme.spacing.md,
    paddingBottom: 40,
  },
  sectionLabel: {
    ...theme.typography.caption,
    color: theme.colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  bankDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bankInfo: { flex: 1 },
  bankName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  bankFormats: {
    ...theme.typography.caption,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  bankCheck: {
    fontSize: 18,
    fontWeight: '700',
  },
  howToCard: {
    backgroundColor: theme.colors.softBlue,
    borderColor: theme.colors.accent + '30',
    borderWidth: 1,
  },
  howToTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  howToText: {
    ...theme.typography.body,
    color: theme.colors.secondary,
    lineHeight: 22,
  },
  uploadBtn: {
    marginTop: theme.spacing.sm,
  },
  disclaimer: {
    ...theme.typography.caption,
    color: theme.colors.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  resultIcon: { fontSize: 64 },
  resultTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center',
  },
  resultSubtitle: {
    ...theme.typography.body,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  resultBtn: { width: '100%', marginTop: theme.spacing.md },
});
