import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { ChatMessage } from '../../types';
import { colors, radius, shadow, type as t } from '../../lib/theme';

const WELCOME: ChatMessage = {
  id: '__welcome__',
  session_id: '',
  user_id: '',
  role: 'assistant',
  content: 'Привет! Я ваш AI финансовый советник.\n\nЗадайте любой вопрос о расходах, или нажмите «📊 Анализ» для полного разбора финансов этого месяца.',
  created_at: new Date().toISOString(),
};

export default function AIAdvisorScreen() {
  const { user } = useAuthStore();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const initSession = useCallback(async () => {
    if (!user) return;

    let sid: string | null = null;

    const { data: existing } = await supabase
      .from('ai_chat_sessions')
      .select('id')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      sid = existing.id;
    } else {
      const { data: created } = await supabase
        .from('ai_chat_sessions')
        .insert({ user_id: user.id })
        .select('id')
        .single();
      sid = created?.id ?? null;
    }

    if (!sid) return;
    setSessionId(sid);

    const { data: msgs } = await supabase
      .from('ai_chat_messages')
      .select('*')
      .eq('session_id', sid)
      .order('created_at', { ascending: true });

    if (msgs && msgs.length > 0) {
      setMessages(msgs as ChatMessage[]);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    initSession().finally(() => setLoading(false));
  }, [initSession]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !user || !sessionId || sending) return;

    setInput('');
    setSending(true);

    // Optimistic update — show user bubble immediately
    const tempId = `__temp__${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      session_id: sessionId,
      user_id: user.id,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => {
      const base = prev.filter(m => m.id !== WELCOME.id);
      return [...base, optimistic];
    });
    scrollToBottom();

    try {
      const { error } = await supabase.functions.invoke('ai-chat', {
        body: { user_id: user.id, session_id: sessionId, message: trimmed },
      });
      if (error) throw error;

      // Reload from DB to replace temp message + get AI reply
      const { data: msgs } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (msgs) setMessages(msgs as ChatMessage[]);
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(trimmed);
    } finally {
      setSending(false);
      scrollToBottom();
    }
  }, [user, sessionId, sending, scrollToBottom]);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.row, isUser && styles.rowUser]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🧠</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Text style={{ fontSize: 18 }}>🧠</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>AI Советник</Text>
          <Text style={styles.headerSub}>Финансовый ассистент</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 94 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          onContentSizeChange={scrollToBottom}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            sending ? (
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarEmoji}>🧠</Text>
                </View>
                <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
                  <ActivityIndicator size="small" color={colors.secondary} />
                </View>
              </View>
            ) : null
          }
        />

        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.analysisBtn}
            onPress={() => sendMessage('Проанализируй мои расходы за текущий месяц')}
            disabled={sending}
            activeOpacity={0.75}
          >
            <Text style={styles.analysisBtnText}>📊 Анализ</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Задать вопрос..."
            placeholderTextColor={colors.placeholder}
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit
            onSubmitEditing={() => sendMessage(input)}
          />

          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnOff]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || sending}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: colors.bg },
  flex:  { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadow.xs,
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.accentLight,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...t.h4, color: colors.text },
  headerSub:   { ...t.xs, color: colors.muted, marginTop: 1 },

  list: { paddingHorizontal: 12, paddingVertical: 16, gap: 12 },

  row:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rowUser: { flexDirection: 'row-reverse' },

  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.accentLight,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarEmoji: { fontSize: 16 },

  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  bubbleAI: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.xs,
    ...shadow.xs,
  },
  bubbleUser: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: radius.xs,
  },
  bubbleText:     { ...t.body, color: colors.text, lineHeight: 21 },
  bubbleTextUser: { color: '#fff' },

  typingBubble: { paddingVertical: 14, paddingHorizontal: 20 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  analysisBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignSelf: 'flex-end',
  },
  analysisBtnText: { ...t.smMd, color: colors.accent },

  input: {
    flex: 1,
    ...t.body,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
  },

  sendBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  sendBtnOff: { backgroundColor: colors.border },
  sendIcon: { fontSize: 18, color: '#fff', fontWeight: '700', marginTop: -1 },
});
