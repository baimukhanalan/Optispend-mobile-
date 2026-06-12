export const colors = {
  background: '#F7F9FC',
  card: '#FFFFFF',
  text: '#172033',
  secondary: '#667085',
  accent: '#4F8CFF',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#E5EAF2',
  softBlue: '#EAF2FF',
  softGreen: '#EAFBF1',
  softRed: '#FEF2F2',
  softYellow: '#FEF3C7',
  muted: '#94A3B8',
  overlay: 'rgba(23, 32, 51, 0.6)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: '600' as const, color: colors.text },
  h2: { fontSize: 22, fontWeight: '600' as const, color: colors.text },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  h4: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, color: colors.secondary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.muted },
  label: { fontSize: 11, fontWeight: '500' as const, color: colors.secondary, letterSpacing: 0.5 },
  amount: { fontSize: 32, fontWeight: '600' as const, color: colors.text, letterSpacing: -0.5 },
  amountMd: { fontSize: 22, fontWeight: '600' as const, color: colors.text },
} as const;

export const shadows = {
  card: {
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  modal: {
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;
