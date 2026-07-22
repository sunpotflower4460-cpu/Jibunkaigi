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

export interface UniversalBuiltPrompt {
  prompt: string;
  agentLabel: string;
  modeLabel: string;
  layers: UniversalPromptLayers;
}
