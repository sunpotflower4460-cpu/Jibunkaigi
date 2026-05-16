export type UniversalModeId =
  | 'flash'
  | 'dialogue'
  | 'deep';

export interface UniversalModeDefinition {
  id: UniversalModeId;
  label: string;
  shortLabel: string;
  emoji: string;
  description: string;
  replyStyle: string;
}

export const UNIVERSAL_MODES: UniversalModeDefinition[] = [
  {
    id: 'flash',
    label: '一閃',
    shortLabel: '一閃',
    emoji: '⚡',
    description: '短く、核心へ',
    replyStyle: '短く、余計に広げず、芯だけを見る',
  },
  {
    id: 'dialogue',
    label: '対話',
    shortLabel: '対話',
    emoji: '💬',
    description: '自然に、一緒に見る',
    replyStyle: '会話として自然に、相手の言葉から離れずに見る',
  },
  {
    id: 'deep',
    label: '深淵',
    shortLabel: '深淵',
    emoji: '🌊',
    description: '深く、奥まで潜る',
    replyStyle: '急がず、奥にある構造や感覚まで潜る',
  },
];

export function getUniversalMode(id: UniversalModeId): UniversalModeDefinition {
  const mode = UNIVERSAL_MODES.find((item) => item.id === id);
  if (!mode) {
    throw new Error(`Unknown universal mode: ${id}`);
  }
  return mode;
}
