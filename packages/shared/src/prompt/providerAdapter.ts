import type { UniversalBuiltPrompt } from './promptTypes';

/** 送り先モデルがロールをどう扱うか。 */
export type ProviderRoleStyle =
  /** system に全部畳む（Gemini / DeepSeek / PLaMo / MiniMax など大多数） */
  | 'folded'
  /** system と developer を分けて送れる（GPT系） */
  | 'system-developer-split';

export interface ProviderMessages {
  system: string;
  /** 'system-developer-split' のときだけ入る */
  developer?: string;
  user: string;
}

export function toProviderMessages(
  built: UniversalBuiltPrompt,
  style: ProviderRoleStyle,
  userText: string,
): ProviderMessages {
  const { systemLayer1, systemLayer2, developer, body } = built.layers;

  if (style === 'system-developer-split') {
    return {
      system: [systemLayer1, systemLayer2].join('\n\n'),
      developer: [developer, body].join('\n\n'),
      user: userText,
    };
  }

  return {
    system: [systemLayer1, systemLayer2, developer, body].join('\n\n'),
    user: userText,
  };
}
