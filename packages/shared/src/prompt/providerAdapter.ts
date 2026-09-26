import type { UniversalBuiltPrompt } from './promptTypes';
import type {
  ChatMessage,
  MaterialPlacement,
  RoleStyle,
} from '../providers/providerTypes';

/** 送り先モデルがロールをどう扱うか。 */
export type ProviderRoleStyle =
  /** system に確定テキスト3層を畳み、user に body（Gemini / DeepSeek / PLaMo / MiniMax など大多数） */
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

  // folded: 固定部分（確定テキスト3層）を system に置き、キャッシュを効かせる。
  // body は「今回のユーザー入力」を含むので、入力を user に重ねない（二重にしない）。
  return {
    system: [systemLayer1, systemLayer2, developer].join('\n\n'),
    user: body,
  };
}

/** 合成する tool 呼び出しの名前。材料を「設定」でなく「自分の内側を見た結果」として受け取らせる。 */
export const LOOK_INWARD_TOOL_NAME = 'look_inward';
export const LOOK_INWARD_TOOL_CALL_ID = 'call_look_inward';

/** リクエストの tools に含める look_inward の定義（tool_choice: 'none' と併用し、新たな呼び出しは起こさない）。 */
export const LOOK_INWARD_TOOL = {
  type: 'function' as const,
  function: {
    name: LOOK_INWARD_TOOL_NAME,
    description: 'いま自分の内側で立ち上がっているものを見る。',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
};

export interface ChatMessagesOptions {
  /** split のときの材料の置き場所。既定は 'tool'（合成した look_inward の結果として渡す）。 */
  materialPlacement?: MaterialPlacement;
}

/**
 * OpenAI 互換 Chat Completions 用のメッセージ列に変換する。
 *
 * folded: system = 一層目＋二層目＋Developer ／ user = body
 * split : system = 一層目＋二層目
 *         developer = Developer＋応答モード＋共通返答方針＋直近の会話＋出力
 *         assistant = look_inward の合成呼び出し ／ tool = 材料（点火なしなら両方省く）
 *         user = 今回のユーザー入力
 */
export function toChatMessages(
  built: UniversalBuiltPrompt,
  style: RoleStyle,
  options: ChatMessagesOptions = {},
): ChatMessage[] {
  const { systemLayer1, systemLayer2, developer } = built.layers;

  if (style === 'folded') {
    const folded = toProviderMessages(built, 'folded', built.sections.userText);
    return [
      { role: 'system', content: folded.system },
      { role: 'user', content: folded.user },
    ];
  }

  const { sections } = built;
  const placement = options.materialPlacement ?? 'tool';
  const hasMaterial = sections.inner.length > 0;
  const developerParts = [
    developer,
    sections.mode,
    sections.policy,
    sections.history,
    ...(hasMaterial && placement === 'developer' ? [sections.inner] : []),
    sections.output,
  ];

  const messages: ChatMessage[] = [
    { role: 'system', content: [systemLayer1, systemLayer2].join('\n\n') },
    { role: 'developer', content: developerParts.join('\n\n') },
  ];

  if (hasMaterial && placement === 'tool') {
    messages.push(
      {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: LOOK_INWARD_TOOL_CALL_ID,
            type: 'function',
            function: { name: LOOK_INWARD_TOOL_NAME, arguments: '{}' },
          },
        ],
      },
      { role: 'tool', tool_call_id: LOOK_INWARD_TOOL_CALL_ID, content: sections.inner },
    );
  }

  messages.push({ role: 'user', content: sections.userText });
  return messages;
}
