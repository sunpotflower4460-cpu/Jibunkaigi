export const mobileSpacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const mobileLayout = {
  compactViewport: 420,
  mediumViewport: 768,
  wideViewport: 1024,
  timelineMaxWidth: 720,
  panelMaxWidth: 760,
  onboardingMaxWidth: 480,
  drawerMaxWidth: 360,
  sheetMaxWidth: 560,
} as const;

export const mobileTouchTarget = {
  minimum: 44,
  comfortable: 52,
} as const;
