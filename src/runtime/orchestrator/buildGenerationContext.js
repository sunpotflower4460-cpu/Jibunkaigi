// src/runtime/orchestrator/buildGenerationContext.js
// AI 応答生成に必要なコンテキストを構築するモジュール
//
// 責務:
// - context 構築
// - latestUserText 取得
// - afterglow seed 取得
// - others_field 生成
// - runInternalOS 実行
// - surface frame 構築

import { buildPromptContext } from '../context.js';
import { summarizeToOthersField, renderOthersFieldForPrompt, formatOthersFieldForDebug } from '../othersField.js';
import { runInternalOS } from '../runInternalOS.js';
import { buildSurfaceFrame } from '../surfaceTranslator.js';

/**
 * コンテキストを構築する
 */
export const buildContext = ({ messages, userName, agents, maxMessages = 6, maxCharsPerMessage = 180 }) => {
  return buildPromptContext({
    messages,
    userName,
    agents,
    maxMessages,
    maxCharsPerMessage,
  });
};

/**
 * 最新のユーザーテキストを取得する
 */
export const getLatestUserText = (sessionId, messages) => {
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) return '';
  const latest = userMessages[userMessages.length - 1];
  return latest.content || '';
};

/**
 * others_field を生成する
 */
export const buildOthersField = (messages, { pushAgentDebugEvent } = {}) => {
  const othersFieldEntries = [];
  for (const msg of messages) {
    if (msg?.role === 'ai' && msg.agentId && msg.content) {
      const entry = summarizeToOthersField(msg.agentId, msg.content);
      if (entry) {
        othersFieldEntries.push(entry);
      }
    }
  }

  const othersFieldText = renderOthersFieldForPrompt(othersFieldEntries, false);
  const othersFieldDebug = formatOthersFieldForDebug(othersFieldEntries);

  if (othersFieldDebug && pushAgentDebugEvent) {
    console.info("[others_field]", othersFieldDebug);
    pushAgentDebugEvent({ tag: 'others_field', count: othersFieldEntries.length, preview: othersFieldDebug });
  }

  return {
    othersFieldEntries,
    othersFieldText,
    othersFieldDebug,
  };
};

// NOTE: この関数は App.jsx との互換性のために残しているが、
// 実際には estimateMicroSignals を直接呼び出す方が望ましい

/**
 * runInternalOS を実行する
 */
export const runInternalOSForAgent = ({
  latestUserText,
  agentId,
  isMaster,
  selectedMode,
  safePreviousMix,
  safePreviousLatentState,
  othersFieldEntries,
  microSignals,
}) => {
  if (isMaster) {
    return null;
  }

  return runInternalOS(latestUserText, {
    agentId,
    mode: selectedMode,
    previousMix: safePreviousMix,
    previousLatentState: safePreviousLatentState,
    othersField: othersFieldEntries,
    lengthPreference: 'medium',
    microSignals,
  });
};

/**
 * surfaceFrame を構築する
 */
export const buildSurfaceFrameForAgent = ({
  continuityInternalOS,
  afterglowSeed,
  agentId,
  isMirror = false,
}) => {
  if (!continuityInternalOS) {
    return null;
  }

  return buildSurfaceFrame({
    latentState: continuityInternalOS.latentState,
    patternMix: continuityInternalOS.patternMix,
    surfaceWindow: continuityInternalOS.surfaceWindow,
    afterglowSeed,
    agentId,
    isMirror,
  });
};

/**
 * 世代コンテキスト全体を構築する
 */
export const buildFullGenerationContext = ({
  messages,
  userName,
  agents,
  agentId,
  isMaster,
  selectedMode,
  afterglowSeed,
  latestUserText,
  microSignals,
  pushAgentDebugEvent,
}) => {
  // A. context 構築
  const context = buildContext({ messages, userName, agents });

  // B. others_field 生成
  const { othersFieldEntries, othersFieldText, othersFieldDebug } = buildOthersField(messages, { pushAgentDebugEvent });

  // C. afterglow の正規化
  const safePreviousMix =
    afterglowSeed?.previousMix && typeof afterglowSeed.previousMix === 'object'
      ? afterglowSeed.previousMix
      : null;

  const safePreviousLatentState =
    afterglowSeed?.previousLatentState && typeof afterglowSeed.previousLatentState === 'object'
      ? afterglowSeed.previousLatentState
      : null;

  // D. runInternalOS
  const continuityInternalOS = runInternalOSForAgent({
    latestUserText,
    agentId,
    isMaster,
    selectedMode,
    safePreviousMix,
    safePreviousLatentState,
    othersFieldEntries,
    microSignals,
  });

  // E. surfaceFrame
  const surfaceFrame = buildSurfaceFrameForAgent({
    continuityInternalOS,
    afterglowSeed,
    agentId: isMaster ? 'master' : agentId,
    isMirror: isMaster,
  });

  return {
    context,
    othersFieldEntries,
    othersFieldText,
    continuityInternalOS,
    surfaceFrame,
    safePreviousMix,
    safePreviousLatentState,
  };
};
