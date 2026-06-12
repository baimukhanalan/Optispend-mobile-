import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../src/lib/theme';

function Icon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tab, focused && styles.tabActive]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <Icon emoji="🏠" label="Главная" focused={focused} /> }} />
      <Tabs.Screen name="leaks" options={{ tabBarIcon: ({ focused }) => <Icon emoji="💧" label="Утечки" focused={focused} /> }} />
      <Tabs.Screen name="advisor" options={{ tabBarIcon: ({ focused }) => <Icon emoji="🧠" label="ИИ" focused={focused} /> }} />
      <Tabs.Screen name="reports" options={{ tabBarIcon: ({ focused }) => <Icon emoji="📊" label="Отчёты" focused={focused} /> }} />
      <Tabs.Screen name="goals" options={{ tabBarIcon: ({ focused }) => <Icon emoji="🎯" label="Цели" focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, height: 70, paddingBottom: 8 },
  tab: { alignItems: 'center', paddingVertical: 4, opacity: 0.4 },
  tabActive: { opacity: 1 },
  emoji: { fontSize: 21 },
  label: { fontSize: 10, fontWeight: '500', color: colors.secondary, marginTop: 2 },
  labelActive: { color: colors.accent },
});
