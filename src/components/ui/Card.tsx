import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { colors, radius, shadow } from '../../lib/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'danger' | 'success' | 'warning' | 'soft';
  noPadding?: boolean;
}

const variantBg: Record<string, string> = {
  default: colors.surface,
  danger:  colors.dangerLight,
  success: colors.successLight,
  warning: colors.warningLight,
  soft:    colors.accentLight,
};
const variantBorder: Record<string, string> = {
  default: colors.border,
  danger:  '#FECACA',
  success: '#BBF7D0',
  warning: '#FDE68A',
  soft:    '#BFDBFE',
};

export const Card: React.FC<CardProps> = ({
  children, style, variant = 'default', noPadding = false,
}) => (
  <View
    style={[
      styles.card,
      { backgroundColor: variantBg[variant], borderColor: variantBorder[variant] },
      !noPadding && styles.padding,
      shadow.xs,
      style,
    ]}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, marginBottom: 12 },
  padding: { padding: 16 },
});
