/**
 * resolveOthersTarget
 *
 * Phase 3A: OTHERS リクエストの対象を解決するヘルパー。
 *
 * 従来の requestOthers は、messageId が user message でなければ lastUser に
 * フォールバックするだけだった。このヘルパーは以下の 3 ケースを扱う。
 *
 * 1. messageId が user message
 *    → その user text を userText として返す。excludeAgentId は null。
 *
 * 2. messageId が direct agent message（origin !== 'others'）
 *    → その直前の user message の text を userText として返す。
 *      excludeAgentId は その agent message の agentId（具体的な声を除外）。
 *
 * 3. messageId が others agent message（origin === 'others'）
 *    → null を返す（UI 側からは呼ばれない想定だが安全策として）。
 *
 * 4. messageId が undefined（手動パネルからの既存フロー）
 *    → lastUser の text を使い、excludeAgentId は呼び出し側が別途注入する。
 *    → ここでは { userText, excludeAgentId: undefined } を返す。
 *    → 呼び出し側で lastResolvedAgentIdRef.current ?? selectedAgent を補う。
 */

import type { ConcreteAgentId, UniversalAgentId } from '../agents';
import { isConcreteAgentId } from '../agents';

/** resolveOthersTarget に渡す最小限のメッセージ型 */
export interface OthersTargetMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  agentId?: UniversalAgentId;
  origin?: 'direct' | 'others';
}

export interface OthersTarget {
  /** OTHERS プロンプトに渡すユーザーテキスト */
  userText: string;
  /**
   * OTHERS から除外する agentId。
   * - agent message 直下から呼ばれた場合: その agentId（ConcreteAgentId）
   * - user message / messageId なし: undefined（呼び出し側で補完）
   */
  excludeAgentId?: ConcreteAgentId;
  /**
   * 対象となった user message の index（デバッグ・将来の拡張用）
   * @internal
   */
  _userMessageIndex?: number;
}

/**
 * OTHERS リクエストの対象（userText / excludeAgentId）を解決する。
 *
 * @param messages - 現在のメッセージ一覧（時系列順）
 * @param messageId - OTHERS を要求したメッセージの id（省略可）
 * @returns OthersTarget | null
 *   - null: 対象を解決できない場合（others origin の message 直下など）
 */
export function resolveOthersTarget(
  messages: OthersTargetMessage[],
  messageId?: string,
): OthersTarget | null {
  // ── ケース 4: messageId なし（手動パネルからの既存フロー）──────────────────
  if (messageId === undefined) {
    const lastUser = findLastUserMessage(messages);
    if (!lastUser) return null;
    return { userText: lastUser.text, excludeAgentId: undefined };
  }

  // ── 指定 messageId を探す ─────────────────────────────────────────────────
  const targetIndex = messages.findIndex((m) => m.id === messageId);
  if (targetIndex === -1) {
    // フォールバック: lastUser
    const lastUser = findLastUserMessage(messages);
    if (!lastUser) return null;
    return { userText: lastUser.text, excludeAgentId: undefined };
  }

  const target = messages[targetIndex];

  // ── ケース 1: user message ────────────────────────────────────────────────
  if (target.role === 'user') {
    return {
      userText: target.text,
      excludeAgentId: undefined,
      _userMessageIndex: targetIndex,
    };
  }

  // ── ケース 3: others agent message ───────────────────────────────────────
  // origin === 'others' の message からは OTHERS を出さない
  if (target.role === 'agent' && target.origin === 'others') {
    return null;
  }

  // ── ケース 2: direct agent message ───────────────────────────────────────
  if (target.role === 'agent') {
    // 直前の user message を探す（agent message より前の最新 user）
    const precedingUser = findLastUserMessageBefore(messages, targetIndex);
    if (!precedingUser) {
      // user message がまだない場合は対象なし
      return null;
    }

    // excludeAgentId: その agent message の agentId を優先
    const excludeAgentId: ConcreteAgentId | undefined =
      target.agentId && isConcreteAgentId(target.agentId)
        ? target.agentId
        : undefined;

    return {
      userText: precedingUser.text,
      excludeAgentId,
      _userMessageIndex: precedingUser.index,
    };
  }

  // 想定外の role は lastUser フォールバック
  const lastUser = findLastUserMessage(messages);
  if (!lastUser) return null;
  return { userText: lastUser.text, excludeAgentId: undefined };
}

// ─── private helpers ────────────────────────────────────────────────────────

function findLastUserMessage(
  messages: OthersTargetMessage[],
): { text: string; index: number } | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'user') {
      return { text: messages[i].text, index: i };
    }
  }
  return null;
}

function findLastUserMessageBefore(
  messages: OthersTargetMessage[],
  beforeIndex: number,
): { text: string; index: number } | null {
  for (let i = beforeIndex - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'user') {
      return { text: messages[i].text, index: i };
    }
  }
  return null;
}
