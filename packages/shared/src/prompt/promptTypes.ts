import type { UniversalAgentId } from '../agents';
import type { UniversalModeId } from '../modes';
import type { SurfacedMaterial } from '../toolEngine/engineTypes';

export interface UniversalPromptMessage {
  role: 'user' | 'agent';
  text: string;
  agentId?: UniversalAgentId;
  agentLabel?: string;
  modeId?: UniversalModeId;
  createdAt?: number;
  /** 'others' なら OTHERS（ほかの声）の反応。声の引き継ぎの見本には使わない。 */
  origin?: 'direct' | 'others';
}

export interface BuildUniversalConversationPromptParams {
  userText: string;
  agentId: UniversalAgentId;
  modeId: UniversalModeId;
  messages: UniversalPromptMessage[];
  userName?: string | null;
  /**
   * tool層（活性拡散）が出した浮上材料。渡されると「いま立ち上がっているもの」＋
   * 補正方針のブロックを、直近の会話と今回の入力の間に差し込む。
   */
  surfaced?: SurfacedMaterial;
  /**
   * このチャットの中でプロバイダの切り替えが起きたことがあるか（クライアント申告）。
   * true のときだけ、このエージェント自身の直近の返答を「これまでの声」として渡す。
   */
  voiceCarryover?: boolean;
}

/** 送り先モデルに応じて畳み方を変えるための、層に分けたプロンプト。 */
export interface UniversalPromptLayers {
  /** System一層目：鏡の原理（共通） */
  systemLayer1: string;
  /** System二層目：このエージェントの存在 */
  systemLayer2: string;
  /** Developer：場・許可・打ち消し（共通） */
  developer: string;
  /** 応答モード・共通返答方針・会話・tool材料・ユーザー入力・出力ルール */
  body: string;
}

/**
 * body を構成する各セクション（見出し込み）。split 送信で body を分解するために使う。
 * body は、空でないセクションを mode / policy / voice / history / inner / userInput / output の
 * 順に '\n\n' で連結したものと一致する。
 */
export interface UniversalPromptBodySections {
  /** ## 応答モード */
  mode: string;
  /** ## 共通返答方針 */
  policy: string;
  /** ## この会話での、あなたの声（声の引き継ぎ。無ければ空文字） */
  voice: string;
  /** ## 直近の会話 */
  history: string;
  /** tool層の材料（いま立ち上がっているもの＋補正）。点火なしなら空文字。 */
  inner: string;
  /** ## 今回のユーザー入力 */
  userInput: string;
  /** 今回のユーザー入力の本文だけ（見出しなし・サニタイズ済み）。 */
  userText: string;
  /** ## 出力 */
  output: string;
}

export interface UniversalBuiltPrompt {
  prompt: string;
  agentLabel: string;
  modeLabel: string;
  layers: UniversalPromptLayers;
  sections: UniversalPromptBodySections;
}
