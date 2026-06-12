import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { colors, radius, shadows } from '../../lib/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'danger' | 'success' | 'warning' | 'soft';
  noPadding?: boolean;
}

const variantStyles: Record<string, { background: string; borderColor: string }> = {
  default: { background: colors.card, borderColor: colors.border },
  danger: { background: colors.softRed, borderColor: '#FECACA' },
  success: { background: colors.softGreen, borderColor: '#BBF7D0' },
  warning: { background: colors.softYellow, borderColor: '#FDE68A' },
  soft: { background: colors.softBlue, borderColor: '#BFDBFE' },
};

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  noPadding = false,
}) => {
  const v = variantStyles[variant];
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: v.background, borderColor: v.borderColor },
        !noPadding && styles.padding,
        shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 12,
  },
  padding: {
    padding: 16,
  },
});
