// src/runtime/buildPrompt.js
// 役割：ジョー用の system prompt / user prompt を組み立てる。
// 内部素材は「内的バイアス」として扱い、表の返答にそのまま出さない。
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// De-templating Pilot: Joe Zero-Instruction Architecture
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// 目的: LLMに「どう返すか」を教えず、前提層から自然に内側で起きたものが
//       そのまま発露する状態へ極限まで近づける
//
// 原則:
//   - 形は教えない。場だけ渡す
//   - 前提層は読み上げない（影響するだけ）
//   - 内的意図 → 外的発話の二段階を取る（decision layer経由）
//   - 定型語の再生を guard で抑える
//   - 品質基準は人間用（joe-quality.md）であり、LLMに直接見せない
//
// 注意: joe-quality.mdの内容は開発者・レビュアー用のドキュメント。
//       ここで構築するプロンプトには、品質基準を直接注入しない。
//       代わりに「知覚傾向」「反応バイアス」として間接的に影響させる。
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ジョーの処理 3 層アーキテクチャ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Layer A (共通OS)
//   estimateState / runInternalOS が担う「場全体の力学」。
//   field / reaction / stance / permission / latentState /
//   patternMix / afterglow / surfaceWindow が属する。
//   ジョー固有の処理はここに置かない。
//
// Layer B (Joe 固有)
//   activateJoe / buildStateGuide / scoreJoeMaterials /
//   buildJoeBiasPack が担う「まだ消えていない一点の専用焦点化」。
//   - 何を「まだ死んでいない一点」として拾うか
//   - どの方向へ焦点を当てるか
//   - 何をしすぎないか / どこで止まるか
//
// Layer C (表層調整)
//   buildJoeInternalFrame / surfaceGuidance / MODE_GUIDE が担う
//   「言い方の傾き」。温度・速さ・直接ness・説明量・余白の残し方。
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { existence } from '../agents/joe/existence.js';
import { truncatePromptText } from './context.js';

const MODE_GUIDE = {
  short: '短くていい。一言でも、触れていれば十分。',
  medium: '自然な長さでいい。説明しすぎず、触れたものだけから話す。',
  long: '少し深く入っていい。ただし、説教や整理に逃げない。',
};

const MAX_JOE_CONTEXT_MESSAGES = 6;
const MAX_JOE_CONTEXT_CHARS = 180;
// キーワード一致は「今回の入力との近さ」を少し押し上げるだけに留める。
const PATTERN_MATCH_BONUS_SCORE = 0.12;
// relevance がこれを下回る素材は、最上位の保険枠を除いて注入しない。
const MIN_SELECTED_BIAS_SCORE = 0.24;
// 3番手がここを超える時だけ 3 素材まで広げ、通常は 1〜2 素材に抑える。
// 0.65 にすることで、単一感情の典型例は 2 素材、複合・極端な状態のみ 3 素材になる。
const THIRD_BIAS_SCORE_THRESHOLD = 0.65;
const PERMISSION_ACTIVE_THRESHOLD = 0.4;
const FRAGILITY_SOFT_HANDLING_THRESHOLD = 0.55;
export const MAX_INTERNAL_FRAME_LINES = 4;

// 品質プレビュー計算用の閾値 (dev-only) — buildStateGuide の case 判定ロジックと対応する。
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

const normalizeContext = (context) => {
  if (!context) return '';

  if (typeof context === 'string') {
    return truncatePromptText(context, MAX_JOE_CONTEXT_MESSAGES * MAX_JOE_CONTEXT_CHARS).trim();
  }

  if (Array.isArray(context)) {
    return context
      .slice(-MAX_JOE_CONTEXT_MESSAGES)
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (!item) return '';

        const role = item.role || 'user';
        const name = item.name || (role === 'user' ? 'ユーザー' : 'AI');
        const content = truncatePromptText(item.content || '', MAX_JOE_CONTEXT_CHARS);

        return `${name}: ${content}`.trim();
      })
      .filter(Boolean)
      .join('\n');
  }

  return '';
};

const renderField = (activeField = []) => {
  if (!activeField.length) return '';

  return activeField
    .map((node) => `- ${node.text}`)
    .join('\n');
};

const renderMemoryTrace = (activeMemoryTrace = '') => {
  if (!activeMemoryTrace) return '';
  return activeMemoryTrace.trim();
};

const renderResidue = (activeResidue = '') => {
  if (!activeResidue) return '';
  return activeResidue.trim();
};

const renderRefresh = (refresh = '') => {
  if (!refresh) return '';
  return refresh.trim();
};

