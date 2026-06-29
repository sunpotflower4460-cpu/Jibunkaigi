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

export interface UniversalBuiltPrompt {
  prompt: string;
  agentLabel: string;
  modeLabel: string;
}
