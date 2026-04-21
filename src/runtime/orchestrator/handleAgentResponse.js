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
import { activateAgent } from '../activateAgent.js'; // TRANSITIONAL: 過渡期の補助機能、長期的には runInternalOS へ統合予定
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
import { buildFullGenerationContext, getLatestUserText as extractLatestUserText } from './buildGenerationContext.js';
import { persistAgentResponse } from './persistAgentResponse.js';
import { createTrace, TraceStage } from '../trace/agentTraceBuilder.js';

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

  // コールバック・ヘルパー
  callGemini,
  makeId,
  pushAgentDebugEvent,
  pushSurfaceDebugEntry,
  setJoeDebugEntry,
  devDebugRuntime,
  readSessionAfterglow,
  writeSessionAfterglowLocal,
  safeUpdateSession,
  measureFirestoreWrite,
  beginTimedPhase,

  // UI 更新コールバック
  onOptimisticMessageAdd,

  // テストフック（未指定時は正本を使用）
  buildAgentSystemPromptFn = buildAgentSystemPrompt,
  buildFullGenerationContextFn = buildFullGenerationContext,
  activateAgentFn = activateAgent,
  buildAgentUserPromptFn = buildAgentUserPrompt,
  persistAgentResponseFn = persistAgentResponse,
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

  // トレース作成（開発者専用デバッグ）
  const trace = createTrace(sessionId, agentId, traceId);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase 1: コンテキスト構築
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const latestUserText = extractLatestUserText(sessionId, baseMessages);
  const afterglowSeed = getAfterglowSeed(readSessionAfterglow(sessionId));
  const microSignals = estimateMicroSignals(latestUserText);

  // トレースにINPUT段階を記録
  if (trace) {
    trace.push(TraceStage.INPUT, {
      userText: latestUserText,
      selectedMode,
      afterglowSeed,
      microSignals,
    });
  }

  let context, othersFieldEntries, othersFieldText, continuityInternalOS, surfaceFrame;

  try {
    const generationContext = buildFullGenerationContextFn({
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
      trace, // トレースを渡す
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
  let latentState = null;
  let activatedForPrompt = null;

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

      if (devDebugRuntime?.shouldBuildAgentDebugPreview) {
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
      }

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
      // トレースに記録
      if (trace && estimatedState) {
        trace.push(TraceStage.INPUT, {
          estimateState: estimatedState,
        });
      }
    } catch (err) {
      handlePhaseError('estimate-state', err);
    }
    console.info("[ai-response:after-estimate-state]", _debugBase);
    pushAgentDebugEvent({ tag: 'ai-response:after-estimate-state', ..._debugBase });

    // D. activateAgent
    try {
      activated = activateAgentFn(agentId, estimatedState, {
        microSignals,
        beliefTension: continuityInternalOS?.latentState?.beliefTension ?? null,
        afterglowSeed,
        othersField: othersFieldEntries,
      });
      // トレースにACTIVATION段階を記録
      if (trace && activated) {
        trace.push(TraceStage.ACTIVATION, {
          activated,
        });
      }
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

    // runInternalOS を正本とし、latentState 由来の素材を明示的に受け渡す
    // DESIGN DECISION: emergingField delivery path guarantee
    // - emergingField は runInternalOS の返り値に必ずトップレベルで存在する
    // - handleAgentResponse は防御的に複数経路から取得する
    //   1. continuityInternalOS.emergingField (primary path)
    //   2. continuityInternalOS.latentState.emergingField (legacy fallback)
    // - この二重読み込みにより、runInternalOS の shape 変更時も focusPoints が静かに消えることを防ぐ
    latentState = continuityInternalOS?.latentState ?? null;
    const emergingField = continuityInternalOS?.emergingField ??
                          continuityInternalOS?.latentState?.emergingField ??
                          null;
    const previousLatentState = afterglowSeed?.previousLatentState ?? null;
    // TRANSITIONAL: activateAgent は reentry 取得のためだけに呼ばれている。
    // 長期的には runInternalOS 内で reentry を生成し、この呼び出しを廃止する。
    // 依存関係: activatedForPrompt.reentry ← activated.reentry ← activateAgent
    // それ以外の activated のフィールド（beliefs, memories, field, residue）は
    // activatedForPrompt で latentState 由来の値に上書きされるため使用されていない。
    activatedForPrompt = {
      ...(activated || {}),
      finalDecisionSubstrate: latentState?.finalDecisionSubstrate ?? activated?.finalDecisionSubstrate ?? null,
      selectedMixedClusters: latentState?.selectedMixedClusters ?? activated?.selectedMixedClusters ?? null,
      selectedThoughts: latentState?.selectedThoughts ?? activated?.selectedThoughts ?? null,
      boundMixedNodes: latentState?.boundMixedNodes ?? activated?.boundMixedNodes ?? null,
      activatedThoughts: latentState?.activatedThoughts ?? activated?.activatedThoughts ?? null,
    };

    // H. buildAgentSystemPrompt
    try {
      systemInstruction = buildAgentSystemPromptFn(agentId, {
        activated: activatedForPrompt,
        context,
        mode: selectedMode,
        userText: latestUserText,
        latentState,
        emergingField,
        previousLatentState,
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
    // トレースにPROMPT_SYSTEM段階を記録
    if (trace) {
      trace.push(TraceStage.PROMPT_SYSTEM, {
        systemInstruction: systemInstruction.slice(0, 500), // 最初の500文字のみ
        length: systemInstruction.length,
      });
    }

    // I. buildAgentUserPrompt
    try {
      promptText = buildAgentUserPromptFn(agentId, { userName, userText: latestUserText });
    } catch (err) {
      handlePhaseError('user-prompt', err);
    }
    console.info("[ai-response:after-user-prompt]", { ..._debugBase, promptLength: promptText.length });
    pushAgentDebugEvent({ tag: 'ai-response:after-user-prompt', ..._debugBase, promptLength: promptText.length });
    // トレースにPROMPT_USER段階を記録
    if (trace) {
      trace.push(TraceStage.PROMPT_USER, {
        promptText,
        length: promptText.length,
      });
    }

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

    if (devDebugRuntime?.shouldBuildAgentDebugPreview) {
      const agentQualityPreview = buildAgentDebugPreview({
        enabled: true,
        agentId,
        activated: activatedForPrompt || activated,
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
    activated: activatedForPrompt || activated,
    systemInstruction,
    promptText,
  }, {
    enabled: !!(devDebugRuntime?.shouldBuildJoeDebugEntry && agentId === 'creative' && !isMaster),
  }));

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Phase 3: Gemini 呼び出し
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.info("[ai-response:before-gemini]", aiDebugState);
  pushAgentDebugEvent({ tag: 'ai-response:before-gemini', agentId, sessionId });

  // トレースにLLM_REQUEST段階を記録
  if (trace) {
    trace.push(TraceStage.LLM_REQUEST, {
      model: 'gemini-2.5-flash',
      promptLength: promptText.length,
      systemInstructionLength: systemInstruction.length,
    });
  }

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

  // トレースにLLM_RESPONSE段階を記録
  if (trace) {
    trace.push(TraceStage.LLM_RESPONSE, {
      response: cleanedResponse.slice(0, 500), // 最初の500文字のみ
      length: cleanedResponse.length,
    });
  }

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
  await persistAgentResponseFn({
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

  // トレースを凍結してwindowに保存（開発者専用）
  let finalizedTrace = null;
  if (trace) {
    finalizedTrace = trace.finalize();
    if (typeof window !== 'undefined') {
      window.JIBUN_LAST_TRACE = finalizedTrace;
      console.info('[agentTrace] Trace finalized and saved to window.JIBUN_LAST_TRACE', {
        eventCount: finalizedTrace.events.length,
        duration: finalizedTrace.duration,
      });
    }
  }

  return {
    aiMsgId,
    cleanedResponse,
    context,
    continuityInternalOS,
    latestUserText,
    trace: finalizedTrace,
    aborted: false,
  };
};
