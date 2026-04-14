// src/runtime/getOthersVisibilityState.js
// OTHERS セクションの表示条件を1か所に集約する。
// 目的: OTHERS がなぜ出る/出ないのかを明確にし、開発中は安定して観察できる状態にする。

/**
 * OTHERS セクションの表示状態と理由を判定する。
 *
 * @param {object} params
 * @param {string|null} [params.activeSessionId] - アクティブなセッションID
 * @param {boolean} [params.hasPromptForActiveSession] - アクティブセッションにプロンプトがあるか
 * @param {boolean} [params.isMessagesLoading] - メッセージ読み込み中か
 * @param {number} [params.visibleMessagesCount] - 表示可能なメッセージ数
 * @param {boolean} [params.compareModeEnabled] - Compare Mode が有効か
 * @param {object|null} [params.reactions] - reactions データ
 * @param {boolean} [params.isGenerating] - AI 生成中か
 *
 * @returns {object} 表示状態オブジェクト
 * @returns {boolean} returns.shouldRenderOthers - OTHERS セクションを表示すべきか
 * @returns {string} returns.reason - 表示/非表示の理由
 * @returns {boolean} returns.hasActiveSession - アクティブセッションがあるか
 * @returns {boolean} returns.hasPromptForActiveSession - プロンプトがあるか
 * @returns {boolean} returns.isMessagesLoading - メッセージ読み込み中か
 * @returns {number} returns.visibleMessagesCount - 表示可能なメッセージ数
 * @returns {number} returns.othersCount - OTHERS の候補数
 * @returns {boolean} returns.compareModeEnabled - Compare Mode が有効か
 * @returns {boolean} returns.shouldShowLoading - Loading 状態を表示すべきか
 * @returns {boolean} returns.hasReactionData - reactions データがあるか
 */
export const getOthersVisibilityState = ({
  activeSessionId = null,
  hasPromptForActiveSession = false,
  isMessagesLoading = false,
  visibleMessagesCount = 0,
  compareModeEnabled = false,
  reactions = null,
  isGenerating = false,
} = {}) => {
  const hasActiveSession = Boolean(activeSessionId);
  const hasReactionData = reactions && typeof reactions === 'object' && Object.keys(reactions).length > 0;
  const othersCount = hasReactionData ? Object.keys(reactions).length : 0;

  // 基本的な前提条件チェック
  if (!hasActiveSession) {
    return {
      shouldRenderOthers: false,
      reason: 'no-session',
      hasActiveSession: false,
      hasPromptForActiveSession: false,
      isMessagesLoading,
      visibleMessagesCount,
      othersCount: 0,
      compareModeEnabled,
      shouldShowLoading: false,
      hasReactionData: false,
    };
  }

  if (!hasPromptForActiveSession) {
    // Compare Mode 中は、プロンプトがなくても説明のため表示
    if (compareModeEnabled && visibleMessagesCount >= 1) {
      return {
        shouldRenderOthers: true,
        reason: 'no-prompt',
        hasActiveSession: true,
        hasPromptForActiveSession: false,
        isMessagesLoading,
        visibleMessagesCount,
        othersCount: 0,
        compareModeEnabled,
        shouldShowLoading: false,
        hasReactionData: false,
      };
    }

    return {
      shouldRenderOthers: false,
      reason: 'no-prompt',
      hasActiveSession: true,
      hasPromptForActiveSession: false,
      isMessagesLoading,
      visibleMessagesCount,
      othersCount: 0,
      compareModeEnabled,
      shouldShowLoading: false,
      hasReactionData: false,
    };
  }

  // メッセージが少なすぎる場合
  if (visibleMessagesCount < 1) {
    // Compare Mode 中は説明のため表示
    if (compareModeEnabled) {
      return {
        shouldRenderOthers: true,
        reason: 'no-visible-messages',
        hasActiveSession: true,
        hasPromptForActiveSession: true,
        isMessagesLoading,
        visibleMessagesCount,
        othersCount: 0,
        compareModeEnabled,
        shouldShowLoading: isMessagesLoading,
        hasReactionData: false,
      };
    }

    return {
      shouldRenderOthers: false,
      reason: 'no-visible-messages',
      hasActiveSession: true,
      hasPromptForActiveSession: true,
      isMessagesLoading,
      visibleMessagesCount,
      othersCount: 0,
      compareModeEnabled,
      shouldShowLoading: false,
      hasReactionData: false,
    };
  }

  // Compare Mode 中: loading 中でもセクションは表示
  if (compareModeEnabled) {
    if (isMessagesLoading) {
      return {
        shouldRenderOthers: true,
        reason: 'loading',
        hasActiveSession: true,
        hasPromptForActiveSession: true,
        isMessagesLoading: true,
        visibleMessagesCount,
        othersCount,
        compareModeEnabled,
        shouldShowLoading: true,
        hasReactionData,
      };
    }

    if (!hasReactionData && !isGenerating) {
      return {
        shouldRenderOthers: true,
        reason: 'no-candidates',
        hasActiveSession: true,
        hasPromptForActiveSession: true,
        isMessagesLoading: false,
        visibleMessagesCount,
        othersCount: 0,
        compareModeEnabled,
        shouldShowLoading: false,
        hasReactionData: false,
      };
    }

    if (hasReactionData) {
      return {
        shouldRenderOthers: true,
        reason: 'ok',
        hasActiveSession: true,
        hasPromptForActiveSession: true,
        isMessagesLoading: false,
        visibleMessagesCount,
        othersCount,
        compareModeEnabled,
        shouldShowLoading: false,
        hasReactionData: true,
      };
    }

    // 生成中の場合
    return {
      shouldRenderOthers: true,
      reason: 'generating',
      hasActiveSession: true,
      hasPromptForActiveSession: true,
      isMessagesLoading: false,
      visibleMessagesCount,
      othersCount,
      compareModeEnabled,
      shouldShowLoading: true,
      hasReactionData,
    };
  }

  // 通常モード: reactions データがある場合のみ表示
  if (hasReactionData) {
    return {
      shouldRenderOthers: true,
      reason: 'ok',
      hasActiveSession: true,
      hasPromptForActiveSession: true,
      isMessagesLoading,
      visibleMessagesCount,
      othersCount,
      compareModeEnabled: false,
      shouldShowLoading: false,
      hasReactionData: true,
    };
  }

  // 通常モード: reactions データなし
  return {
    shouldRenderOthers: false,
    reason: 'no-candidates',
    hasActiveSession: true,
    hasPromptForActiveSession: true,
    isMessagesLoading,
    visibleMessagesCount,
    othersCount: 0,
    compareModeEnabled: false,
    shouldShowLoading: false,
    hasReactionData: false,
  };
};

