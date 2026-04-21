// src/runtime/orchestrator/handleAgentResponse.js
// AI 応答オーケストレーション のメインモジュール
//
// 責務:
// - AI 応答生成の全体フロー制御
// - エラー処理の統一
// - phase 別の処理分離
// - App.jsx から独立した AI 応答ロジック

import { estimateState } from '../stateEstimate.js';
import { estimateMicroSignals } from '../estimateMicroSignals.js';
import { activateAgent } from '../activateAgent.js';
import { buildAgentSystemPrompt, buildAgentUserPrompt, buildAgentDebugPreview } from '../buildAgentPrompt.js';
import { buildAgentStateGuide } from '../buildAgentStateGuide.js';
import { buildAgentInternalFrame } from '../buildAgentInternalFrame.js';
import { buildAgentSurfaceGuidance } from '../buildAgentSurfaceGuidance.js';
import { buildMirrorSystemPrompt, buildMirrorUserPrompt, selectMirrorSignals } from '../mirror.js';
import { buildMirrorStateGuide } from '../buildMirrorStateGuide.js';
import { buildMirrorInternalFrame } from '../buildMirrorInternalFrame.js';
import { buildMirrorSurfaceGuidance } from '../buildMirrorSurfaceGuidance.js';
import { getAfterglowSeed } from '../afterglow.js';
import { checkResponse, cleanResponse } from '../postCheck.js';
import { shouldRefresh, applyRefresh } from '../refreshPolicy.js';
import { buildSurfaceDebugEntry } from '../surfaceDebug.js';
import { buildJoeDebugEntry } from '../debug/buildJoeDebugEntry.js';
import { isJoeDebugAvailable } from '../joeDebug.js';
import { buildFullGenerationContext, getLatestUserText as extractLatestUserText } from './buildGenerationContext.js';
import { persistAgentResponse } from './persistAgentResponse.js';

/**
 * プロンプト構築パラメータを作成する（通常エージェント用）
 */
const buildAgentPromptParams = ({
  agentId,
  estimatedState,
  microSignals,
  continuityInternalOS,
  afterglowSeed,
  othersFieldEntries,
  context,
  selectedMode,
  latestUserText,
  surfaceFrame,
  userName,
  messages,
  agent,
  activated,
  agentStateGuide,
  agentInternalFrame,
  agentSurfaceGuidance,
  othersFieldText,
}) => {
  return {
    activated,
    context,
    mode: selectedMode,
    userText: latestUserText,
    internalOS: continuityInternalOS,
    surfaceFrame,
    stateGuide: agentStateGuide,
    internalFrame: agentInternalFrame,
    surfaceGuidance: agentSurfaceGuidance,
    othersField: othersFieldText,
  };
};

/**
 * Mirror 専用のプロンプト構築パラメータを作成する
 */
const buildMirrorPromptParams = ({
  messages,
  userName,
  agents,
  latestUserText,
  continuityInternalOS,
  afterglowSeed,
  selectedMode,
  othersFieldText,
}) => {
  const mirrorContext = {
    messages,
    userName,
    agents,
    maxMessages: 4,
    maxCharsPerMessage: 150,
  };

  const signals = selectMirrorSignals({
    messages,
    agents,
    latestUserText,
  });

  const mirrorSurfaceFrame = continuityInternalOS
    ? {
        latentState: continuityInternalOS.latentState,
        patternMix: continuityInternalOS.patternMix,
        surfaceWindow: continuityInternalOS.surfaceWindow,
        afterglowSeed,
        agentId: 'master',
        isMirror: true,
      }
    : null;

  const mirrorStateGuide = buildMirrorStateGuide(signals);
  const mirrorInternalFrame = continuityInternalOS ? buildMirrorInternalFrame({
    internalOS: continuityInternalOS,
  }) : '';
  const mirrorSurfaceGuidance = mirrorSurfaceFrame ? buildMirrorSurfaceGuidance(mirrorSurfaceFrame) : '';

  return {
    context: mirrorContext,
    signals,
    mirrorSurfaceFrame,
    mirrorStateGuide,
    mirrorInternalFrame,
    mirrorSurfaceGuidance,
    othersField: othersFieldText,
  };
};

