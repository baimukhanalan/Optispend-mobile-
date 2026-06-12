import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/store/auth';
import { supabase } from '../src/lib/supabase';
import { colors } from '../src/lib/theme';

export default function Index() {
  const router = useRouter();
  const { session, profile } = useAuthStore();

  useEffect(() => {
    const check = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (!currentSession) {
        router.replace('/(auth)/sign-in');
        return;
      }

      if (!profile?.onboarding_completed) {
        router.replace('/onboarding');
        return;
      }

      router.replace('/(tabs)');
    };

    check();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}
