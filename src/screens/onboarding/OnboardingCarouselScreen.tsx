import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, {
  Circle, Path, Rect, Line, G, Defs,
  LinearGradient as SvgLinearGradient, Stop,
} from 'react-native-svg';
import { colors, type as t, radius } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useT, useLangStore } from '@/lib/i18n';
import type { Lang } from '@/store/lang';

const SLIDE_COUNT   = 4;
const MAX_SLIDE_W   = 480;
const ILLUS_ASPECT  = 320 / 260;

// ─── SVG Illustrations ────────────────────────────────────────────────────────

function IllustrationControl({ w }: { w: number }) {
  const h = w / ILLUS_ASPECT;
  return (
    <Svg width={w} height={h} viewBox="0 0 320 260">
      <Defs>
        <SvgLinearGradient id="g1c" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#2563EB" stopOpacity="0.6" />
          <Stop offset="1" stopColor="#60A5FA" stopOpacity="0" />
        </SvgLinearGradient>
      </Defs>
      <Circle cx={160} cy={130} r={120} fill="url(#g1c)" />
      <Rect x={40} y={60} width={240} height={140} rx={16}
        fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
      <Rect x={60} y={84} width={60} height={8} rx={4} fill="rgba(255,255,255,0.2)" />
      <Rect x={60} y={104} width={120} height={22} rx={5} fill="rgba(255,255,255,0.85)" />
      <Path d="M 60 170 L 90 158 L 130 162 L 170 140 L 210 132 L 250 110"
        stroke="#3B82F6" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={250} cy={110} r={5} fill="#3B82F6" />
      <Rect x={195} y={82} width={65} height={22} rx={11}
        fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.4)" strokeWidth={1} />
      <Rect x={210} y={89} width={35} height={8} rx={4} fill="rgba(34,197,94,0.7)" />
    </Svg>
  );
}

function IllustrationBreakdown({ w }: { w: number }) {
  const h = w / ILLUS_ASPECT;
  const bars = [
    { x: 24,  bh: 90,  o: 0.25 },
    { x: 79,  bh: 145, o: 0.40 },
    { x: 134, bh: 110, o: 0.30 },
    { x: 189, bh: 170, o: 1.00 },
    { x: 244, bh: 125, o: 0.35 },
  ];
  return (
    <Svg width={w} height={h} viewBox="0 0 320 260">
      <Defs>
        <SvgLinearGradient id="g2b" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3B82F6" stopOpacity="1" />
          <Stop offset="1" stopColor="#1D4ED8" stopOpacity="0.7" />
        </SvgLinearGradient>
        <SvgLinearGradient id="g2bd" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3B82F6" stopOpacity="0.3" />
          <Stop offset="1" stopColor="#1D4ED8" stopOpacity="0.1" />
        </SvgLinearGradient>
      </Defs>
      <Line x1={14} y1={220} x2={306} y2={220} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      {bars.map((b, i) => (
        <G key={i}>
          <Rect x={b.x} y={220 - b.bh} width={45} height={b.bh} rx={6}
            fill={b.o === 1 ? 'url(#g2b)' : 'url(#g2bd)'}
            opacity={b.o === 1 ? 1 : b.o + 0.4}
          />
          {b.o === 1 && (
            <>
              <Rect x={b.x + 8} y={220 - b.bh - 28} width={29} height={18} rx={5}
                fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.5)" strokeWidth={1} />
              <Rect x={b.x + 14} y={220 - b.bh - 21} width={17} height={6} rx={3}
                fill="#3B82F6" />
            </>
          )}
        </G>
      ))}
    </Svg>
  );
}

function IllustrationBudget({ w }: { w: number }) {
  const h = w / ILLUS_ASPECT;
  const cx = 160, cy = 130, R = 90, stroke = 14;
  const circ = 2 * Math.PI * R;
  const pct = 0.68;
  return (
    <Svg width={w} height={h} viewBox="0 0 320 260">
      <Defs>
        <SvgLinearGradient id="g3bu" x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#1D4ED8" />
          <Stop offset="1" stopColor="#60A5FA" />
        </SvgLinearGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={R}
        fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <Circle cx={cx} cy={cy} r={R}
        fill="none" stroke="url(#g3bu)" strokeWidth={stroke}
        strokeDasharray={`${circ * pct} ${circ}`} strokeLinecap="round"
        rotation={-90} originX={cx} originY={cy} />
      <Rect x={cx - 28} y={cy - 16} width={56} height={32} rx={8}
        fill="rgba(255,255,255,0.06)" />
      <Rect x={cx - 18} y={cy - 8} width={36} height={10} rx={3}
        fill="rgba(255,255,255,0.8)" />
      <Rect x={cx - 12} y={cy + 6} width={24} height={6} rx={3}
        fill="rgba(255,255,255,0.25)" />
      <Circle cx={cx + R} cy={cy} r={5} fill="#60A5FA" />
      <Circle cx={cx + Math.cos(-0.64) * R} cy={cy - Math.sin(0.64) * R} r={5}
        fill="rgba(59,130,246,0.4)" />
    </Svg>
  );
}

