import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Rect, Polyline } from 'react-native-svg';
import { colors, type as t, radius } from '../../src/lib/theme';

const C_ON  = colors.accent;
const C_OFF = 'rgba(0,0,0,0.28)';
const SW    = 1.6;

// ─── Icon components ──────────────────────────────────────────────────────────
const HomeIcon = ({ on }: { on: boolean }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"
      stroke={on ? C_ON : C_OFF} strokeWidth={SW} strokeLinejoin="round" />
    <Path d="M9 21V12h6v9" stroke={on ? C_ON : C_OFF} strokeWidth={SW} strokeLinecap="round" />
  </Svg>
);

const LeaksIcon = ({ on }: { on: boolean }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3C12 3 6 9 6 14a6 6 0 0 0 12 0C18 9 12 3 12 3z"
      stroke={on ? C_ON : C_OFF} strokeWidth={SW} strokeLinejoin="round" />
    <Line x1="9" y1="15" x2="11" y2="13" stroke={on ? C_ON : C_OFF} strokeWidth={SW} strokeLinecap="round" />
  </Svg>
);

const ReportsIcon = ({ on }: { on: boolean }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="3"
      stroke={on ? C_ON : C_OFF} strokeWidth={SW} />
    <Polyline points="7,16 10,11 13,14 16,8"
      stroke={on ? C_ON : C_OFF} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const GoalsIcon = ({ on }: { on: boolean }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke={on ? C_ON : C_OFF} strokeWidth={SW} />
    <Circle cx={12} cy={12} r={5} stroke={on ? C_ON : C_OFF} strokeWidth={SW} />
    <Circle cx={12} cy={12} r={1.5} fill={on ? C_ON : C_OFF} />
  </Svg>
);

const AdvisorIcon = ({ on }: { on: boolean }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      stroke={on ? C_ON : C_OFF} strokeWidth={SW} strokeLinejoin="round" />
  </Svg>
);

// ─── Tab item ─────────────────────────────────────────────────────────────────
function Tab({
  label, focused, Icon,
}: { label: string; focused: boolean; Icon: React.FC<{ on: boolean }> }) {
  return (
    <View style={styles.tab}>
      <Icon on={focused} />
      <Text style={[styles.label, focused && styles.labelOn]}>{label}</Text>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="index"
        options={{ tabBarIcon: ({ focused }) => <Tab label="Главная" focused={focused} Icon={({ on }) => <HomeIcon on={on} />} /> }} />
      <Tabs.Screen name="leaks"
        options={{ tabBarIcon: ({ focused }) => <Tab label="Утечки" focused={focused} Icon={({ on }) => <LeaksIcon on={on} />} /> }} />
      <Tabs.Screen name="advisor"
        options={{ tabBarIcon: ({ focused }) => <Tab label="Советник" focused={focused} Icon={({ on }) => <AdvisorIcon on={on} />} /> }} />
      <Tabs.Screen name="reports"
        options={{ tabBarIcon: ({ focused }) => <Tab label="Отчёты" focused={focused} Icon={({ on }) => <ReportsIcon on={on} />} /> }} />
      <Tabs.Screen name="goals"
        options={{ tabBarIcon: ({ focused }) => <Tab label="Цели" focused={focused} Icon={({ on }) => <GoalsIcon on={on} />} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 72,
    paddingBottom: 8,
  },
  tab: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  label: {
    ...t.xs,
    color: 'rgba(0,0,0,0.28)',
  },
  labelOn: {
    ...t.xsMd,
    color: colors.accent,
  },
});
