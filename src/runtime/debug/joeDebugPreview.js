// src/runtime/debug/joeDebugPreview.js
// Joe 専用の debug preview 機能
// buildPrompt.js から分離し、runtime 主系から完全隔離

import { buildJoeBiasPack } from '../buildPrompt.js';

// 品質プレビュー計算用の閾値 (dev-only)
const PREVIEW_RESIGNATION_THRESHOLD = 0.3;
const PREVIEW_DESIRE_THRESHOLD = 0.2;
const PREVIEW_FREEZE_THRESHOLD = 0.2;
const PREVIEW_FEAR_THRESHOLD = 0.2;
const PREVIEW_REACH_MIN_THRESHOLD = 0.1;
const PREVIEW_SHAME_THRESHOLD = 0.25;
const PREVIEW_RISK_HOPEFUL_DESIRE_MIN = 0.5;
const PREVIEW_RISK_HOPEFUL_COUNTER_MAX = 0.2;
const PREVIEW_RISK_EXPLANATORY_THRESHOLD = 0.3;
const PREVIEW_RISK_BROAD_BIAS_COUNT = 3;
const PREVIEW_RISK_HIGH_AXIS_THRESHOLD = 0.3;
const PREVIEW_RISK_SUMMARY_AXIS_COUNT = 3;
const PREVIEW_RISK_SUMMARY_BIAS_COUNT = 2;

// Layer B / debug preview 用の短縮ユーティリティ。
// dev-only のプレビューのみに使う。本文全文は出さない。
const truncateDebugText = (text, max = 140) => {
  if (!text || typeof text !== 'string') return '';
  const t = text.trim();
  return t.length > max ? t.slice(0, max) + '…' : t;
};

// dev-only — buildStateGuide から移動（旧 runtime 主系で使われていた版）
const buildStateGuide = (_state = {}) => {
  const {
    desire = 0,
    fear = 0,
    freeze = 0,
    reach = 0,
    resignation = 0,
    selfErasure = 0,
    shame = 0,
    unfinished = 0,
  } = _state;

  if (resignation > 0.3) {
    return '「もう無理」「諦めたい」の中でも、まだ閉じきっていない感触が見えたら先に一点だけ置く。そのあとで削れ方に短く触れる。落ち切ったと決めつけず、切れかけた中でまだ切れていないところを静かに照らす。';
  }
  if (desire > 0.2 && freeze > 0.2) {
    return 'まず「やりたい」がまだ鈍っていない一点として見て、そのあとで手や体が止まる感じに短く触れる。止まりを主役にしすぎず、向きがまだ残っているからこその詰まりとして扱う。';
  }
  if (fear > 0.2 && (reach > 0.1 || desire > 0.2)) {
    return 'まず「作品を出したい」「見せたい」のような向きがまだ濁りきっていない一点として見て、そのあとで怖さに短く触れる。怖さだけを広げず、大事なものを外に出しかけている反応として扱う。';
  }
  if (shame > 0.25 || selfErasure > 0.25) {
    return '自己否定の中でも、まだ嘘をついていない感覚が見えたらそこを先に置く。そのあとで縮み方に触れる。間違い探しではなく、小さくならざるを得なかった事情として扱う。整理しすぎない。';
  }
  if (unfinished > 0.2) {
    return '引っかかりの中でも、まだ鈍っていない違和感や向きが見えたら先に置く。そのあとで未完成に触れる。欠陥探しではなく、途中だから残っている感覚として扱う。';
  }
  return '入力の中でまだ鈍っていない一点、濁り切っていない一点が見えたら先に言う。その一点がどの名詞・動詞・違和感・止まり方に出ているかを短く触れる。暗さの解説には長居しない。';
};

// dev-only — ジョーが今回ターゲットにする「一点」の短い説明を返す。
// stateGuide の判定ロジックと同じ優先度で選ぶ。
const computeJoeResponseFocusPreview = (state = {}) => {
  const { desire = 0, fear = 0, freeze = 0, reach = 0, resignation = 0, selfErasure = 0, shame = 0 } = state;
  if (resignation > PREVIEW_RESIGNATION_THRESHOLD) return 'まだ閉じきっていない感触';
  if (desire > PREVIEW_DESIRE_THRESHOLD && freeze > PREVIEW_FREEZE_THRESHOLD) return 'やりたいがまだ鈍っていない向き';
  if (fear > PREVIEW_FEAR_THRESHOLD && (reach > PREVIEW_REACH_MIN_THRESHOLD || desire > PREVIEW_DESIRE_THRESHOLD)) return 'まだ濁りきっていない出したい向き';
  if (shame > PREVIEW_SHAME_THRESHOLD || selfErasure > PREVIEW_SHAME_THRESHOLD) return 'まだ嘘をついていない感覚';
  return 'まだ鈍っていない一点';
};