// ─── Google icon ──────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 18 18">
    <Path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.48h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" />
    <Path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
    <Path fill="#FBBC05" d="M3.964 10.71a5.41 5.41 0 0 1 0-3.42V4.958H.957A9.009 9.009 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
    <Path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
  </Svg>
);

// ─── Dot indicator ────────────────────────────────────────────────────────────
const Dots = ({ current }: { current: number }) => (
  <View style={s.dots}>
    {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
      <View key={i} style={[s.dot, i === current ? s.dotOn : s.dotOff]} />
    ))}
  </View>
);

// ─── Language picker ──────────────────────────────────────────────────────────
const LANG_OPTS: { code: Lang; label: string }[] = [
  { code: 'ru', label: 'RU' },
  { code: 'kk', label: 'ҚЗ' },
  { code: 'en', label: 'EN' },
];

function LangPicker() {
  const { lang, setLang } = useLangStore();
  return (
    <View style={lp.wrap}>
      {LANG_OPTS.map(({ code, label }) => (
        <TouchableOpacity
          key={code}
          style={[lp.pill, lang === code && lp.pillOn]}
          onPress={() => setLang(code)}
          hitSlop={6}
        >
          <Text style={[lp.pillText, lang === code && lp.pillTextOn]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const lp = StyleSheet.create({
  wrap: {
    flexDirection: 'row', gap: 2,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20, padding: 2,
  },
  pill:        { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 18 },
  pillOn:      { backgroundColor: 'rgba(255,255,255,0.15)' },
  pillText:    { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 },
  pillTextOn:  { color: '#FFFFFF' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function OnboardingCarouselScreen() {
  const router    = useRouter();
  const T         = useT();
  const { width: W } = useWindowDimensions();
  const insets    = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const slideW   = Math.min(W, MAX_SLIDE_W);
  const isNarrow = slideW < 360;
  const illusW   = slideW * 0.78;
  const pH       = Math.max(24, insets.top);
  const hScale   = isNarrow ? 0.82 : 1;

  const slides = [
    { eyebrow: T.slide1_eyebrow, headline: T.slide1_headline, body: T.slide1_body, Illus: IllustrationControl },
    { eyebrow: T.slide2_eyebrow, headline: T.slide2_headline, body: T.slide2_body, Illus: IllustrationBreakdown },
    { eyebrow: T.slide3_eyebrow, headline: T.slide3_headline, body: T.slide3_body, Illus: IllustrationBudget },
  ];

  const [mode, setMode]               = useState<'login' | 'register'>('login');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [name, setName]               = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError]     = useState('');

  const goToSlide = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * slideW, animated: true });
    setPage(i);
  };

  const onMomentumEnd = (e: any) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / slideW);
    setPage(p);
  };

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
      Alert.alert('Google', 'Available in the next update');
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) { setAuthError(T.err_fill); return; }
    if (mode === 'register' && !name.trim()) { setAuthError(T.err_name); return; }
    setAuthError('');
    setAuthLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/(tabs)/');
      } else {
        const { error } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: name } },
        });
        if (error) throw error;
        router.replace('/onboarding-profile');
      }
    } catch (err: any) {
      setAuthError(err.message ?? 'Error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <View style={s.canvas}>
      <View style={{ width: slideW, flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumEnd}
          bounces={false}
          style={{ flex: 1 }}
        >
          {/* ── Feature slides ── */}
          {slides.map((slide, i) => (
            <View key={i} style={[s.slide, { width: slideW, paddingTop: pH + 12 }]}>

              {/* Language picker — top left */}
              <View style={[s.langPickerPos, { top: pH + 4 }]}>
                <LangPicker />
              </View>

              {/* Skip — top right */}
              <TouchableOpacity style={[s.skip, { top: pH + 4 }]} onPress={() => goToSlide(3)} hitSlop={12}>
                <Text style={s.skipText}>{T.skip}</Text>
              </TouchableOpacity>

              {/* Illustration */}
              <View style={s.illusWrap}>
                <slide.Illus w={illusW} />
              </View>

              {/* Copy */}
              <View style={s.copy}>
                <Text style={s.eyebrow}>{slide.eyebrow}</Text>
                <Text style={[s.headline, { fontSize: t.d1.fontSize * hScale }]}>
                  {slide.headline}
                </Text>
                <Text style={s.body}>{slide.body}</Text>
              </View>

              {/* Footer */}
              <View style={[s.footer, { paddingBottom: Math.max(32, insets.bottom + 16) }]}>
                <Dots current={page} />
                <TouchableOpacity style={s.nextBtn} onPress={() => goToSlide(i + 1)}>
                  <Text style={s.nextBtnText}>{T.next}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* ── Auth slide ── */}
          <KeyboardAvoidingView
            style={{ width: slideW, flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={[
                s.authSlide,
                { paddingTop: pH + 8, paddingBottom: Math.max(40, insets.bottom + 16) },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Back + LangPicker row */}
              <View style={s.authTopRow}>
                <TouchableOpacity style={s.backBtn} onPress={() => goToSlide(2)} hitSlop={12}>
                  <Text style={s.backBtnText}>{T.back}</Text>
                </TouchableOpacity>
                <LangPicker />
              </View>

              <Text style={s.authLogo}>OptiSpend</Text>
              <Text style={s.authTagline}>
                {mode === 'login' ? T.auth_signin_tagline : T.auth_signup_tagline}
              </Text>

              {/* Mode toggle */}
              <View style={s.modeToggle}>
                {(['login', 'register'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[s.modeBtn, mode === m && s.modeBtnOn]}
                    onPress={() => { setMode(m); setAuthError(''); }}
                  >
                    <Text style={[s.modeBtnText, mode === m && s.modeBtnTextOn]}>
                      {m === 'login' ? T.auth_signin_tab : T.auth_signup_tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Google */}
              <TouchableOpacity style={s.googleBtn} onPress={handleGoogle} activeOpacity={0.85}>
                <GoogleIcon />
                <Text style={s.googleBtnText}>{T.google_btn}</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={s.divider}>
                <View style={s.divLine} />
                <Text style={s.divText}>{T.or}</Text>
                <View style={s.divLine} />
              </View>

              {/* Fields */}
              {mode === 'register' && (
                <TextInput style={s.input} placeholder={T.field_name}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={name} onChangeText={setName} autoCapitalize="words" />
              )}
              <TextInput style={s.input} placeholder={T.field_email}
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
              <TextInput style={s.input} placeholder={T.field_password}
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={password} onChangeText={setPassword} secureTextEntry />

              {!!authError && <Text style={s.errText}>{authError}</Text>}

              <TouchableOpacity style={s.submitBtn} onPress={handleEmailAuth}
                activeOpacity={0.85} disabled={authLoading}>
                {authLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.submitBtnText}>
                      {mode === 'login' ? T.submit_signin : T.submit_signup}
                    </Text>
                }
              </TouchableOpacity>

              <View style={{ marginTop: 32, alignItems: 'center' }}>
                <Dots current={3} />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  canvas: {
    flex: 1, backgroundColor: '#000000',
    alignItems: 'center', justifyContent: 'center',
  },
  slide: {
    flex: 1, backgroundColor: '#000000', paddingHorizontal: 28,
  },

  // Top controls
  langPickerPos: { position: 'absolute', left: 20, zIndex: 10 },
  skip: {
    position: 'absolute', right: 20,
    paddingVertical: 8, paddingHorizontal: 4, zIndex: 10,
  },
  skipText:       { ...t.sm, color: 'rgba(255,255,255,0.4)' },
  illusWrap:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 48 },
  copy:           { paddingBottom: 8 },
  eyebrow:        { ...t.xsMd, color: '#3B82F6', letterSpacing: 2, marginBottom: 12 },
  headline:       { ...t.d1, color: '#FFFFFF', marginBottom: 14 },
  body:           { ...t.body, color: 'rgba(255,255,255,0.5)', lineHeight: 25 },
  footer:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 28 },
  dots:           { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:            { height: 5, borderRadius: 3 },
  dotOn:          { width: 24, backgroundColor: '#3B82F6' },
  dotOff:         { width: 5, backgroundColor: 'rgba(255,255,255,0.2)' },
  nextBtn:        { backgroundColor: '#2563EB', paddingHorizontal: 28, paddingVertical: 14, borderRadius: radius.full },
  nextBtnText:    { ...t.bodyMd, color: '#FFFFFF' },

  // Auth slide
  authSlide: {
    backgroundColor: '#000000', paddingHorizontal: 28, minHeight: '100%',
  },
  authTopRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  backBtn:         { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnText:     { fontSize: 22, color: 'rgba(255,255,255,0.4)' },
  authLogo:        { ...t.h1, color: '#FFFFFF', marginBottom: 6 },
  authTagline:     { ...t.body, color: 'rgba(255,255,255,0.45)', marginBottom: 28 },

  modeToggle:      { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.md, padding: 3, marginBottom: 24 },
  modeBtn:         { flex: 1, paddingVertical: 10, borderRadius: radius.md - 2, alignItems: 'center' },
  modeBtnOn:       { backgroundColor: '#1E293B' },
  modeBtnText:     { ...t.bodyMd, color: 'rgba(255,255,255,0.4)' },
  modeBtnTextOn:   { color: '#FFFFFF' },

  googleBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: radius.md, paddingVertical: 15, marginBottom: 18 },
  googleBtnText:   { ...t.bodyMd, color: '#111111' },

  divider:         { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  divLine:         { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  divText:         { ...t.sm, color: 'rgba(255,255,255,0.25)' },

  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    paddingHorizontal: 16, paddingVertical: 15,
    ...t.body, color: '#FFFFFF', marginBottom: 12,
  },
  errText:         { ...t.sm, color: '#F87171', marginBottom: 10 },
  submitBtn:       { backgroundColor: '#2563EB', borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  submitBtnText:   { ...t.bodyMd, color: '#FFFFFF' },
});
