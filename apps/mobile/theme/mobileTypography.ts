// Web版 design-tokens.css の --jk-type-* / --jk-leading-* に揃える。
//   --jk-type-hero: clamp(1.85rem, 4.3vw, 2.25rem)  → 30
//   --jk-type-body: 0.95rem                          → 15
//   --jk-type-body-secondary: 0.82rem                → 13
//   --jk-type-helper: 0.72rem                        → 11.5 → 11
//   --jk-type-label-small: 0.58rem                   → 9
export const mobileTypography = {
  title: 30,
  heading: 22,
  body: 15,
  small: 13,
  tiny: 11,
  /** .typo-label-small（トラッキングの広い極小ラベル） */
  label: 9,
} as const;

export const mobileLineHeights = {
  title: 36,
  heading: 28,
  /** --jk-leading-body: 1.75 */
  body: 26,
  compactBody: 22,
  /** --jk-leading-prose: 1.85（本文・メッセージ用） */
  prose: 28,
  small: 20,
  tiny: 16,
} as const;
