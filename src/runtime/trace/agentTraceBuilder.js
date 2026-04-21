// src/runtime/trace/agentTraceBuilder.js
// デバッグ通路の整備：全段階の入出力を時系列で蓄積する

/**
 * ジョー処理の各段階を表すenum
 * 22段階前後のイベントを網羅する
 */
export const TraceStage = {
  INPUT: 'INPUT',
  MICRO_SIGNAL: 'MICRO_SIGNAL', // 将来Dシリーズ用の空枠
  LATENT_MAKER_SEED: 'LATENT_MAKER_SEED',
  LATENT_HOME: 'LATENT_HOME',
  LATENT_HOME_CHECK: 'LATENT_HOME_CHECK',
  LATENT_EXISTENCE: 'LATENT_EXISTENCE',
  LATENT_EXISTENCE_2: 'LATENT_EXISTENCE_2',
  LATENT_BELIEF_CORE: 'LATENT_BELIEF_CORE',
  LATENT_BELIEF_BRANCH: 'LATENT_BELIEF_BRANCH',
  LATENT_BELIEF_LEAF: 'LATENT_BELIEF_LEAF',
  LATENT_BELIEF_TENSION: 'LATENT_BELIEF_TENSION',
  PRECONDITION_FILTER: 'PRECONDITION_FILTER',
  PRECONDITION_BIAS: 'PRECONDITION_BIAS',
  DYNAMIC_FIELD: 'DYNAMIC_FIELD',
  DYNAMIC_REACTION: 'DYNAMIC_REACTION',
  DYNAMIC_STANCE: 'DYNAMIC_STANCE',
  PERMISSION: 'PERMISSION',
  DECISION: 'DECISION',
  ACTIVATION: 'ACTIVATION',
  MATERIAL_PICK: 'MATERIAL_PICK', // activate/bind/select系
  RESIDUE: 'RESIDUE', // patternMix/surfaceWindow
  REENTRY: 'REENTRY',
  PROMPT_SYSTEM: 'PROMPT_SYSTEM',
  PROMPT_USER: 'PROMPT_USER',
  LLM_REQUEST: 'LLM_REQUEST',
  LLM_RESPONSE: 'LLM_RESPONSE',
  AFTERGLOW_SAVE: 'AFTERGLOW_SAVE',
};

/**
 * トレースオブジェクトを生成する
 *
 * @param {string} sessionId - セッションID
 * @param {string} agentId - エージェントID
 * @param {string} turnId - ターンID（メッセージIDなど）
 * @returns {Object} trace オブジェクト（push/finalizeメソッドを持つ）
 */
export function createTrace(sessionId, agentId, turnId) {
  const trace = {
    sessionId,
    agentId,
    turnId,
    startTime: Date.now(),
    events: [],
    finalized: false,
  };

  /**
   * 1段追記する
   *
   * @param {string} stage - TraceStage のいずれか
   * @param {any} payload - その段階の入出力データ
   */
  const push = (stage, payload) => {
    if (trace.finalized) {
      console.warn('[agentTraceBuilder] Cannot push to finalized trace');
      return;
    }

    trace.events.push({
      stage,
      timestamp: Date.now(),
      payload,
    });
  };

  /**
   * トレースを凍結してreturnする
   *
   * @returns {Object} 凍結されたtraceオブジェクト
   */
  const finalize = () => {
    if (trace.finalized) {
      console.warn('[agentTraceBuilder] Trace already finalized');
      return trace;
    }

    trace.finalized = true;
    trace.endTime = Date.now();
    trace.duration = trace.endTime - trace.startTime;

    // Object.freezeで完全に凍結
    Object.freeze(trace.events);
    Object.freeze(trace);

    return trace;
  };

  return {
    ...trace,
    push,
    finalize,
  };
}

/**
 * 既存のdebugInfoからトレースイベントを生成するヘルパー
 * 後方互換性のため、既存のdebugInfo構造をトレースイベントに変換
 *
 * @param {Object} debugInfo - runInternalOSのdebugInfo
 * @returns {Array} トレースイベント配列
 */
export function convertDebugInfoToTraceEvents(debugInfo) {
  if (!debugInfo) return [];

  const events = [];
  const now = Date.now();

  // debugInfoの各フィールドを対応するステージにマッピング
  if (debugInfo.microSignals) {
    events.push({
      stage: TraceStage.MICRO_SIGNAL,
      timestamp: now,
      payload: debugInfo.microSignals,
    });
  }

  if (debugInfo.makerSeedActive) {
    events.push({
      stage: TraceStage.LATENT_MAKER_SEED,
      timestamp: now,
      payload: { active: debugInfo.makerSeedActive },
    });
  }

  if (debugInfo.homeLayerActive) {
    events.push({
      stage: TraceStage.LATENT_HOME,
      timestamp: now,
      payload: { active: debugInfo.homeLayerActive },
    });
  }

  if (debugInfo.preconditionFilterPreview) {
    events.push({
      stage: TraceStage.PRECONDITION_FILTER,
      timestamp: now,
      payload: debugInfo.preconditionFilterPreview,
    });
  }

  if (debugInfo.preconditionBiasPreview) {
    events.push({
      stage: TraceStage.PRECONDITION_BIAS,
      timestamp: now,
      payload: debugInfo.preconditionBiasPreview,
    });
  }

  return events;
}
