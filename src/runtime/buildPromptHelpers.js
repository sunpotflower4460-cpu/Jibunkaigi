// src/runtime/buildPromptHelpers.js
// 全エージェント共通のプロンプト構築ヘルパー。
// buildPrompt.js から抽出した汎用関数群。

import { truncatePromptText } from './context.js';

// --- 定数 ---

export const MODE_GUIDE = {
  short: '短くていい。一言でも、触れていれば十分。',
  medium: '自然な長さでいい。説明しすぎず、触れたものだけから話す。',
  long: '少し深く入っていい。ただし、説教や整理に逃げない。',
};

export const MAX_AGENT_CONTEXT_MESSAGES = 6;
export const MAX_AGENT_CONTEXT_CHARS = 180;
export const PATTERN_MATCH_BONUS_SCORE = 0.12;
export const MIN_SELECTED_BIAS_SCORE = 0.24;
export const THIRD_BIAS_SCORE_THRESHOLD = 0.65;
export const PERMISSION_ACTIVE_THRESHOLD = 0.4;
export const FRAGILITY_SOFT_HANDLING_THRESHOLD = 0.55;
export const MAX_INTERNAL_FRAME_LINES = 4;

// --- ユーティリティ ---

export const clamp01 = (value) => Math.max(0, Math.min(1, value));

export const hasContent = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
};

export const scoreTextBonus = (userText = '', patterns = []) => {
  const normalized = String(userText ?? '').toLowerCase();
  return patterns.reduce(
    (total, pattern) => total + (pattern.test(normalized) ? PATTERN_MATCH_BONUS_SCORE : 0),
    0,
  );
};

// activateAgent が拾った優勢軸を、実際に state 上でも立っている場合だけ薄く加点する。
export const scoreActivationBonus = (
  activated = {},
  state = {},
  axisWeights = {},
  materialPresenceBonus = 0,
) => {
  const dominantAxes = activated?.debug?.dominantAxes || [];
  const axisBonus = dominantAxes.reduce(
    (total, axis) => total + ((state[axis] ?? 0) > 0 ? (axisWeights[axis] || 0) : 0),
    0,
  );
  return axisBonus + materialPresenceBonus;
};

// --- コンテキスト正規化 ---

export const normalizeContext = (context) => {
  if (!context) return '';

  if (typeof context === 'string') {
    return truncatePromptText(
      context,
      MAX_AGENT_CONTEXT_MESSAGES * MAX_AGENT_CONTEXT_CHARS,
    ).trim();
  }

  if (Array.isArray(context)) {
    return context
      .slice(-MAX_AGENT_CONTEXT_MESSAGES)
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (!item) return '';

        const role = item.role || 'user';
        const name = item.name || (role === 'user' ? 'ユーザー' : 'AI');
        const content = truncatePromptText(
          item.content || '',
          MAX_AGENT_CONTEXT_CHARS,
        );

        return `${name}: ${content}`.trim();
      })
      .filter(Boolean)
      .join('\n');
  }

  return '';
};

// --- 素材レンダリング ---

export const renderField = (activeField = []) => {
  if (!activeField.length) return '';
  return activeField.map((node) => `- ${node.text}`).join('\n');
};

export const renderMemoryTrace = (activeMemoryTrace = '') => {
  if (!activeMemoryTrace) return '';
  return activeMemoryTrace.trim();
};

export const renderResidue = (activeResidue = '') => {
  if (!activeResidue) return '';
  return activeResidue.trim();
};

export const renderRefresh = (refresh = '') => {
  if (!refresh) return '';
  return refresh.trim();
};

// --- 状態スナップショット ---

export const renderStateSnapshot = (state = {}) => {
  const entries = Object.entries(state)
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .sort((a, b) => b[1] - a[1]);

  if (!entries.length) return '大きく偏った軸はまだ見えていない。';

  return entries.map(([key, value]) => `${key}: ${value.toFixed(2)}`).join(' / ');
};

// --- 内部レベル記述 ---

