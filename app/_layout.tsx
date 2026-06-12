import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/auth';

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

export default Sentry.wrap(function RootLayout() {
  const { setSession, fetchUser, fetchProfile } = useAuthStore();

  const [loaded] = useFonts({
    // Add custom fonts here if needed
  });

  useEffect(() => {
    if (!loaded) return;
    SplashScreen.hideAsync();
  }, [loaded]);

  useEffect(() => {
    // Listen to auth state
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
});
