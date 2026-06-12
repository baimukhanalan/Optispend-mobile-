import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/auth';

// Native-only modules — guarded from web
let SplashScreen: any = null;
let Notifications: any = null;
let Sentry: any = null;

if (Platform.OS !== 'web') {
  SplashScreen = require('expo-splash-screen');
  Notifications = require('expo-notifications');
  Sentry = require('@sentry/react-native');

  SplashScreen.preventAutoHideAsync();

  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    enabled: !__DEV__,
    tracesSampleRate: 0.2,
  });

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

function RootLayout() {
  const { setSession, fetchUser, fetchProfile } = useAuthStore();

  const [loaded] = useFonts({});

  useEffect(() => {
    if (!loaded) return;
    SplashScreen?.hideAsync?.();
  }, [loaded]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      setSession(session);
      if (session) {
        await fetchUser();
        await fetchProfile();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!loaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="receipt-scanner" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="statement-import" options={{ presentation: 'modal' }} />
      <Stack.Screen name="add-expense" options={{ presentation: 'modal' }} />
      <Stack.Screen name="pricing" options={{ presentation: 'modal' }} />
      <Stack.Screen name="statement-preview" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

// Wrap with Sentry only on native
export default Platform.OS !== 'web' && Sentry
  ? Sentry.wrap(RootLayout)
  : RootLayout;