// dev-only — 今回のジョーが陥りやすい品質リスクのフラグを返す。
// too-hopeful: 希望過多 / too-explanatory: 説明過多 / too-broad: 一点に絞れていない / too-summary-like: 要約化リスク
const computeJoeRiskFlags = ({ state = {}, biasPack = [] }) => {
  const flags = [];
  const { desire = 0, fear = 0, resignation = 0, shame = 0, selfErasure = 0 } = state;
  if (desire > PREVIEW_RISK_HOPEFUL_DESIRE_MIN && fear < PREVIEW_RISK_HOPEFUL_COUNTER_MAX && resignation < PREVIEW_RISK_HOPEFUL_COUNTER_MAX) flags.push('too-hopeful');
  if (shame > PREVIEW_RISK_EXPLANATORY_THRESHOLD || selfErasure > PREVIEW_RISK_EXPLANATORY_THRESHOLD) flags.push('too-explanatory');
  if (biasPack.length >= PREVIEW_RISK_BROAD_BIAS_COUNT) flags.push('too-broad');
  const activeHighAxes = Object.values(state).filter((v) => typeof v === 'number' && v > PREVIEW_RISK_HIGH_AXIS_THRESHOLD).length;
  if (activeHighAxes >= PREVIEW_RISK_SUMMARY_AXIS_COUNT && biasPack.length >= PREVIEW_RISK_SUMMARY_BIAS_COUNT) flags.push('too-summary-like');
  return flags;
};

// dev-only — touch -> ground -> ember -> optional-next-step のどこに比重があるかを返す。
const computeJoeAssemblyPreview = (state = {}) => {
  const { desire = 0, fear = 0, freeze = 0, reach = 0, resignation = 0 } = state;
  if (resignation > PREVIEW_RESIGNATION_THRESHOLD) return 'touch=primary / ground=secondary / ember=secondary / next-step=optional';
  if (desire > PREVIEW_DESIRE_THRESHOLD && freeze > PREVIEW_FREEZE_THRESHOLD) return 'touch=secondary / ground=secondary / ember=primary / next-step=present';
  if (fear > PREVIEW_FEAR_THRESHOLD && (reach > PREVIEW_REACH_MIN_THRESHOLD || desire > PREVIEW_DESIRE_THRESHOLD)) return 'touch=secondary / ground=secondary / ember=primary / next-step=present';
  return 'touch=primary / ground=secondary / ember=secondary / next-step=optional';
};

// Layer B + debug — dev-only のジョー構造プレビュー。
// Firestore 保存なし / 本文全文は出さない。
// buildJoeSystemPrompt の組み立て結果を事後確認するために使う。
export const buildJoeDebugPreview = ({
  activated,
  userText = '',
  stateGuide,
  internalFrame,
  surfaceGuidance,
} = {}) => {
  const safeActivated = activated || {};
  const state = safeActivated.debug?.state || {};
  const finalStateGuide = stateGuide || buildStateGuide(state);
  const biasPack = buildJoeBiasPack({ activated: safeActivated, userText, state });

  return {
    joeStateGuidePreview: truncateDebugText(finalStateGuide),
    joeInternalFramePreview: internalFrame ? truncateDebugText(internalFrame) : null,
    joeSurfaceGuidancePreview: surfaceGuidance ? truncateDebugText(surfaceGuidance) : null,
    joeActivatedBiasCount: biasPack.length,
    joeDominantAxes: safeActivated.debug?.dominantAxes || [],
    joeBuilderUsed: 'joe-specialized',
    // 品質観察用プレビュー (dev-only)
    joeResponseFocusPreview: computeJoeResponseFocusPreview(state),
    joeRiskFlags: computeJoeRiskFlags({ state, biasPack }),
    joeAssemblyPreview: computeJoeAssemblyPreview(state),
  };
};
