import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/auth';

export default function RootLayout() {
  const { setSession, fetchUser, fetchProfile } = useAuthStore();

  const [fontsLoaded] = useFonts({
    'Inter-Regular':  Inter_400Regular,
    'Inter-Medium':   Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold':     Inter_700Bold,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setSession(session);
        if (session) {
          await fetchUser();
          await fetchProfile();
        }
      },
    );
    return () => subscription.unsubscribe();
  }, []);

  // On native, wait for fonts before rendering anything
  if (!fontsLoaded && Platform.OS !== 'web') return null;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="onboarding-profile" />
      <Stack.Screen name="receipt-scanner" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="statement-import"  options={{ presentation: 'modal' }} />
      <Stack.Screen name="statement-preview" options={{ presentation: 'modal' }} />
      <Stack.Screen name="add-expense"       options={{ presentation: 'modal' }} />
      <Stack.Screen name="pricing"           options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings"          options={{ presentation: 'modal' }} />
    </Stack>
  );
}
