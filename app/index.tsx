import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/store/auth';
import { supabase } from '../src/lib/supabase';
import { colors } from '../src/lib/theme';

export default function Index() {
  const router = useRouter();
  const { session } = useAuthStore();

  useEffect(() => {
    const check = async () => {
      const { data: { session: current } } = await supabase.auth.getSession();
      if (current) {
        router.replace('/(tabs)/');
      } else {
        router.replace('/onboarding');
      }
    };
    check();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000' }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}
