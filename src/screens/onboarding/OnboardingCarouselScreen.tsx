import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, {
  Circle, Path, Rect, Line, G, Defs,
  LinearGradient as SvgGradient, Stop,
} from 'react-native-svg';
import { colors, type as t, radius, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

const { width: W, height: H } = Dimensions.get('window');
const SLIDE_COUNT = 4; // 3 feature + 1 auth

// ─── SVG Illustrations ────────────────────────────────────────────────────────

const IllustrationControl = () => (
  <Svg width={W * 0.8} height={260} viewBox="0 0 320 260">
    <Defs>
      <SvgGradient id="g1" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#2563EB" stopOpacity="0.6" />
        <Stop offset="1" stopColor="#60A5FA" stopOpacity="0" />
      </SvgGradient>
    </Defs>
    {/* Background glow */}
    <Circle cx={160} cy={130} r={120} fill="url(#g1)" />
    {/* Card mockup */}
    <Rect x={40} y={60} width={240} height={140} rx={16}
      fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
    {/* Card label */}
    <Rect x={60} y={84} width={60} height={8} rx={4} fill="rgba(255,255,255,0.2)" />
    {/* Big number */}
    <Rect x={60} y={104} width={120} height={22} rx={5} fill="rgba(255,255,255,0.85)" />
    {/* Trend line */}
    <Path d="M 60 170 L 90 158 L 130 162 L 170 140 L 210 132 L 250 110"
      stroke="#3B82F6" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={250} cy={110} r={5} fill="#3B82F6" />
    {/* Small badge */}
    <Rect x={195} y={82} width={65} height={22} rx={11}
      fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.4)" strokeWidth={1} />
    <Rect x={210} y={89} width={35} height={8} rx={4} fill="rgba(34,197,94,0.7)" />
  </Svg>
);

const IllustrationBreakdown = () => {
  const bars = [
    { x: 24,  h: 90,  o: 0.25 },
    { x: 79,  h: 145, o: 0.40 },
    { x: 134, h: 110, o: 0.30 },
    { x: 189, h: 170, o: 1.00 },
    { x: 244, h: 125, o: 0.35 },
  ];
  return (
    <Svg width={W * 0.8} height={260} viewBox="0 0 320 260">
      <Defs>
        <SvgGradient id="g2" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3B82F6" stopOpacity="1" />
          <Stop offset="1" stopColor="#1D4ED8" stopOpacity="0.7" />
        </SvgGradient>
        <SvgGradient id="g2d" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3B82F6" stopOpacity="0.3" />
          <Stop offset="1" stopColor="#1D4ED8" stopOpacity="0.1" />
        </SvgGradient>
      </Defs>
      {/* Baseline */}
      <Line x1={14} y1={220} x2={306} y2={220}
        stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      {bars.map((b, i) => (
        <G key={i}>
          <Rect x={b.x} y={220 - b.h} width={45} height={b.h} rx={6}
            fill={b.o === 1 ? 'url(#g2)' : 'url(#g2d)'}
            opacity={b.o === 1 ? 1 : b.o + 0.4}
          />
          {b.o === 1 && (
            <>
              <Rect x={b.x + 8} y={220 - b.h - 28} width={29} height={18} rx={5}
                fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.5)" strokeWidth={1} />
              <Rect x={b.x + 14} y={220 - b.h - 21} width={17} height={6} rx={3}
                fill="#3B82F6" />
            </>
          )}
        </G>
      ))}
    </Svg>
  );
};

