// Design system — OptiSpend
// Palette: near-black onboarding → clean white main app

export const colors = {
  // Onboarding (dark)
  void:         '#000000',
  ink:          '#0A0B10',
  inkSurface:   '#111318',
  inkBorder:    'rgba(255,255,255,0.08)',
  inkText:      '#FFFFFF',
  inkMuted:     'rgba(255,255,255,0.45)',

  // Main app (light)
  bg:           '#F5F5F7',
  surface:      '#FFFFFF',
  surfaceAlt:   '#F0F0F2',
  border:       '#E4E4E7',
  borderStrong: '#CACACE',

  // Typography
  text:         '#111111',
  secondary:    '#6B6B6B',
  muted:        '#A0A0A0',
  placeholder:  '#C0C0C0',

  // Brand
  accent:       '#2563EB',
  accentLight:  '#EFF6FF',
  accentHover:  '#1D4ED8',

  // Semantic
  success:      '#16A34A',
  successLight: '#F0FDF4',
  danger:       '#DC2626',
  dangerLight:  '#FEF2F2',
  warning:      '#D97706',
  warningLight: '#FFFBEB',

  // Backward-compat aliases (old screens)
  background:  '#F5F5F7',
  card:        '#FFFFFF',
  softBlue:    '#EFF6FF',
  softGreen:   '#F0FDF4',
  softYellow:  '#FFFBEB',
  softRed:     '#FEF2F2',
} as const;

export const spacing = {
  2:  2,
  4:  4,
  6:  6,
  8:  8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
  64: 64,
} as const;

export const radius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  full: 9999,
} as const;

export const fonts = {
  regular:  'Inter-Regular',
  medium:   'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold:     'Inter-Bold',
} as const;

export const type = {
  d1:      { fontFamily: 'Inter-Bold',     fontSize: 44, letterSpacing: -1.5, lineHeight: 50 },
  d2:      { fontFamily: 'Inter-Bold',     fontSize: 36, letterSpacing: -1.2, lineHeight: 42 },
  h1:      { fontFamily: 'Inter-Bold',     fontSize: 28, letterSpacing: -0.8, lineHeight: 34 },
  h2:      { fontFamily: 'Inter-SemiBold', fontSize: 22, letterSpacing: -0.5, lineHeight: 28 },
  h3:      { fontFamily: 'Inter-SemiBold', fontSize: 18, letterSpacing: -0.3, lineHeight: 24 },
  h4:      { fontFamily: 'Inter-SemiBold', fontSize: 16, letterSpacing: -0.2, lineHeight: 22 },
  body:    { fontFamily: 'Inter-Regular',  fontSize: 15, lineHeight: 23 },
  bodyMd:  { fontFamily: 'Inter-Medium',   fontSize: 15, lineHeight: 23 },
  sm:      { fontFamily: 'Inter-Regular',  fontSize: 13, lineHeight: 19 },
  smMd:    { fontFamily: 'Inter-Medium',   fontSize: 13, lineHeight: 19 },
  xs:      { fontFamily: 'Inter-Regular',  fontSize: 11, lineHeight: 16 },
  xsMd:    { fontFamily: 'Inter-Medium',   fontSize: 11, lineHeight: 16, letterSpacing: 0.4 },
  mono:    { fontFamily: 'Inter-Regular',  fontSize: 14, letterSpacing: -0.2 },
} as const;

export const shadow = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

// ─── Backward-compat aliases (old screens use these names) ────────────────────
// Old color names → new tokens
export const legacyColors = {
  background:  colors.bg,
  card:        colors.surface,
  softBlue:    colors.accentLight,
  softGreen:   colors.successLight,
  softYellow:  colors.warningLight,
  softRed:     colors.dangerLight,
  secondary:   colors.secondary,
  muted:       colors.muted,
};

// Old `typography` export
export const typography = {
  h1:        type.h1,
  h2:        type.h2,
  h3:        type.h3,
  h4:        type.h4,
  body:      type.body,
  bodySmall: type.sm,
  caption:   type.xs,
  label:     type.xsMd,
};

// Old `shadows` export
export const shadows = { card: shadow.xs };

// Legacy compat — screens that still use the old { theme } import
export const theme = {
  colors: { ...colors, ...legacyColors },
  spacing,
  radius,
  fonts,
  type,
  typography,
  shadow,
} as const;