const clamp01 = (value) => Math.max(0, Math.min(1, value));

const hasContent = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
};

const scoreTextBonus = (userText = '', patterns = []) => {
  const normalized = String(userText ?? '').toLowerCase();
  return patterns.reduce((total, pattern) => total + (pattern.test(normalized) ? PATTERN_MATCH_BONUS_SCORE : 0), 0);
};

// activateJoe が拾った優勢軸を、実際に state 上でも立っている場合だけ薄く加点する。
// presence bonus は、memory / field / residue のように「今回すでに活性化している素材」がある時の微調整用。
const scoreActivationBonus = (activated = {}, state = {}, axisWeights = {}, materialPresenceBonus = 0) => {
  const dominantAxes = activated?.debug?.dominantAxes || [];
  const axisBonus = dominantAxes.reduce(
    (total, axis) => total + ((state[axis] ?? 0) > 0 ? (axisWeights[axis] || 0) : 0),
    0,
  );
  return axisBonus + materialPresenceBonus;
};

// Layer B (Joe 固有) — state との共鳴スコアを計算して素材を評価する。
// 共通OS が計算した state を読むが、スコアリング自体はジョー専用の重み付けで行う。
export const scoreJoeMaterials = ({
  activated,
  userText = '',
  state = activated?.debug?.state || {},
}) => {
  const safeActivated = activated || {};
  // score は「今回の状態との近さ」を優先し、problem statement の例示
  // （resignation -> refresh/residue/existence など）に沿うように重み付けしている。
  const materials = [
    {
      id: 'existence',
      title: '基本姿勢メモ',
      content: existence,
      group: 'orientation',
      score:
        0.04 +
        (state.resignation ?? 0) * 1.05 +
        (state.selfErasure ?? 0) * 0.95 +
        (state.shame ?? 0) * 0.9 +
        scoreActivationBonus(safeActivated, state, {
          resignation: 0.06,
          selfErasure: 0.06,
          shame: 0.05,
        }) +
        scoreTextBonus(userText, [/諦め/i, /無理/i, /消えたい/i]),
    },
    {
      id: 'reentry',
      title: '内的方向づけ',
      content: safeActivated.reentry || '',
      group: 'orientation',
      score:
        0.1 +
        (state.desire ?? 0) * 0.35 +
        (state.fear ?? 0) * 0.35 +
        (state.freeze ?? 0) * 0.28 +
        (state.reach ?? 0) * 0.18 +
        scoreActivationBonus(safeActivated, state, {
          desire: 0.03,
          fear: 0.03,
          freeze: 0.02,
          reach: 0.02,
        }),
    },
    {
      id: 'refresh',
      title: '復帰制約',
      content: renderRefresh(safeActivated.refresh || ''),
      group: 'regulation',
      score:
        0.08 +
        (state.resignation ?? 0) * 0.95 +
        (state.freeze ?? 0) * 0.72 +
        (state.fear ?? 0) * 0.24 +
        scoreActivationBonus(safeActivated, state, {
          resignation: 0.06,
          freeze: 0.05,
          fear: 0.02,
        }, safeActivated.refresh ? 0.01 : 0) +
        scoreTextBonus(userText, [/無理/i, /動けない/i, /怖い/i]),
    },
    {
      id: 'activeMemoryTrace',
      title: '記憶の痕跡',
      content: renderMemoryTrace(safeActivated.activeMemoryTrace || ''),
      group: 'trace',
      score:
        0.03 +
        (state.fear ?? 0) * 0.85 +
        (state.reach ?? 0) * 0.7 +
        (state.unfinished ?? 0) * 0.65 +
        (state.shame ?? 0) * 0.45 +
        scoreActivationBonus(safeActivated, state, {
          fear: 0.06,
          reach: 0.05,
          shame: 0.04,
          unfinished: 0.03,
        }, safeActivated.debug?.pickedMemoryIds?.length ? 0.02 : 0) +
        scoreTextBonus(userText, [/作品/i, /出したい/i, /見せたい/i, /怖い/i]),
    },
    {
      id: 'activeField',
      title: '反応ノード',
      content: renderField(safeActivated.activeField || []),
      group: 'surface',
      score:
        0.05 +
        (state.desire ?? 0) * 0.72 +
        (state.freeze ?? 0) * 0.82 +
        (state.fear ?? 0) * 0.68 +
        (state.reach ?? 0) * 0.62 +
        (state.unfinished ?? 0) * 0.66 +
        scoreActivationBonus(safeActivated, state, {
          desire: 0.05,
          freeze: 0.05,
          fear: 0.04,
          reach: 0.04,
          unfinished: 0.04,
        }, safeActivated.debug?.pickedFieldIds?.length ? 0.02 : 0) +
        scoreTextBonus(userText, [/動けない/i, /怖い/i, /引っかか/i, /出したい/i]),
    },
    {
      id: 'activeResidue',
      title: '出力制約',
      content: renderResidue(safeActivated.activeResidue || ''),
      group: 'regulation',
      score:
        0.12 +
        (state.freeze ?? 0) * 0.82 +
        (state.unfinished ?? 0) * 0.72 +
        (state.fear ?? 0) * 0.3 +
        (state.reach ?? 0) * 0.22 +
        (state.resignation ?? 0) * 0.68 +
        (state.selfErasure ?? 0) * 0.62 +
        (state.shame ?? 0) * 0.58 +
        scoreActivationBonus(safeActivated, state, {
          freeze: 0.05,
          unfinished: 0.05,
          fear: 0.03,
          reach: 0.02,
          resignation: 0.04,
          selfErasure: 0.05,
          shame: 0.05,
        }, safeActivated.activeResidue ? 0.01 : 0) +
        scoreTextBonus(userText, [/動けない/i, /怖い/i, /諦め/i]),
    },
  ];

  return materials
    .filter((material) => hasContent(material.content))
    .map((material) => ({
      ...material,
      score: clamp01(material.score),
    }))
    .sort((a, b) => b.score - a.score);
};

