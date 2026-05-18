import { mobileLayout, mobileSpacing, mobileTouchTarget } from './mobileSpacing';
import { mobileTypography, mobileLineHeights } from './mobileTypography';
import { mobileMotion } from './mobileMotion';

export const mobileColors = {
  background: '#eef4fb',
  backgroundDeep: '#d5e2f5',
  surface: 'rgba(255,255,255,0.92)',
  surfaceSoft: 'rgba(255,255,255,0.76)',
  surfaceMuted: 'rgba(255,255,255,0.64)',
  surfaceFaint: 'rgba(255,255,255,0.36)',
  surfacePressed: 'rgba(220,230,242,0.82)',
  border: 'rgba(148,163,184,0.22)',
  borderSoft: 'rgba(255,255,255,0.68)',
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  textGhost: '#cbd5e1',
  textOnAccent: '#ffffff',
  accent: '#6366f1',
  accentStrong: '#8b5cf6',
  accentSoft: 'rgba(99,102,241,0.16)',
  accentSurface: 'rgba(99,102,241,0.06)',
  warningSurface: 'rgba(245,158,11,0.14)',
  warningBorder: 'rgba(245,158,11,0.24)',
  danger: '#be123c',
  dangerSoft: 'rgba(244,114,182,0.08)',
  dangerBorder: 'rgba(244,114,182,0.18)',
  overlay: 'rgba(15,23,42,0.28)',
  overlayStrong: 'rgba(15,23,42,0.35)',
} as const;

export const mobileRadius = {
  xs: 10,
  sm: 14,
  md: 20,
  lg: 28,
  xl: 40,
  full: 9999,
} as const;

export const mobileShadow = {
  soft: {
    shadowColor: '#64748b',
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  card: {
    shadowColor: '#6366f1',
    shadowOpacity: 0.1,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6,
  },
} as const;

export const mobileTheme = {
  colors: mobileColors,
  radius: mobileRadius,
  spacing: mobileSpacing,
  typography: mobileTypography,
  lineHeights: mobileLineHeights,
  shadow: mobileShadow,
  motion: mobileMotion,
  layout: mobileLayout,
  touchTarget: mobileTouchTarget,
} as const;
