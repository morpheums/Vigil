export const Colors = {
  bg: '#080808',
  s1: '#111111',
  s2: '#181818',
  s3: '#202020',
  border: '#242424',
  border2: '#2e2e2e',
  accent: '#3DFFA0',
  accent10: 'rgba(61,255,160,0.10)',
  accent20: 'rgba(61,255,160,0.20)',
  warn: '#F5A623',
  danger: '#FF3B30',
  critical: '#FF2D55',
  t1: '#FFFFFF',
  t2: '#888888',
  t3: '#444444',
} as const;

export const NetworkColors: Record<string, string> = {
  ethereum: '#627EEA',
  solana: '#9945FF',
  tron: '#FF4040',
  'cosmoshub-4': '#6B75CA',
  'osmosis-1': '#750BBB',
  stellar: '#0099CC',
};

export const Fonts = {
  syneBold: 'Syne_700Bold',
  syneExtraBold: 'Syne_800ExtraBold',
  spaceMono: 'SpaceMono',
  interRegular: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemiBold: 'Inter_600SemiBold',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
} as const;

export const Radii = {
  card: 14,
  badge: 10,
  button: 12,
  sheet: 28,
} as const;
