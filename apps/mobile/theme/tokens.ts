import { mobileTheme } from './mobileTheme';

export { mobileTheme } from './mobileTheme';
export { mobileSpacing, mobileLayout, mobileTouchTarget } from './mobileSpacing';
export { mobileTypography, mobileLineHeights } from './mobileTypography';
export { mobileMotion } from './mobileMotion';

export const colors = {
  bgBase: mobileTheme.colors.background,
  bgDeep: mobileTheme.colors.backgroundDeep,
  inkStrong: mobileTheme.colors.textPrimary,
  inkMain: '#1f2937',
  inkSoft: mobileTheme.colors.textSecondary,
  inkMuted: mobileTheme.colors.textMuted,
  inkFaint: mobileTheme.colors.textFaint,
  inkGhost: mobileTheme.colors.textGhost,
  textOnAccent: mobileTheme.colors.textOnAccent,
  surfaceStrong: mobileTheme.colors.surface,
  surfaceSoft: mobileTheme.colors.surfaceMuted,
  surfaceFaint: mobileTheme.colors.surfaceFaint,
  surfacePressed: mobileTheme.colors.surfacePressed,
  borderSoft: mobileTheme.colors.borderSoft,
  borderSubtle: mobileTheme.colors.border,
  accentIndigo: mobileTheme.colors.accent,
  accentIndigoSoft: mobileTheme.colors.accentSoft,
  accentSurface: mobileTheme.colors.accentSurface,
  accentViolet: mobileTheme.colors.accentStrong,
  warningSurface: mobileTheme.colors.warningSurface,
  warningBorder: mobileTheme.colors.warningBorder,
  danger: mobileTheme.colors.danger,
  dangerSoft: mobileTheme.colors.dangerSoft,
  dangerBorder: mobileTheme.colors.dangerBorder,
  overlay: mobileTheme.colors.overlay,
  overlayStrong: mobileTheme.colors.overlayStrong,
};

export const radius = mobileTheme.radius;

export const spacing = {
  xs: mobileTheme.spacing.xs,
  sm: mobileTheme.spacing.sm,
  md: mobileTheme.spacing.md,
  lg: mobileTheme.spacing.lg,
  xl: mobileTheme.spacing.xl,
  xxl: mobileTheme.spacing.xxl,
};

export const type = mobileTheme.typography;

export const shadow = mobileTheme.shadow;