const IllustrationBudget = () => {
  const cx = 160, cy = 130, R = 90, stroke = 14;
  const circ = 2 * Math.PI * R;
  const pct = 0.68;
  return (
    <Svg width={W * 0.8} height={260} viewBox="0 0 320 260">
      <Defs>
        <SvgGradient id="g3" x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#1D4ED8" />
          <Stop offset="1" stopColor="#60A5FA" />
        </SvgGradient>
      </Defs>
      {/* Track */}
      <Circle cx={cx} cy={cy} r={R}
        fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      {/* Progress arc */}
      <Circle cx={cx} cy={cy} r={R}
        fill="none"
        stroke="url(#g3)"
        strokeWidth={stroke}
        strokeDasharray={`${circ * pct} ${circ}`}
        strokeLinecap="round"
        rotation={-90}
        originX={cx}
        originY={cy}
      />
      {/* Center: percentage block */}
      <Rect x={cx - 28} y={cy - 16} width={56} height={32} rx={8}
        fill="rgba(255,255,255,0.06)" />
      <Rect x={cx - 18} y={cy - 8} width={36} height={10} rx={3}
        fill="rgba(255,255,255,0.8)" />
      <Rect x={cx - 12} y={cy + 6} width={24} height={6} rx={3}
        fill="rgba(255,255,255,0.25)" />
      {/* Outer dots */}
      <Circle cx={cx + R} cy={cy} r={5} fill="#60A5FA" />
      <Circle cx={cx + Math.cos(-0.64) * R} cy={cy - Math.sin(0.64) * R} r={5}
        fill="rgba(59,130,246,0.4)" />
    </Svg>
  );
};

// ─── Google icon (official "G" colors) ────────────────────────────────────────
const GoogleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 18 18">
    <Path fill="#4285F4"
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.48h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" />
    <Path fill="#34A853"
      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
    <Path fill="#FBBC05"
      d="M3.964 10.71a5.41 5.41 0 0 1 0-3.42V4.958H.957A9.009 9.009 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
    <Path fill="#EA4335"
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
  </Svg>
);

// ─── Dot indicator ────────────────────────────────────────────────────────────
const Dots = ({ current }: { current: number }) => (
  <View style={styles.dots}>
    {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.dot,
          i === current ? styles.dotActive : styles.dotInactive,
        ]}
      />
    ))}
  </View>
);

