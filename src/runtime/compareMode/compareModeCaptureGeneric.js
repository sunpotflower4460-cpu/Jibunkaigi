// src/runtime/compareMode/compareModeCaptureGeneric.js
// 汎用 Compare Mode キャプチャ関数。
// 全エージェントで Compare Mode を動作させるための共通関数。

import { buildBaselineSystemPrompt, buildBaselineUserPrompt } from './baselines/allAgents.js';

/**
 * Compare Mode キャプチャを実行する（全エージェント対応）。
 *
 * @param {object} params
 * @param {string} params.agentId - エージェントID (creative, soul, strategist, empath, critic)
 * @param {string} params.userText - ユーザー入力テキスト
 * @param {string} params.currentReply - 現行システムの応答
 * @param {string|Array} [params.context] - 会話履歴コンテキスト
 * @param {string} [params.sessionId] - セッションID
 * @param {string} [params.messageId] - メッセージID
 * @param {boolean} [params.usedInternalOS] - InternalOS を使用したか
 * @param {object} [params.internalOS] - InternalOS の実行結果
 * @param {string} [params.mode] - モード (short, medium, long)
 * @param {string} [params.userName] - ユーザー名
 * @param {Function} params.callGemini - Gemini API 呼び出し関数
 * @param {string} [params.geminiModel] - 使用する Gemini モデル
 * @param {Function} params.buildOuterGuidePrompt - Outer Guide プロンプト生成関数
 * @param {Function} params.buildCompareViewModel - Compare ViewModel 生成関数
 * @returns {Promise<object|null>} Compare Mode の結果
 */
export const runCompareModeCaptureGeneric = async ({
  agentId,
  userText,
  currentReply,
  context = '',
  sessionId = null,
  messageId = null,
  usedInternalOS = false,
  internalOS = null,
  mode = 'medium',
  userName = 'あなた',
  callGemini,
  geminiModel = 'gemini-2.0-flash-exp',
  buildOuterGuidePrompt,
  buildCompareViewModel,
} = {}) => {
  // 必須パラメータチェック
  if (!agentId || !userText || !currentReply || !callGemini || !buildOuterGuidePrompt || !buildCompareViewModel) {
    console.warn('[compareModeCaptureGeneric] Missing required parameters');
    return null;
  }

  // Baseline プロンプト構築
  const baselineSystem = buildBaselineSystemPrompt(agentId, { userText, mode, context });
  const baselineUser = buildBaselineUserPrompt(agentId, { userName, userText });

  if (!baselineSystem || !baselineUser) {
    console.warn(`[compareModeCaptureGeneric] No baseline definition for agentId: ${agentId}`);
    return null;
  }

  try {
    // 1. Baseline 応答を生成
    const baselineReply = await callGemini({
      prompt: baselineUser,
      systemInstruction: baselineSystem,
      model: geminiModel,
    });

    // 2. Outer Guide プロンプト構築
    const outerPrompts = buildOuterGuidePrompt({
      agentId,
      userText,
      baselineReply,
      currentReply,
      mode,
    });

    // 3. Outer Guide 応答を生成
    const outerGuide = await callGemini({
      prompt: outerPrompts.userPrompt,
      systemInstruction: outerPrompts.systemInstruction,
      model: geminiModel,
    });

    // 4. InternalOS のプレビュー情報を抽出
    const makerSeedPreview = internalOS?.latentState?.makerSeed ?? null;
    const homeLayerPreview = internalOS?.latentState?.home ?? null;
    const existenceLayerPreview = internalOS?.latentState?.existence ?? null;
    const beliefLayerPreview = internalOS?.latentState?.belief ?? null;
    const activatedThoughtsPreview = internalOS?.latentState?.activatedThoughts ?? null;
    const activatedFeelingsPreview = internalOS?.latentState?.activatedFeelings ?? null;
    const activatedMovesPreview = internalOS?.latentState?.activatedMoves ?? null;
    const preconditionFilterPreview = internalOS?.debugInfo?.preconditionFilterPreview ?? null;
    const preconditionBiasPreview = internalOS?.debugInfo?.preconditionBiasPreview ?? null;
    const feltSensePreview = internalOS?.debugInfo?.feltSensePreview ?? null;
    const speakIntentPreview = internalOS?.debugInfo?.speakIntentPreview ?? null;
    const restraintPreview = internalOS?.debugInfo?.restraintPreview ?? null;
    const decisionMetaPreview = internalOS?.debugInfo?.decisionMetaPreview ?? null;
    const layerBoundaryPreview = internalOS?.debugInfo
      ? {
          latentSubstrateBuilt: internalOS.debugInfo.latentSubstrateBuilt,
          preconditionFilterBuilt: internalOS.debugInfo.preconditionFilterBuilt,
          preconditionBiasBuilt: internalOS.debugInfo.preconditionBiasBuilt,
          dynamicFieldBuiltAfterLatent: internalOS.debugInfo.dynamicFieldBuiltAfterLatent,
          dynamicReactionBuiltAfterLatent: internalOS.debugInfo.dynamicReactionBuiltAfterLatent,
          dynamicStanceBuiltAfterLatent: internalOS.debugInfo.dynamicStanceBuiltAfterLatent,
          status: internalOS.debugInfo.layerBoundaryStatus ?? null,
        }
      : null;

    // 5. Compare ViewModel を構築
    const viewModel = buildCompareViewModel({
      agentId,
      userText,
      baselineReply,
      currentReply,
      outerGuide,
      currentUsesInternalOS: usedInternalOS,
      mode,
      revisionLabels: [], // 外部から注入する想定
      makerSeedPreview,
      homeLayerPreview,
      existenceLayerPreview,
      beliefLayerPreview,
      activatedThoughtsPreview,
      activatedFeelingsPreview,
      activatedMovesPreview,
      preconditionFilterPreview,
      preconditionBiasPreview,
      feltSensePreview,
      speakIntentPreview,
      restraintPreview,
      decisionMetaPreview,
      layerBoundaryPreview,
      focusBiasApplied: internalOS?.debugInfo?.focusBiasApplied ?? false,
      meaningBiasApplied: internalOS?.debugInfo?.meaningBiasApplied ?? false,
      identityBiasApplied: internalOS?.debugInfo?.identityBiasApplied ?? null,
    });

    return {
      ...viewModel,
      sessionId,
      messageId,
      compareKey: `${sessionId}:${messageId || 'compare'}`,
    };
  } catch (error) {
    console.error('[compareModeCaptureGeneric] Generation failed', error);
    throw error;
  }
};