/**
 * OTHERS セクションの empty state メッセージを取得する。
 *
 * @param {string} reason - getOthersVisibilityState で返される reason
 * @param {boolean} compareModeEnabled - Compare Mode が有効か
 * @returns {string} 表示するメッセージ
 */
export const getOthersEmptyMessage = (reason, compareModeEnabled = false) => {
  switch (reason) {
    case 'no-session':
      return '会話を始めると OTHERS が表示されます';
    case 'no-prompt':
      return 'まず1回会話すると OTHERS が出ます';
    case 'no-visible-messages':
      return 'メッセージが読み込まれると OTHERS が表示されます';
    case 'loading':
      return '読み込み中です...';
    case 'generating':
      return '候補生成中...';
    case 'no-candidates':
      if (compareModeEnabled) {
        return 'まだ比較対象がありません';
      }
      return 'まだ比較対象がありません';
    case 'ok':
      return '';
    default:
      return compareModeEnabled
        ? 'Compare Mode で安定表示されます'
        : '';
  }
};

/**
 * OTHERS セクションの状態ラベルを取得する（デバッグ用）。
 *
 * @param {object} state - getOthersVisibilityState の返り値
 * @returns {string} 状態ラベル
 */
export const getOthersDebugLabel = (state) => {
  if (!state) return 'OTHERS: unknown';

  const { reason, othersCount, hasReactionData } = state;

  switch (reason) {
    case 'ok':
      return `OTHERS: ready (${othersCount})`;
    case 'loading':
      return 'OTHERS: loading';
    case 'generating':
      return 'OTHERS: generating';
    case 'no-prompt':
      return 'OTHERS: no prompt yet';
    case 'no-session':
      return 'OTHERS: no session';
    case 'no-visible-messages':
      return 'OTHERS: waiting for messages';
    case 'no-candidates':
      return hasReactionData
        ? `OTHERS: hidden (${othersCount} available)`
        : 'OTHERS: no candidates';
    default:
      return `OTHERS: ${reason}`;
  }
};