// ─── Slides data ──────────────────────────────────────────────────────────────
const slides = [
  {
    eyebrow: 'ФИНАНСЫ',
    headline: 'Деньги\nпод контролем',
    body: 'Каждая трата зафиксирована.\nВидите баланс в реальном времени.',
    Illustration: IllustrationControl,
  },
  {
    eyebrow: 'ПРОЗРАЧНОСТЬ',
    headline: 'Видите,\nкуда уходят',
    body: 'Kaspi, Halyk, Forte — импорт\nвыписки за 10 секунд.',
    Illustration: IllustrationBreakdown,
  },
  {
    eyebrow: 'ПЛАНИРОВАНИЕ',
    headline: 'Бюджет,\nкоторый держит',
    body: 'Лимиты по категориям.\nУведомление до того, как превысили.',
    Illustration: IllustrationBudget,
  },
];

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function OnboardingCarouselScreen() {
  const router   = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const isLast = page === SLIDE_COUNT - 1;

  // Auth state
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const goToSlide = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * W, animated: true });
    setPage(i);
  };

  const onMomentumEnd = (e: any) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / W);
    setPage(p);
  };

  // ── Auth handlers ──
  const handleGoogle = async () => {
    if (Platform.OS === 'web') {
      setAuthLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) setAuthError(error.message);
      setAuthLoading(false);
    } else {
      Alert.alert('Google вход', 'Доступен в следующем обновлении');
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setAuthError('Заполните все поля');
      return;
    }
    setAuthError('');
    setAuthLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/(tabs)/');
      } else {
        if (!name.trim()) { setAuthError('Введите имя'); setAuthLoading(false); return; }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        router.replace('/onboarding-profile');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Ошибка. Попробуйте снова.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumEnd}
        bounces={false}
      >
        {/* ── Feature slides ── */}
        {slides.map((slide, i) => {
          const Illustration = slide.Illustration;
          return (
            <View key={i} style={[styles.slide, { width: W }]}>
              {/* Skip */}
              <TouchableOpacity style={styles.skip} onPress={() => goToSlide(3)}>
                <Text style={styles.skipText}>Пропустить</Text>
              </TouchableOpacity>

              {/* Illustration */}
              <View style={styles.illustrationWrap}>
                <Illustration />
              </View>

              {/* Text */}
              <View style={styles.textBlock}>
                <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
                <Text style={styles.headline}>{slide.headline}</Text>
                <Text style={styles.slideBody}>{slide.body}</Text>
              </View>

              {/* Dots + next */}
              <View style={styles.footer}>
                <Dots current={page} />
                <TouchableOpacity style={styles.nextBtn} onPress={() => goToSlide(i + 1)}>
                  <Text style={styles.nextBtnText}>Далее</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* ── Auth slide ── */}
        <KeyboardAvoidingView
          style={{ width: W }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.authSlide}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back */}
            <TouchableOpacity style={styles.backBtn} onPress={() => goToSlide(2)}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>

            <Text style={styles.authLogo}>OptiSpend</Text>
            <Text style={styles.authTagline}>
              {mode === 'login' ? 'Войдите в свой аккаунт' : 'Создайте аккаунт'}
            </Text>

            {/* Mode toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
                onPress={() => { setMode('login'); setAuthError(''); }}
              >
                <Text style={[styles.modeBtnText, mode === 'login' && styles.modeBtnTextActive]}>
                  Войти
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]}
                onPress={() => { setMode('register'); setAuthError(''); }}
              >
                <Text style={[styles.modeBtnText, mode === 'register' && styles.modeBtnTextActive]}>
                  Регистрация
                </Text>
              </TouchableOpacity>
            </View>

            {/* Google */}
            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} activeOpacity={0.85}>
              <GoogleIcon />
              <Text style={styles.googleBtnText}>Продолжить с Google</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>или</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Fields */}
            {mode === 'register' && (
              <TextInput
                style={styles.input}
                placeholder="Имя"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Пароль"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {/* Error */}
            {!!authError && <Text style={styles.errorText}>{authError}</Text>}

            {/* Submit */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleEmailAuth}
              activeOpacity={0.85}
              disabled={authLoading}
            >
              {authLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitBtnText}>
                    {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
                  </Text>
              }
            </TouchableOpacity>

            {/* Dots at bottom */}
            <View style={{ marginTop: 32 }}>
              <Dots current={3} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // Feature slide
  slide: {
    flex: 1,
    height: H,
    backgroundColor: '#000000',
    paddingHorizontal: 28,
  },
  skip: {
    position: 'absolute',
    top: 60,
    right: 28,
    paddingVertical: 6,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  skipText: {
    ...t.sm,
    color: 'rgba(255,255,255,0.4)',
  },
  illustrationWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  textBlock: {
    paddingBottom: 12,
  },
  eyebrow: {
    ...t.xsMd,
    color: '#3B82F6',
    letterSpacing: 2,
    marginBottom: 12,
  },
  headline: {
    ...t.d1,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  slideBody: {
    ...t.body,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 25,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 48,
    paddingTop: 32,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#3B82F6',
  },
  dotInactive: {
    width: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  nextBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: radius.full,
  },
  nextBtnText: {
    ...t.bodyMd,
    color: '#FFFFFF',
  },

  // Auth slide
  authSlide: {
    minHeight: H,
    backgroundColor: '#000000',
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 48,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  backBtnText: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.4)',
  },
  authLogo: {
    ...t.h1,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  authTagline: {
    ...t.body,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 32,
  },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.md,
    padding: 3,
    marginBottom: 28,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md - 2,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#1E293B',
  },
  modeBtnText: {
    ...t.bodyMd,
    color: 'rgba(255,255,255,0.4)',
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
  },

  // Google
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    paddingVertical: 15,
    marginBottom: 20,
  },
  googleBtnText: {
    ...t.bodyMd,
    color: '#111111',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    ...t.sm,
    color: 'rgba(255,255,255,0.25)',
  },

  // Inputs
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 15,
    ...t.body,
    color: '#FFFFFF',
    marginBottom: 12,
  },

  // Error
  errorText: {
    ...t.sm,
    color: '#F87171',
    marginBottom: 12,
  },

  // Submit
  submitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    ...t.bodyMd,
    color: '#FFFFFF',
  },
});
