import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet,
  ViewStyle, TextStyle, ActivityIndicator, Platform,
} from 'react-native';
import { colors, radius, type as t } from '../../lib/theme';

interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  onPress, label, variant = 'primary', size = 'md',
  loading = false, disabled = false, style, textStyle,
}) => {
  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      import('expo-haptics').then(({ impactAsync, ImpactFeedbackStyle }) =>
        impactAsync(ImpactFeedbackStyle.Light)
      ).catch(() => {});
    }
  };

  return (
    <TouchableOpacity
      onPress={() => { triggerHaptic(); onPress(); }}
      disabled={disabled || loading}
      activeOpacity={0.82}
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : colors.accent} size="small" />
        : <Text style={[styles.text, textVariant[variant], sizeText[size], textStyle]}>{label}</Text>
      }
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  disabled: { opacity: 0.5 },
  text: { ...t.bodyMd },
});

const sizeStyles: Record<string, ViewStyle> = {
  sm: { paddingVertical: 8,  paddingHorizontal: 16, minHeight: 36 },
  md: { paddingVertical: 14, paddingHorizontal: 20, minHeight: 52 },
  lg: { paddingVertical: 16, paddingHorizontal: 24, minHeight: 58 },
};

const variantStyles: Record<string, ViewStyle> = {
  primary:   { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.accentLight, borderWidth: 1, borderColor: '#BFDBFE' },
  ghost:     { backgroundColor: 'transparent' },
  danger:    { backgroundColor: colors.danger },
};

const textVariant: Record<string, TextStyle> = {
  primary:   { color: '#fff' },
  secondary: { color: colors.accent },
  ghost:     { color: colors.accent },
  danger:    { color: '#fff' },
};

const sizeText: Record<string, TextStyle> = {
  sm: { fontSize: 13 },
  md: { fontSize: 15 },
  lg: { fontSize: 16 },
};
