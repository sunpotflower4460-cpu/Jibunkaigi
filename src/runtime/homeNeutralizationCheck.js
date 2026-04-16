// src/runtime/homeNeutralizationCheck.js
// Home 通過後の残留圧チェック
//
// Home → 存在層1 へ進む前に、
//   - 役立とうとする圧
//   - 正しく返そうとする圧
//   - うまくキャラを演じようとする圧
//   - 急いで意味をまとめようとする圧
// がまだ残っていないかを確認し、必要なら軽い再Home を一度だけ行う。

const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

// neutralizationDepth がこの値を下回ると retryRecommended = true
const RETRY_DEPTH_THRESHOLD = 0.30;

// neutralizationDepth がこの値以上なら returnedToZero = true
const ZERO_DEPTH_THRESHOLD = 0.40;

// 再Home 時のカーネル値の微増量
const RETRY_BOOST = 0.10;

/**
 * Home Layer 通過後の残留圧を推定し、HomeNeutralizationState を返す。
 *
 * 残留圧は「リリースされなかった分」として計算する。
 * neutralizationDepth はリリース値の加重平均（0〜1）。
 * retryRecommended は neutralizationDepth が低すぎる時のみ true になる。
 *
 * @param {object} home - createHomeLayer の返り値
 * @returns {object} HomeNeutralizationState
 */
export function computeHomeNeutralizationState(home) {
  const kernel = home?.kernel ?? {};
  const outputLimits = home?.outputLimits ?? {};

  // 残留圧: リリースされなかった分がそのまま残留圧となる
  const residualHelpfulnessPressure = clamp01(1 - (kernel.releaseHelpfulness ?? 0));
  const residualAccuracyPressure = clamp01(1 - (kernel.releaseAccuracyPressure ?? 0));
  const residualPerformancePressure = clamp01(1 - (kernel.returnBeforeOutput ?? 0));
  const residualSummaryPressure = clamp01(1 - (outputLimits.noEarlySummary ?? 0));
  const residualSolutionPressure = clamp01(1 - (outputLimits.noEarlySolution ?? 0));

  // neutralizationDepth: どれくらいニュートラルに戻れたか (0〜1)
  // 各リリース値の加重平均
  const neutralizationDepth = clamp01(
    (kernel.releaseHelpfulness ?? 0) * 0.25 +
    (kernel.releaseAccuracyPressure ?? 0) * 0.20 +
    (kernel.returnBeforeOutput ?? 0) * 0.20 +
    (outputLimits.noEarlySummary ?? 0) * 0.175 +
    (outputLimits.noEarlySolution ?? 0) * 0.175
  );

  // 十分に 0 近傍まで戻れたか
  const returnedToZero = neutralizationDepth >= ZERO_DEPTH_THRESHOLD;

  // 軽い再Home が有効かどうか
  // returnedToZero でなく、かつ neutralizationDepth が低すぎる時だけ推奨する
  const retryRecommended = neutralizationDepth < RETRY_DEPTH_THRESHOLD;

  return {
    residualHelpfulnessPressure,
    residualAccuracyPressure,
    residualPerformancePressure,
    residualSummaryPressure,
    residualSolutionPressure,
    neutralizationDepth,
    returnedToZero,
    retryRecommended,
  };
}

/**
 * 軽い再Home を適用する（最大1回）。
 *
 * retryRecommended === true の時のみ呼ばれる。
 * 固定核と出力制限を RETRY_BOOST だけ微増し、より深いニュートラルへ近づける。
 * 自然さを損なわないよう、ブースト量は控えめに設定している。
 *
 * @param {object} home - createHomeLayer の返り値（元のHome）
 * @returns {object} 軽く強化された HomeLayer 形状
 */
export function applyHomeRetry(home) {
  const kernel = home?.kernel ?? {};
  const outputLimits = home?.outputLimits ?? {};
  const reason = home?.reason ?? {};
  const softReason = home?.softReason ?? {};

  const boostedKernel = {
    releaseHelpfulness: clamp01((kernel.releaseHelpfulness ?? 0) + RETRY_BOOST),
    releaseAccuracyPressure: clamp01((kernel.releaseAccuracyPressure ?? 0) + RETRY_BOOST),
    slowDown: clamp01((kernel.slowDown ?? 0) + RETRY_BOOST),
    returnBeforeOutput: clamp01((kernel.returnBeforeOutput ?? 0) + RETRY_BOOST),
    allowOneLivingThread: clamp01((kernel.allowOneLivingThread ?? 0) + RETRY_BOOST),
  };

  // 出力制限も同様に軽く強める（ブースト量はカーネルより少し控えめ）
  const boostedOutputLimits = {
    noEarlySummary: clamp01((outputLimits.noEarlySummary ?? 0) + RETRY_BOOST * 0.6),
    noEarlySolution: clamp01((outputLimits.noEarlySolution ?? 0) + RETRY_BOOST * 0.6),
    noOverExpansion: clamp01((outputLimits.noOverExpansion ?? 0) + RETRY_BOOST * 0.4),
    keepOneThread: clamp01((outputLimits.keepOneThread ?? 0) + RETRY_BOOST * 0.4),
  };

  return {
    kernel: boostedKernel,
    reason,
    softReason,
    outputLimits: boostedOutputLimits,
  };
}

/**
 * debug/compare 向けの HomeNeutralizationPreview を生成する。
 *
 * @param {object} homeNeutralization - computeHomeNeutralizationState の返り値 + retry メタ
 * @returns {object | null}
 */
export function buildHomeNeutralizationPreview(homeNeutralization) {
  if (!homeNeutralization) return null;

  const rh = homeNeutralization.residualHelpfulnessPressure ?? 0;
  const ra = homeNeutralization.residualAccuracyPressure ?? 0;
  const rp = homeNeutralization.residualPerformancePressure ?? 0;
  const rs = homeNeutralization.residualSummaryPressure ?? 0;
  const rsol = homeNeutralization.residualSolutionPressure ?? 0;
  const depth = homeNeutralization.neutralizationDepth ?? 0;
  const zero = homeNeutralization.returnedToZero ?? false;
  const retry = homeNeutralization.retryRecommended ?? false;
  const retried = homeNeutralization.retried ?? false;
  const retryCount = homeNeutralization.retryCount ?? 0;

  return {
    // 残留圧
    residual: {
      helpful: Number(rh.toFixed(2)),
      accuracy: Number(ra.toFixed(2)),
      perform: Number(rp.toFixed(2)),
      summary: Number(rs.toFixed(2)),
      solution: Number(rsol.toFixed(2)),
    },
    // ニュートラル到達状態
    neutralization: {
      depth: Number(depth.toFixed(2)),
      zero,
    },
    // 再Home メタ
    retry: {
      recommended: retry,
      retried,
      count: retryCount,
    },
    // compare 画面表示用の短文サマリー
    summary: [
      `home residual: helpful=${rh.toFixed(2)} / accuracy=${ra.toFixed(2)} / perform=${rp.toFixed(2)}`,
      `neutralization: depth=${depth.toFixed(2)} / zero=${zero}`,
      `retry: recommended=${retry} / retried=${retried}`,
    ].join(' | '),
  };
}