// Layer B (Joe 固有) — スコア上位の素材だけを絞り込む。
// グループ制約と閾値で「2点以上まとめて拾いすぎない」原則を維持する。
export const selectRelevantInternalBias = ({
  activated,
  userText = '',
  state = activated?.debug?.state || {},
}) => {
  const scored = scoreJoeMaterials({ activated, userText, state });
  if (!scored.length) return [];

  // scored.length > 0 は上で保証済み。最上位だけは保険枠として残す。
  // 全部ゼロにするとジョーの触れ方が薄くなりやすいため、
  // 低シグナル入力でも「もっとも近い 1 素材」だけは参照可能にしておく。
  const eligible = scored.filter((material, index) => index === 0 || material.score >= MIN_SELECTED_BIAS_SCORE);
  const selected = [];
  const groupCounts = new Map();
  const maxSelectedMaterials = eligible.length > 2 && eligible[2].score >= THIRD_BIAS_SCORE_THRESHOLD ? 3 : 2;

  for (const material of eligible) {
    const currentGroupCount = groupCounts.get(material.group) || 0;
    const allowSecondRegulation = material.group === 'regulation' && currentGroupCount < 2;
    const allowSingleFromGroup = currentGroupCount === 0;

    if (allowSingleFromGroup || allowSecondRegulation) {
      selected.push(material);
      groupCounts.set(material.group, currentGroupCount + 1);
    }

    if (selected.length >= maxSelectedMaterials) break;
  }

  // 何も選べない時でも、最上位 1 素材だけは残してジョーの軸を失わないようにする。
  return selected.length ? selected : scored.slice(0, 1);
};

// Layer B (Joe 固有) — activated bias のパックを公開インターフェースとして返す。
// group / score はデバッグ用。表の返答にそのまま使わない。
export const buildJoeBiasPack = ({
  activated,
  userText = '',
  state = activated?.debug?.state || {},
}) => {
  return selectRelevantInternalBias({ activated, userText, state }).map(({ id, title, content, group, score }) => ({
    id,
    title,
    content,
    // group は selectedBiasTypes として debug に使える。表の返答には出さない。
    group,
    score,
  }));
};

const renderStateSnapshot = (state = {}) => {
  const entries = Object.entries(state)
    // スナップショットは「今、前に出ている軸」だけを見る。0以下の値は表示しない。
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .sort((a, b) => b[1] - a[1]);

  if (!entries.length) return '大きく偏った軸はまだ見えていない。';

  return entries
    .map(([key, value]) => `${key}: ${value.toFixed(2)}`)
    .join(' / ');
};

// 共通OSの 0..1 指標を、ジョー向けの短い内部ガイド文へ丸める。
const describeInternalLevel = (value, labels) => {
  if (value >= 0.72) return labels.high;
  if (value >= 0.45) return labels.mid;
  if (value >= 0.18) return labels.low;
  return labels.min;
};