/**
 * AI 応答オーケストレーション本体
 *
 * @param {object} params - オーケストレーション用のパラメータ
 * @returns {Promise<object>} - 結果オブジェクト
 */
export const handleAgentResponse = async ({
  // 基本情報
  agentId,
  isMaster,
  sessionId,
  sourceMessageId,
  messagesAtClick,
  traceId,

  // エージェント定義
  agent,
  AGENTS,

  // ユーザー情報
  userName,

  // DB/Firebase
  db,
  user,
  appId,

  // 設定・モード
  selectedMode,

  // セッション状態
  activeSessionIdRef,
  lastSubmittedUserMessageRef,
  afterglowBySessionRef,

  // コールバック・ヘルパー
  callGemini,
  makeId,
  pushAgentDebugEvent,
  pushSurfaceDebugEntry,
  setJoeDebugEntry,
  isJoeDebugPanelVisible,
  readSessionAfterglow,
  writeSessionAfterglowLocal,
  safeUpdateSession,
  measureFirestoreWrite,
  beginTimedPhase,

  // UI 更新コールバック
  onStateUpdate,
  onOptimisticMessageAdd,
  onError,
}) => {
  const aiDebugState = {
    agentId,
    sessionId,
    hasDb: !!db,
    hasUser: !!user,
    hasSessionId: !!sessionId,
    activeSessionMatches: activeSessionIdRef.current === sessionId,
    isMaster,
  };

  console.info("[ai-response:start]", aiDebugState);
  pushAgentDebugEvent({ tag: 'ai-response:start', agentId, sessionId, hasDb: !!db, hasUser: !!user, hasSessionId: !!sessionId });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 事前検証
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!db || !user || !sessionId) {
    const missing = { db: !db, user: !user, sessionId: !sessionId };
    const missingKeys = Object.keys(missing).filter(k => missing[k]);
    const reason = `missing:${missingKeys.join(',')}`;
    console.warn("[ai-response:early-return]", { reason, ...aiDebugState });
    pushAgentDebugEvent({ tag: 'ai-response:early-return', reason, agentId, sessionId, missing });

    throw new Error(`応答を開始できませんでした (${reason})`);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase エラーハンドラー
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handlePhaseError = (phase, err) => {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`[ai-response:error] phase=${phase}`, err);
    pushAgentDebugEvent({
      tag: 'ai-response:error',
      phase,
      reason,
      agentId,
      sessionId,
      currentSessionId: activeSessionIdRef.current,
      activeSessionMatches: activeSessionIdRef.current === sessionId
    });

    let errorMessage = '';
    if (phase === 'system-prompt' || phase === 'user-prompt') {
      errorMessage = 'AIプロンプトの構築に失敗しました';
    } else if (phase === 'activate-agent') {
      errorMessage = '「委ねる」の処理中にエラーが発生しました';
    } else if (phase === 'internal-os') {
      errorMessage = '内部処理でエラーが発生しました';
    } else {
      errorMessage = '応答の準備中にエラーが発生しました';
    }

    throw new Error(`${errorMessage} (phase=${phase}): ${reason}`);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // メッセージリストの準備
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const pending = lastSubmittedUserMessageRef.current;
  const baseMessages = [...messagesAtClick];

  const hasPendingUserInThisSession =
    pending &&
    pending.sessionId === sessionId &&
    pending.messageId === sourceMessageId &&
    !baseMessages.some(m => m.id === pending.messageId);

  if (hasPendingUserInThisSession) {
    baseMessages.push({
      id: pending.messageId,
      role: 'user',
      content: pending.text,
      clientCreatedAt: Date.now()
    });
  }

  const finishPromptBuild = beginTimedPhase(traceId, 'prompt build');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase 1: コンテキスト構築
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const latestUserText = extractLatestUserText(sessionId, baseMessages);
  const afterglowSeed = getAfterglowSeed(readSessionAfterglow(sessionId));
  const microSignals = estimateMicroSignals(latestUserText);

  let context, othersFieldEntries, othersFieldText, continuityInternalOS, surfaceFrame;

  try {
    const generationContext = buildFullGenerationContext({
      messages: baseMessages,
      userName,
      agents: AGENTS,
      agentId,
      isMaster,
      selectedMode,
      afterglowSeed,
      latestUserText,
      microSignals,
      pushAgentDebugEvent,
    });

    context = generationContext.context;
    othersFieldEntries = generationContext.othersFieldEntries;
    othersFieldText = generationContext.othersFieldText;
    continuityInternalOS = generationContext.continuityInternalOS;
    surfaceFrame = generationContext.surfaceFrame;
  } catch (err) {
    handlePhaseError('context-build', err);
  }

  const currentSessionId = activeSessionIdRef.current;
  const activeSessionMatches = currentSessionId === sessionId;
  const _debugBase = { agentId, sessionId, currentSessionId, activeSessionMatches };

  console.info("[ai-response:after-context]", _debugBase);
  pushAgentDebugEvent({
    tag: 'ai-response:after-context',
    ..._debugBase,
    messagesAtClickCount: messagesAtClick.length,
    mode: selectedMode
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase 2: プロンプト構築
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let systemInstruction = '';
  let promptText = `${userName}に言葉を。`;
  let estimatedState = null;
  let activated = null;

  if (isMaster) {
    // Mirror パス
    try {
      const mirrorParams = buildMirrorPromptParams({
        messages: baseMessages,
        userName,
        agents: AGENTS,
        latestUserText,
        continuityInternalOS,
        afterglowSeed,
        selectedMode,
        othersFieldText,
      });

      systemInstruction = buildMirrorSystemPrompt({
        context: mirrorParams.context,
        mode: selectedMode,
        signals: mirrorParams.signals,
        surfaceFrame: mirrorParams.mirrorSurfaceFrame,
        stateGuide: mirrorParams.mirrorStateGuide,
        internalFrame: mirrorParams.mirrorInternalFrame,
        surfaceGuidance: mirrorParams.mirrorSurfaceGuidance,
        othersField: mirrorParams.othersField,
      });

      promptText = buildMirrorUserPrompt({ userName, userText: latestUserText });

      const mirrorUsedAfterglow = !!(
        afterglowSeed && (afterglowSeed.previousMix || afterglowSeed.previousLatentState)
      );

      pushSurfaceDebugEntry(buildSurfaceDebugEntry({
        agentId: 'master',
        isMirror: true,
        selectedMode,
        latestUserText,
        continuityInternalOS,
        surfaceFrame: mirrorParams.mirrorSurfaceFrame,
        afterglowSeed,
        agentQualityPreview: {
          agentId: 'master',
          builderUsed: 'mirror-specialized',
          dominantAxes: [],
          stateGuidePreview: mirrorParams.mirrorStateGuide ? mirrorParams.mirrorStateGuide.slice(0, 140) : '',
          internalFramePreview: mirrorParams.mirrorInternalFrame ? mirrorParams.mirrorInternalFrame.slice(0, 140) : '',
          surfaceGuidancePreview: mirrorParams.mirrorSurfaceGuidance ? mirrorParams.mirrorSurfaceGuidance.slice(0, 140) : '',
          activatedBiasCount: 0,
          usedAfterglow: mirrorUsedAfterglow,
        },
      }));

      // Mirror path: emit milestones
      console.info("[ai-response:after-estimate-state]", _debugBase);
      pushAgentDebugEvent({ tag: 'ai-response:after-estimate-state', ..._debugBase });
      console.info("[ai-response:after-activate-agent]", _debugBase);
      pushAgentDebugEvent({ tag: 'ai-response:after-activate-agent', ..._debugBase });
      console.info("[ai-response:after-state-guide]", _debugBase);
      pushAgentDebugEvent({ tag: 'ai-response:after-state-guide', ..._debugBase });
      console.info("[ai-response:after-internal-frame]", _debugBase);
      pushAgentDebugEvent({ tag: 'ai-response:after-internal-frame', ..._debugBase });
      console.info("[ai-response:after-surface-guidance]", _debugBase);
      pushAgentDebugEvent({ tag: 'ai-response:after-surface-guidance', ..._debugBase });
      console.info("[ai-response:after-system-prompt]", { ..._debugBase, systemInstructionLength: systemInstruction.length });
      pushAgentDebugEvent({ tag: 'ai-response:after-system-prompt', ..._debugBase, systemInstructionLength: systemInstruction.length });
      console.info("[ai-response:after-user-prompt]", { ..._debugBase, promptLength: promptText.length });
      pushAgentDebugEvent({ tag: 'ai-response:after-user-prompt', ..._debugBase, promptLength: promptText.length });
    } catch (err) {
      handlePhaseError('mirror-prompt-build', err);
    }
  } else {
    // 通常エージェントパス
    // C. estimateState
    try {
      estimatedState = estimateState(latestUserText);
    } catch (err) {
      handlePhaseError('estimate-state', err);
    }
    console.info("[ai-response:after-estimate-state]", _debugBase);
    pushAgentDebugEvent({ tag: 'ai-response:after-estimate-state', ..._debugBase });

    // D. activateAgent
    try {
      activated = activateAgent(agentId, estimatedState, {
        microSignals,
        beliefTension: continuityInternalOS?.latentState?.beliefTension ?? null,
        afterglowSeed,
        othersField: othersFieldEntries,
      });
    } catch (err) {
      handlePhaseError('activate-agent', err);
    }
    console.info("[ai-response:after-activate-agent]", _debugBase);
    pushAgentDebugEvent({ tag: 'ai-response:after-activate-agent', ..._debugBase });

    // E. buildAgentStateGuide
    let agentStateGuide;
    try {
      agentStateGuide = buildAgentStateGuide(agentId, estimatedState);
    } catch (err) {
      handlePhaseError('state-guide', err);
    }
    console.info("[ai-response:after-state-guide]", _debugBase);
    pushAgentDebugEvent({ tag: 'ai-response:after-state-guide', ..._debugBase });

    // F. buildAgentInternalFrame
    let agentInternalFrame;
    try {
      agentInternalFrame = continuityInternalOS ? buildAgentInternalFrame({
        agentId,
        internalOS: continuityInternalOS,
        estimatedState,
      }) : '';
    } catch (err) {
      handlePhaseError('internal-frame', err);
    }
    console.info("[ai-response:after-internal-frame]", _debugBase);
    pushAgentDebugEvent({ tag: 'ai-response:after-internal-frame', ..._debugBase });

    // G. buildAgentSurfaceGuidance
    let agentSurfaceGuidance;
    try {
      agentSurfaceGuidance = surfaceFrame ? buildAgentSurfaceGuidance({
        agentId,
        surfaceFrame,
      }) : '';
    } catch (err) {
      handlePhaseError('surface-guidance', err);
    }
    console.info("[ai-response:after-surface-guidance]", { ..._debugBase, hasSurfaceFrame: !!surfaceFrame });
    pushAgentDebugEvent({ tag: 'ai-response:after-surface-guidance', ..._debugBase, hasSurfaceFrame: !!surfaceFrame });

    // H. buildAgentSystemPrompt
    try {
      systemInstruction = buildAgentSystemPrompt(agentId, {
        activated,
        context,
        mode: selectedMode,
        userText: latestUserText,
        internalOS: continuityInternalOS,
        surfaceFrame,
        stateGuide: agentStateGuide,
        internalFrame: agentInternalFrame,
        surfaceGuidance: agentSurfaceGuidance,
        othersField: othersFieldText,
      });
    } catch (err) {
      handlePhaseError('system-prompt', err);
    }
    console.info("[ai-response:after-system-prompt]", { ..._debugBase, systemInstructionLength: systemInstruction.length });
    pushAgentDebugEvent({ tag: 'ai-response:after-system-prompt', ..._debugBase, systemInstructionLength: systemInstruction.length });

    // I. buildAgentUserPrompt
    try {
      promptText = buildAgentUserPrompt(agentId, { userName, userText: latestUserText });
    } catch (err) {
      handlePhaseError('user-prompt', err);
    }
    console.info("[ai-response:after-user-prompt]", { ..._debugBase, promptLength: promptText.length });
    pushAgentDebugEvent({ tag: 'ai-response:after-user-prompt', ..._debugBase, promptLength: promptText.length });

    const hasSelectedAfterglowMix = (mix) => {
      if (!mix || !mix.selected) return false;
      if (Array.isArray(mix.selected)) return mix.selected.length > 0;
      if (typeof mix.selected === 'object') return Object.keys(mix.selected).length > 0;
      return Boolean(mix.selected);
    };

    const agentUsedAfterglow = !!(
      afterglowSeed && (
        hasSelectedAfterglowMix(afterglowSeed.previousMix) ||
        afterglowSeed.previousLatentState
      )
    );

    const agentQualityPreview = buildAgentDebugPreview({
      agentId,
      activated,
      userText: latestUserText,
      stateGuide: agentStateGuide,
      internalFrame: agentInternalFrame,
      surfaceGuidance: agentSurfaceGuidance,
      usedAfterglow: agentUsedAfterglow,
    });

    pushSurfaceDebugEntry(buildSurfaceDebugEntry({
      agentId,
      isMirror: false,
      selectedMode,
      latestUserText,
      continuityInternalOS,
      surfaceFrame,
      afterglowSeed,
      agentQualityPreview,
    }));
  }

  finishPromptBuild();

  // Apply drift-prevention refresh
  if (!isMaster && shouldRefresh(messagesAtClick, agentId)) {
    const refreshText = `あなたは${agent.name}として、上記の設定・活性状態・口調を維持し、一貫した応答を続けてください。`;
    systemInstruction = applyRefresh(systemInstruction, refreshText);
  }

  // Joe debug entry の構築
  setJoeDebugEntry(buildJoeDebugEntry({
    timestamp: Date.now(),
    userText: latestUserText,
    estimateState: estimatedState,
    microSignals,
    microSignalBias: continuityInternalOS?.debugInfo?.microSignalBias ?? null,
    fusedState: continuityInternalOS?.latentState?.fusedState ?? null,
    protoMeaning: continuityInternalOS?.latentState?.protoMeaning ?? null,
    activated,
    systemInstruction,
    promptText,
  }, {
    isJoeDebugAvailable: isJoeDebugAvailable(),
    isJoeDebugPanelVisible,
    agentId,
    isMaster,
  }));

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase 3: Gemini 呼び出し
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.info("[ai-response:before-gemini]", aiDebugState);
  pushAgentDebugEvent({ tag: 'ai-response:before-gemini', agentId, sessionId });

  const finishFetch = beginTimedPhase(traceId, 'fetch');
  let response = '';

  try {
    response = await callGemini({
      prompt: promptText,
      systemInstruction,
      model: 'gemini-2.5-flash'
    });
  } finally {
    finishFetch();
  }

  const responseCheck = checkResponse(response);
  if (!responseCheck.ok) {
    throw new Error(`response_check:${responseCheck.reason}`);
  }

  const cleanedResponse = cleanResponse(response);
  console.info("[ai-response:after-gemini]", aiDebugState);
  pushAgentDebugEvent({ tag: 'ai-response:after-gemini', agentId, sessionId, responseLength: cleanedResponse.length });

  // セッション切り替えチェック（早期中断）
  if (activeSessionIdRef.current !== sessionId) {
    console.info(`[handleAgentResponse] Session switched from ${sessionId} to ${activeSessionIdRef.current}, aborting`);
    return { aborted: true };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase 4: メッセージの楽観的追加
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const aiMsgId = makeId();
  const optimisticAiMessage = {
    id: aiMsgId,
    role: 'ai',
    content: cleanedResponse,
    agentId: isMaster ? 'master' : agentId,
    reactions: null,
    clientCreatedAt: Date.now(),
  };

  const { id: _optimisticAiMessageId, ...optimisticAiMessageForStorage } = optimisticAiMessage;

  onOptimisticMessageAdd(optimisticAiMessage, aiMsgId, traceId);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase 5: 永続化
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  await persistAgentResponse({
    db,
    appId,
    user,
    sessionId,
    aiMsgId,
    optimisticAiMessageForStorage,
    continuityInternalOS,
    agentId,
    isMaster,
    measureFirestoreWrite,
    traceId,
    readSessionAfterglow,
    writeSessionAfterglowLocal,
    safeUpdateSession,
    pushAgentDebugEvent,
  });

  // セッション切り替えチェック（afterglow更新後）
  if (activeSessionIdRef.current !== sessionId) {
    console.info(`[handleAgentResponse] Session switched before completion, aborting`);
    return { aborted: true };
  }

  return {
    aiMsgId,
    cleanedResponse,
    context,
    continuityInternalOS,
    latestUserText,
    aborted: false,
  };
};
