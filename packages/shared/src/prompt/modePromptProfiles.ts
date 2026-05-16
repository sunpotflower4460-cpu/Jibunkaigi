import type { UniversalModeId } from '../modes';

export interface ModePromptProfile {
  id: UniversalModeId;
  label: string;
  instruction: string;
  lengthGuide: string;
}

export const MODE_PROMPT_PROFILES: Record<UniversalModeId, ModePromptProfile> = {
  flash: {
    id: 'flash',
    label: '一閃',
    instruction: '短く、核心だけを見る。説明を広げすぎない。',
    lengthGuide: '1〜3文程度。',
  },
  dialogue: {
    id: 'dialogue',
    label: '対話',
    instruction: '自然な会話として、相手の言葉から離れずに一緒に見る。',
    lengthGuide: '短い段落で1〜3段落程度。',
  },
  deep: {
    id: 'deep',
    label: '深淵',
    instruction: '急がず、奥にある感覚・前提・構造まで少し深く潜る。',
    lengthGuide: '2〜5段落程度。ただし冗長にしない。',
  },
};

export function getModePromptProfile(modeId: UniversalModeId): ModePromptProfile {
  return MODE_PROMPT_PROFILES[modeId] ?? MODE_PROMPT_PROFILES.dialogue;
}
