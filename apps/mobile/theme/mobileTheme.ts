import { Platform } from 'react-native';
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

// エージェントの色。Web版 src/agents/agentDefinitions.jsx の
// color / accentColor / borderColor（tailwind の *-50 / *-700 / *-100）と同値に揃える。
// トム・フィオは Web版に存在しないため、同じ体系（*-50 / *-700 / *-100）で拡張する。
export const mobileAgentPalette = {
  ray: {
    // bg-violet-50 / text-violet-700 / border-violet-100
    surface: '#f5f3ff',
    border: '#ede9fe',
    label: '#6d28d9',
  },
  joe: {
    // bg-orange-50 / text-orange-600 / border-orange-100
    surface: '#fff7ed',
    border: '#ffedd5',
    label: '#ea580c',
  },
  ken: {
    // bg-blue-50 / text-blue-700 / border-blue-100
    surface: '#eff6ff',
    border: '#dbeafe',
    label: '#1d4ed8',
  },
  mina: {
    // bg-rose-50 / text-rose-700 / border-rose-100
    surface: '#fff1f2',
    border: '#ffe4e6',
    label: '#be123c',
  },
  satou: {
    // bg-slate-100 / text-slate-700 / border-slate-200
    surface: '#f1f5f9',
    border: '#e2e8f0',
    label: '#334155',
  },
  tom: {
    // bg-amber-50 / text-amber-700 / border-amber-100
    surface: '#fffbeb',
    border: '#fef3c7',
    label: '#b45309',
  },
  fio: {
    // bg-teal-50 / text-teal-700 / border-teal-100
    surface: '#f0fdfa',
    border: '#ccfbf1',
    label: '#0f766e',
  },
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
  iconTile: {
    shadowColor: '#94a3b8',
    shadowOpacity: 0.32,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  ctaGlow: {
    shadowColor: '#060c22',
    shadowOpacity: 0.38,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  // .message-user の 0 20px 44px rgba(8,12,36,0.24) 相当。
  messageUser: {
    shadowColor: '#080c24',
    shadowOpacity: 0.24,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  // .floating-agent-rail の 0 8px 28px rgba(8,12,36,0.3) 相当。
  floatingRail: {
    shadowColor: '#080c24',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  // .header-shell の 0 14px 36px rgba(148,163,184,0.12) 相当。
  header: {
    shadowColor: '#94a3b8',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
} as const;

// グラデーション。Web版 premium-surfaces.css / design-tokens.css の値をそのまま移植する。
export const mobileGradients = {
  // .lake-bg の linear-gradient(176deg, ...) と同じ停止色。上が白く、下へ向かって青が差す。
  background: ['#f8fafd', '#f2f5fc', '#eaeff8', '#e3e9f6', '#dce4f3'] as const,
  backgroundLocations: [0, 0.28, 0.56, 0.8, 1] as const,
  // .icon-tile の radial-gradient 相当（左上から光を受ける白い霧ガラス）。
  iconTile: ['#ffffff', '#fcfeff', '#ecf4ff'] as const,
  // .cta-primary-surface / .action-primary / .message-user 系の紺グラデーション。
  cta: ['#060c22', '#0d1830', '#162040', '#1c2b48', '#263856'] as const,
  // .message-user（ユーザー発言の吹き出し）。
  messageUser: ['#080c24', '#0e1634', '#142040', '#1c284a'] as const,
  // .floating-agent-rail / .floating-agent-toggle の濃紺レール。
  floatingRail: ['#0e163a', '#141e44'] as const,
  // .delegate-chip（委ねる）の violet → indigo。
  delegate: ['#7c3aed', '#6366f1'] as const,
  // .mirror-chip（心の鏡）。
  mirror: ['#1e293b', '#243046'] as const,
} as const;

// 明朝体。Web版 --jk-font-serif と同じ意図（詩的な見出し・キャッチコピー専用）。
// iOS はヒラギノ明朝、Android は端末内蔵の serif にフォールバックする。
export const mobileFonts = {
  serif: Platform.select({
    ios: 'Hiragino Mincho ProN',
    android: 'serif',
    default: 'serif',
  }) as string,
} as const;

export const mobileTheme = {
  colors: mobileColors,
  agentPalette: mobileAgentPalette,
  radius: mobileRadius,
  spacing: mobileSpacing,
  typography: mobileTypography,
  lineHeights: mobileLineHeights,
  shadow: mobileShadow,
  gradients: mobileGradients,
  fonts: mobileFonts,
  motion: mobileMotion,
  layout: mobileLayout,
  touchTarget: mobileTouchTarget,
} as const;