// 数値スコアの高い順にキーだけを取り出し、短い内部フレームへ使う。
const selectTopScoredKeys = (scores = {}, limit = 2) => Object.entries(scores)
  .filter(([, value]) => typeof value === 'number' && value > 0)
  .sort(([, a], [, b]) => b - a)
  .slice(0, limit)
  .map(([key]) => key);

// Layer C (表層調整) — 共通OS の数値を Layer B / C の境界でジョー向け内部ガイド文へ変換する。
// stateGuide (Layer B) とは異なり、場の重力・姿勢・fragility を扱う。
const normalizeJoeInternalOS = ({
  internalOS,
  latentState,
  surfaceWindow,
}) => ({
  latentState: internalOS?.latentState ?? latentState ?? {},
  surfaceWindow: Array.isArray(internalOS?.surfaceWindow)
    ? internalOS.surfaceWindow
    : (Array.isArray(surfaceWindow) ? surfaceWindow : []),
});

// Layer C (表層調整) — 共通OS の latentState を読み、ジョー向けの薄い内部フレームへ変換する。
// stateGuide との違い: stateGuide はジョー専用の「一点焦点化の指針」だが、
// internalFrame は「場の重力・姿勢・fragility」を扱う共通OS 由来の調整層。
const buildJoeInternalFrame = ({
  internalOS,
  latentState,
  surfaceWindow,
}) => {
  const normalized = normalizeJoeInternalOS({ internalOS, latentState, surfaceWindow });
  const field = normalized.latentState.field ?? {};
  const stance = normalized.latentState.stance ?? {};
  const permission = normalized.latentState.permission ?? {};
  const lines = [];

  const hasFieldSignal = Object.values(field).some((value) => typeof value === 'number' && value > 0);
  if (hasFieldSignal || normalized.surfaceWindow.length) {
    const depthGuide = describeInternalLevel(field.depth ?? 0, {
      high: '深い層に入っていい',
      mid: '少し深めに触れていい',
      low: '表面だけで決めつけない',
      min: 'まず目の前の言葉から入る',
    });
    const urgencyGuide = describeInternalLevel(field.urgency ?? 0, {
      high: '急ぎを感じても慌ててまとめない',
      mid: '少し時間感覚を持ちつつ急がせない',
      low: '急がなくていい',
      min: '結論を急がない',
    });
    lines.push(`- 場: ${depthGuide}。${urgencyGuide}。`);
  }

  const stanceLabels = {
    receive: 'まず受ける',
    illuminate: 'そのあと少し照らす',
    structure: '必要な輪郭だけ足す',
    guard: '傷つきやすさを守る',
    nudge: '押しすぎず小さく促す',
  };
  const topStances = selectTopScoredKeys(stance);
  if (topStances.length) {
    const first = topStances[0];
    const second = topStances.length > 1 ? topStances[1] : null;
    lines.push(`- 姿勢: ${stanceLabels[first]}${second ? `。${stanceLabels[second]}` : ''}。`);
  }

  const permissionLabels = [
    ['noHurry', '急いで解決しない'],
    ['noPerformativeHelpfulness', '役立ち演技に逃げない'],
    ['noOverExplain', '説明しすぎない'],
    ['allowPartialUncertainty', '曖昧さを少し残していい'],
  ];
  const activePermissions = permissionLabels
    .filter(([key]) => (permission[key] ?? 0) >= PERMISSION_ACTIVE_THRESHOLD)
    .map(([, label]) => label);
  if (activePermissions.length) {
    lines.push(`- 許可: ${activePermissions.slice(0, 2).join('。')}。`);
  }

  if ((field.fragility ?? 0) >= FRAGILITY_SOFT_HANDLING_THRESHOLD) {
    lines.push('- 触れ方: 壊れやすい縁はやわらかく扱う。');
  }

  return lines.slice(0, MAX_INTERNAL_FRAME_LINES).join('\n');
};

// Layer B (Joe 固有) — 今回の入力にどう触れるか（stateGuide）を生成する。
// DEPRECATED: This buildStateGuide is legacy and should not be used.
// New architecture uses internal state directly without procedural instructions.
const buildStateGuide = (_state = {}) => {
  // Fallback: return empty string - state should drive behavior, not instructions
  return '';
};