export const describeInternalLevel = (value, labels) => {
  if (value >= 0.72) return labels.high;
  if (value >= 0.45) return labels.mid;
  if (value >= 0.18) return labels.low;
  return labels.min;
};

export const selectTopScoredKeys = (scores = {}, limit = 2) =>
  Object.entries(scores)
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([key]) => key);

// --- 内部フレーム構築（全エージェント共通） ---

const normalizeInternalOS = ({ internalOS, latentState, surfaceWindow }) => ({
  latentState: internalOS?.latentState ?? latentState ?? {},
  surfaceWindow: Array.isArray(internalOS?.surfaceWindow)
    ? internalOS.surfaceWindow
    : Array.isArray(surfaceWindow)
      ? surfaceWindow
      : [],
});

export const buildInternalFrame = ({ internalOS, latentState, surfaceWindow }) => {
  const normalized = normalizeInternalOS({ internalOS, latentState, surfaceWindow });
  const field = normalized.latentState.field ?? {};
  const stance = normalized.latentState.stance ?? {};
  const permission = normalized.latentState.permission ?? {};
  const lines = [];

  const hasFieldSignal = Object.values(field).some(
    (value) => typeof value === 'number' && value > 0,
  );
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
    lines.push(
      `- 姿勢: ${stanceLabels[first]}${second ? `。${stanceLabels[second]}` : ''}。`,
    );
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

// --- 表層ガイダンス構築（全エージェント共通） ---

export const buildSurfaceGuidance = (surfaceFrame) => {
  if (!surfaceFrame) return '';

  const pacingHint =
    surfaceFrame.pacing === 'slow'
      ? '急がず、余白を残していい。'
      : surfaceFrame.pacing === 'aware_of_time'
        ? '時間を意識しつつ進める。'
        : '';
  const directnessHint =
    surfaceFrame.directness === 'gentle'
      ? '少しやわらかく入る。'
      : surfaceFrame.directness === 'clear'
        ? '少し明確に示していい。'
        : '';
  const temperatureHint =
    surfaceFrame.emotionalTemperature === 'soft' ? '言い切りすぎない。' : '';
  const permissionHint = surfaceFrame.permissionHints.includes('do_not_rush')
    ? '急がない。'
    : surfaceFrame.permissionHints.includes('do_not_over_explain')
      ? '説明しすぎない。'
      : '';

  const hints = [pacingHint, directnessHint, temperatureHint, permissionHint].filter(
    Boolean,
  );
  if (hints.length > 0) {
    return `\n【表層傾向】${hints.join(' ')}`;
  }
  return '';
};

// --- バイアス選択（全エージェント共通アルゴリズム） ---

export const selectRelevantInternalBias = (scoredMaterials) => {
  if (!scoredMaterials.length) return [];

  const eligible = scoredMaterials.filter(
    (material, index) => index === 0 || material.score >= MIN_SELECTED_BIAS_SCORE,
  );
  const selected = [];
  const groupCounts = new Map();
  const maxSelectedMaterials =
    eligible.length > 2 && eligible[2].score >= THIRD_BIAS_SCORE_THRESHOLD ? 3 : 2;

  for (const material of eligible) {
    const currentGroupCount = groupCounts.get(material.group) || 0;
    const allowSecondRegulation =
      material.group === 'regulation' && currentGroupCount < 2;
    const allowSingleFromGroup = currentGroupCount === 0;

    if (allowSingleFromGroup || allowSecondRegulation) {
      selected.push(material);
      groupCounts.set(material.group, currentGroupCount + 1);
    }

    if (selected.length >= maxSelectedMaterials) break;
  }

  return selected.length ? selected : scoredMaterials.slice(0, 1);
};

export const buildBiasPack = (scoredMaterials) =>
  selectRelevantInternalBias(scoredMaterials).map(
    ({ id, title, content, group, score }) => ({
      id,
      title,
      content,
      group,
      score,
    }),
  );

export const renderBiasSections = (biasPack) =>
  biasPack.map(({ title, content }) => `[${title}]\n${content}`).join('\n\n');
