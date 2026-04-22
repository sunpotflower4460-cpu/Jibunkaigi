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

const AGENT_CONTEXT_MESSAGES = 3;
const AGENT_CONTEXT_CHARS = 180;

const weakenOthersFieldEntries = (othersFieldEntries = [], mode = 'thin') => {
  if (mode === 'off') return [];
  if (mode !== 'thin') return othersFieldEntries;

  return othersFieldEntries.map((entry) => ({
    agentId: entry.agentId,
    gist: entry.gist,
    toneTags: [],
    forceTags: [],
  }));
};

/**
 * コンテキストを構築する
 */
export const buildContext = ({
  messages,
  userName,
  agents,
  maxMessages = 6,
  maxCharsPerMessage = 180,
  userOnly = false,
}) => {
  return buildPromptContext({
    messages,
    userName,
    agents,
    maxMessages,
    maxCharsPerMessage,
    includeRoles: userOnly ? ['user'] : null,
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
export const buildOthersField = (messages, { pushAgentDebugEvent, mode = 'thin' } = {}) => {
  const collectedEntries = [];
  const seenAgents = new Set();
  // 直近の AI 発話を優先し、エージェントごとに 1 件、最大 3 件まで
  for (let i = messages.length - 1; i >= 0 && collectedEntries.length < 3; i -= 1) {
    const msg = messages[i];
    if (msg?.role !== 'ai' || !msg.agentId || !msg.content) continue;
    if (seenAgents.has(msg.agentId)) continue;

    const entry = summarizeToOthersField(msg.agentId, msg.content);
    if (entry) {
      collectedEntries.push(entry);
      seenAgents.add(msg.agentId);
    }
  }

  const othersFieldEntries = weakenOthersFieldEntries(collectedEntries, mode);
  const othersFieldText = renderOthersFieldForPrompt(othersFieldEntries, false, { mode });
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
  trace, // トレースオブジェクトを受け取る
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
    lengthPreference: selectedMode,
    microSignals,
    trace, // トレースを渡す
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
  othersFieldMode = 'thin',
  selectedMode,
  afterglowSeed,
  latestUserText,
  microSignals,
  pushAgentDebugEvent,
  trace, // トレースオブジェクトを受け取る
}) => {
  // A. context 構築
  const context = buildContext({
    messages,
    userName,
    agents,
    maxMessages: isMaster ? 6 : AGENT_CONTEXT_MESSAGES,
    maxCharsPerMessage: AGENT_CONTEXT_CHARS,
    userOnly: false,
  });

  // B. others_field 生成
  const { othersFieldEntries, othersFieldText } = buildOthersField(messages, {
    pushAgentDebugEvent,
    mode: isMaster ? 'structured' : othersFieldMode,
  });

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
    trace, // トレースを渡す
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