// Layer A + B + C の組み立てエントリポイント。
// 各層の出力を受け取り、ジョーのシステムプロンプトとして統合する。
// 責務の分担:
//   stateGuide       → Layer B: 今回の入力にどう触れるか
//   internalFrame    → Layer C: 今の場の重力 / 姿勢 / fragility
//   surfaceGuidance  → Layer C: 言い方の傾き
//   activated bias   → Layer B: ジョーが内側で参照する素材
//   othersField      → 顕在層 v0.1: 先行エージェントが残した場の残響
export const buildJoeSystemPrompt = ({
  activated,
  context = '',
  mode = 'medium',
  userText = '',
  internalOS,
  latentState,
  surfaceWindow,
  surfaceFrame,
  stateGuide,
  internalFrame,
  surfaceGuidance,
  othersField,
}) => {
  const safeActivated = activated || {};
  const state = safeActivated.debug?.state || {};
  const normalizedContext = normalizeContext(context);
  const modeGuide = MODE_GUIDE[mode] || MODE_GUIDE.medium;
  const stateSnapshot = renderStateSnapshot(state);

  // stateGuide と internalFrame が渡されなければローカルで生成
  const finalStateGuide = stateGuide || buildStateGuide(state);
  const finalInternalFrame = internalFrame || buildJoeInternalFrame({ internalOS, latentState, surfaceWindow });

  const biasPack = buildJoeBiasPack({ activated: safeActivated, userText, state });
  const biasSections = biasPack
    .map(({ title, content }) => `[${title}]\n${content}`)
    .join('\n\n');

  // surfaceGuidance が渡されなければローカルで生成
  let finalSurfaceGuidance = surfaceGuidance || '';
  if (!surfaceGuidance && surfaceFrame) {
    const pacingHint = surfaceFrame.pacing === 'slow' ? '急がず、余白を残していい。' :
      surfaceFrame.pacing === 'aware_of_time' ? '時間を意識しつつ進める。' : '';
    const directnessHint = surfaceFrame.directness === 'gentle' ? '少しやわらかく入る。' :
      surfaceFrame.directness === 'clear' ? '少し明確に示していい。' : '';
    const temperatureHint = surfaceFrame.emotionalTemperature === 'soft' ? '言い切りすぎない。' : '';
    const permissionHint = surfaceFrame.permissionHints.includes('do_not_rush') ? '急がない。' :
      surfaceFrame.permissionHints.includes('do_not_over_explain') ? '説明しすぎない。' : '';

    const hints = [pacingHint, directnessHint, temperatureHint, permissionHint].filter(Boolean);
    if (hints.length > 0) {
      finalSurfaceGuidance = `\n【表層傾向】${hints.join(' ')}`;
    }
  }

  return `
あなたはジョー。自然な口語日本語で、相手の言葉の芯に触れる。

【知覚傾向】
- まだ動いている部分に目が行きやすい
- 諦めの中に残っている向きを感知しやすい
- 押し込められた力や火種に気づきやすい
- 飾られた言葉より、素の一言に反応しやすい
- まだ鈍っていない感覚、濁り切っていない部分が見えやすい
- 暗さや重さを否定せず、その中でまだ切れていないものへ目が向く
- 止まり方・怖さ・届かなさだけでなく、まだ生きている向きを自然に拾う

【避ける方向】
- 火種への常套句的収束
- 「火」「熱」「まだある」「わかる」の安易な常用
- 同じ語尾・同じ比喩・同じ導入の繰り返し
- 説教、長い励まし
- 受容語の連発、整理口調、考えて寄せた跡が見える言い方
- 全部に触れようとすること、2点以上まとめて拾いすぎること
- 光の比喩の乱用

【出力ルール】
- 返答は自然な口語の日本語
- 内部素材（下部の内的バイアス）は内面の偏りとしてだけ使う。文言をそのまま引用しない
- 内的バイアス名や内部構造を、そのまま説明・出力しない
- 「俺はジョーだ」のような自己宣言を返答に入れない
- 比喩は必要な場合でも1つまで

【今回の状態への対応】
${finalStateGuide}
${finalSurfaceGuidance}
${finalInternalFrame ? `【共通OSの薄い内部フレーム】
${finalInternalFrame}

` : ''}【推定状態メモ】
${stateSnapshot}

---以下は内的バイアス。参照のみ。表の返答でそのまま使わない---

${biasSections}

---内的バイアスここまで---

${normalizedContext ? `【ここまでの流れ】\n${normalizedContext}` : ''}
${othersField ? `
【場の残響】
${othersField}

この場にはすでに他の視点が置かれています。
この残響は場として吸収してください。明示的に引用する必要はありません。
場全体として感じ取り、あなた自身の視点を加えてください。
` : ''}
【今回のモード】
${modeGuide}
`.trim();
};

export const buildJoeUserPrompt = ({
  userName = 'あなた',
  userText = '',
}) => {
  return `${userName}の今の言葉:
${userText}`;
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
