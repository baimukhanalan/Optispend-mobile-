import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors, type as t, radius } from '../../lib/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!name || !email || !password) { setError('Заполните все поля'); return; }
    setError(''); setLoading(true);
    const { error: e } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: name } },
    });
    if (e) { setError(e.message); setLoading(false); return; }
    router.replace('/(tabs)/');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Регистрация</Text>
        <TextInput style={styles.input} placeholder="Имя" placeholderTextColor={colors.placeholder}
          value={name} onChangeText={setName} autoCapitalize="words" />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.placeholder}
          value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Пароль" placeholderTextColor={colors.placeholder}
          value={password} onChangeText={setPassword} secureTextEntry />
        {!!error && <Text style={styles.err}>{error}</Text>}
        <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Создать аккаунт</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.link} onPress={() => router.replace('/onboarding')}>
          <Text style={styles.linkText}>Уже есть аккаунт? Войти</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, padding: 28, justifyContent: 'center' },
  title: { ...t.h1, color: colors.text, marginBottom: 32 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: 14, ...t.body, color: colors.text, marginBottom: 12,
  },
  err: { ...t.sm, color: colors.danger, marginBottom: 8 },
  btn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  btnText: { ...t.bodyMd, color: '#fff' },
  link: { alignItems: 'center', marginTop: 24 },
  linkText: { ...t.sm, color: colors.accent },
});
