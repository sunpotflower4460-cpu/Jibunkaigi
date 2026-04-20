// src/runtime/compareMode/swapParticles.js
// 粒子入れ替えテストツール。
// selectedMixedClusters の primary と secondary を入れ替えた代替 latentState を生成し、
// 2つの応答を比較する。

import { runInternalOS } from '../runInternalOS.js';
import { buildSystemPrompt } from '../buildPromptHelpers.js';

/**
 * selectedMixedClusters の primary と secondary を入れ替える。
 *
 * @param {object} selectedMixedClusters - runInternalOS の結果から取得した selectedMixedClusters
 * @returns {object} 入れ替え後の selectedMixedClusters
 */
export const swapPrimarySecondary = (selectedMixedClusters = {}) => {
  if (!selectedMixedClusters || !Array.isArray(selectedMixedClusters.selected)) {
    return selectedMixedClusters;
  }

  const swapped = selectedMixedClusters.selected.map((cluster) => {
    if (!cluster || !cluster.primary || !cluster.secondary) {
      return cluster;
    }

    // primary と secondary を入れ替え
    return {
      ...cluster,
      primary: cluster.secondary,
      secondary: cluster.primary,
      swapped: true, // 入れ替えたことを記録
    };
  });

  return {
    ...selectedMixedClusters,
    selected: swapped,
    selectionMeta: {
      ...selectedMixedClusters.selectionMeta,
      swapped: true,
    },
  };
};

/**
 * 代替 latentState を生成する。
 * selectedMixedClusters を入れ替えたバージョンを作成。
 *
 * @param {object} originalLatentState - 元の latentState
 * @returns {object} 入れ替え後の latentState
 */
export const createSwappedLatentState = (originalLatentState = {}) => {
  if (!originalLatentState || !originalLatentState.selectedMixedClusters) {
    return originalLatentState;
  }

  const swappedClusters = swapPrimarySecondary(originalLatentState.selectedMixedClusters);

  return {
    ...originalLatentState,
    selectedMixedClusters: swappedClusters,
  };
};

/**
 * 粒子入れ替えテストを実行する。
 * デフォルト応答と粒子スワップ応答の両方を生成する。
 *
 * @param {object} params
 * @param {string} params.agentId - エージェントID
 * @param {string} params.userInput - ユーザー入力
 * @param {object} [params.options] - runInternalOS のオプション
 * @param {Function} params.callGemini - Gemini API 呼び出し関数
 * @param {string} [params.geminiModel] - 使用する Gemini モデル
 * @returns {Promise<object>} テスト結果
 */
export const runParticleSwapTest = async ({
  agentId,
  userInput,
  options = {},
  callGemini,
  geminiModel = 'gemini-2.0-flash-exp',
} = {}) => {
  if (!agentId || !userInput || !callGemini) {
    throw new Error('agentId, userInput, callGemini are required');
  }

  // 1. デフォルト応答を生成（通常の runInternalOS）
  const defaultInternalOS = runInternalOS(userInput, {
    ...options,
    agentId,
  });

  const defaultSystemPrompt = buildSystemPrompt({
    agentId,
    state: defaultInternalOS.latentState,
    patternMix: defaultInternalOS.patternMix,
  });

  const defaultResponse = await callGemini({
    prompt: userInput,
    systemInstruction: defaultSystemPrompt,
    model: geminiModel,
  });

  // 2. 粒子スワップ応答を生成
  const swappedLatentState = createSwappedLatentState(defaultInternalOS.latentState);

  const swappedSystemPrompt = buildSystemPrompt({
    agentId,
    state: swappedLatentState,
    patternMix: defaultInternalOS.patternMix,
  });

  const swappedResponse = await callGemini({
    prompt: userInput,
    systemInstruction: swappedSystemPrompt,
    model: geminiModel,
  });

  // 3. 結果を返す
  return {
    agentId,
    userInput,
    default: {
      response: defaultResponse,
      systemPrompt: defaultSystemPrompt,
      selectedClusters: defaultInternalOS.latentState.selectedMixedClusters,
    },
    swapped: {
      response: swappedResponse,
      systemPrompt: swappedSystemPrompt,
      selectedClusters: swappedLatentState.selectedMixedClusters,
    },
    debugInfo: {
      defaultInternalOS: defaultInternalOS.debugInfo,
    },
  };
};

/**
 * 2つの応答の差異を分析する（簡易版）。
 *
 * @param {string} defaultResponse - デフォルト応答
 * @param {string} swappedResponse - スワップ応答
 * @returns {object} 差異分析結果
 */
export const analyzeResponseDifference = (defaultResponse = '', swappedResponse = '') => {
  const defaultLength = defaultResponse.length;
  const swappedLength = swappedResponse.length;
  const lengthDiff = Math.abs(defaultLength - swappedLength);
  const lengthDiffPercent = defaultLength > 0 ? (lengthDiff / defaultLength) * 100 : 0;

  // 簡易的な類似度判定（文字数の差で判断）
  let similarity = 'identical';
  if (defaultResponse !== swappedResponse) {
    if (lengthDiffPercent < 10) {
      similarity = 'minimal';
    } else if (lengthDiffPercent < 30) {
      similarity = 'small';
    } else if (lengthDiffPercent < 60) {
      similarity = 'medium';
    } else {
      similarity = 'large';
    }
  }

  return {
    lengthDiff,
    lengthDiffPercent: lengthDiffPercent.toFixed(2),
    similarity,
    identical: defaultResponse === swappedResponse,
  };
};
