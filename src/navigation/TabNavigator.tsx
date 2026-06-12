import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { colors } from '../lib/theme';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Главная" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="leaks"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="💧" label="Утечки" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="advisor"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧠" label="ИИ" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Отчёты" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎯" label="Цели" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 70,
    paddingBottom: 8,
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 4,
    opacity: 0.45,
  },
  tabItemActive: { opacity: 1 },
  emoji: { fontSize: 22 },
  tabLabel: { fontSize: 10, fontWeight: '500', color: colors.secondary, marginTop: 2 },
  tabLabelActive: { color: colors.accent },
});
