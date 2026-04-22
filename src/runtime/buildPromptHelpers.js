// src/runtime/buildPromptHelpers.js
// 全エージェント共通のプロンプト構築ヘルパー。
// buildPrompt.js から抽出した汎用関数群。

import { truncatePromptText } from './context.js';

// --- 定数 ---

export const MODE_GUIDE = {
  short: '場は静かで、多くの言葉を必要としていない。',
  medium: '触れたぶんだけで足りる。',
  long: '少し奥まで見ていても、急がなくていい。',
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

/**
 * 活性化した粒子を LLM に「場に浮かぶもの」として提示する。
 * tonalHints / stanceHints / avoidHints は LLM に渡さない。
 *
 * Priority order (updated for Final Decision Substrate v0.1):
 * 1. activated.finalDecisionSubstrate (Final Decision Substrate with thick foreground)
 * 2. activated.selectedMixedClusters?.selected (mixed clusters with thought/feeling/move)
 * 3. activated.selectedThoughts?.selected (thought-only clusters)
 * 4. activated.boundMixedNodes?.clusters (all mixed clusters before selection)
 * 5. activated.activatedThoughts?.items (all activated thoughts before binding)
 * 6. activated.selectedClusters / activated.selected / activated.activatedThoughts (legacy fallback)
 */
export const renderActivatedParticles = (activated = {}) => {
  let lines = ['【今、場に浮かんでいるもの】'];
  let particles = [];

  // Priority 1: Final Decision Substrate (v0.1)
  // This provides the thickest foreground with thought/feeling/move/tension seeds
  if (activated?.finalDecisionSubstrate?.foreground) {
    const foreground = activated.finalDecisionSubstrate.foreground;

    // Add thought seeds
    if (foreground.thoughtSeeds && foreground.thoughtSeeds.length > 0) {
      foreground.thoughtSeeds.forEach(seed => {
        lines.push(`- ${seed}`);
      });
    }

    // Add feeling seeds
    if (foreground.feelingSeeds && foreground.feelingSeeds.length > 0) {
      foreground.feelingSeeds.forEach(seed => {
        lines.push(`- ${seed}`);
      });
    }

    // Add move seeds
    if (foreground.moveSeeds && foreground.moveSeeds.length > 0) {
      foreground.moveSeeds.forEach(seed => {
        lines.push(`- ${seed}`);
      });
    }

    // Add tension seeds (if any)
    if (foreground.tensionSeeds && foreground.tensionSeeds.length > 0) {
      foreground.tensionSeeds.forEach(seed => {
        lines.push(`- ${seed}`);
      });
    }

    // Return early if we have substrate content
    if (lines.length > 1) {
      return lines.join('\n');
    }
  }

  // Priority 2: selectedMixedClusters.selected
  if (activated?.selectedMixedClusters?.selected && activated.selectedMixedClusters.selected.length > 0) {
    // Get cluster IDs from selectedMixedClusters
    const clusterIds = activated.selectedMixedClusters.selected.map(s => s.clusterId);

    // Find actual clusters in boundMixedNodes
    if (activated?.boundMixedNodes?.clusters) {
      const clusters = activated.boundMixedNodes.clusters.filter(c =>
        clusterIds.includes(c.clusterId)
      );

      // Extract textSeed from thought nodes in these clusters
      clusters.forEach(cluster => {
        if (cluster.thoughtIds && Array.isArray(cluster.thoughtIds)) {
          cluster.thoughtIds.forEach(thoughtId => {
            // Find thought in activatedThoughts
            if (activated?.activatedThoughts?.items) {
              const thought = activated.activatedThoughts.items.find(t => t.nodeId === thoughtId);
              if (thought?.textSeed) {
                particles.push({ textSeed: thought.textSeed });
              }
            }
          });
        }
      });
    }
  }

  // Priority 3: selectedThoughts.selected (fallback to thought-only)
  if (particles.length === 0 && activated?.selectedThoughts?.selected && activated.selectedThoughts.selected.length > 0) {
    const clusterIds = activated.selectedThoughts.selected.map(s => s.clusterId);

    // Find actual clusters in boundThoughts
    if (activated?.boundThoughts?.clusters) {
      const clusters = activated.boundThoughts.clusters.filter(c =>
        clusterIds.includes(c.id)
      );

      // Extract textSeed from thought nodes
      clusters.forEach(cluster => {
        if (cluster.thoughtIds && Array.isArray(cluster.thoughtIds)) {
          cluster.thoughtIds.forEach(thoughtId => {
            if (activated?.activatedThoughts?.items) {
              const thought = activated.activatedThoughts.items.find(t => t.nodeId === thoughtId);
              if (thought?.textSeed) {
                particles.push({ textSeed: thought.textSeed });
              }
            }
          });
        }
      });
    }
  }

  // Priority 4: boundMixedNodes.clusters (before selection)
  if (particles.length === 0 && activated?.boundMixedNodes?.clusters && activated.boundMixedNodes.clusters.length > 0) {
    const topClusters = activated.boundMixedNodes.clusters.slice(0, 2);
    topClusters.forEach(cluster => {
      if (cluster.thoughtIds && Array.isArray(cluster.thoughtIds)) {
        cluster.thoughtIds.forEach(thoughtId => {
          if (activated?.activatedThoughts?.items) {
            const thought = activated.activatedThoughts.items.find(t => t.nodeId === thoughtId);
            if (thought?.textSeed) {
              particles.push({ textSeed: thought.textSeed });
            }
          }
        });
      }
    });
  }

  // Priority 5: activatedThoughts.items (before binding)
  if (particles.length === 0 && activated?.activatedThoughts?.items && activated.activatedThoughts.items.length > 0) {
    particles = activated.activatedThoughts.items
      .slice(0, 5)
      .map(item => ({ textSeed: item.textSeed }));
  }

  // Priority 6: Legacy fallback (kept for backward compatibility)
  // WARNING: This fallback handles legacy shapes that may not have clear textSeed
  // FUTURE: Consider removing once all code paths use new structures
  if (particles.length === 0) {
    const legacyParticles = activated?.selectedClusters
      || activated?.selected
      || activated?.activatedThoughts
      || [];

    if (Array.isArray(legacyParticles) && legacyParticles.length > 0) {
      // Normalize legacy structures to ensure we can extract text
      particles = legacyParticles.map(p => {
        // If it's already an object with textSeed/text, keep it
        if (p && typeof p === 'object') return p;
        // If it's a primitive, skip it
        return null;
      }).filter(Boolean);
    }
  }

  if (!Array.isArray(particles) || particles.length === 0) {
    // DEBUG: If we reach here with activated data but no particles extracted,
    // it suggests the input shape doesn't match any priority path
    if (activated && typeof activated === 'object' && Object.keys(activated).length > 0) {
      console.warn('[renderActivatedParticles] No particles extracted despite activated data present. Check input shape.');
    }
    return '';
  }

  particles.slice(0, 5).forEach((p) => {
    const seed = p?.textSeed || p?.text || p?.id || '';
    if (seed) {
      lines.push(`- ${seed}`);
    }
  });

  return lines.join('\n');
};

// --- Phase 4 (修正指示書 v3): 内部 hints の薄い前景化 ---
// tonalHints / stanceHints / avoidHints は元々 LLM に渡さない内部プロパティだが、
// それでは差分が途中で痩せて 5 人が似通うため、
// 発話直前のみ「補正輪」として極薄に差し込む。長い説明文にはしない。

const HINT_MAX_STANCE = 3;
const HINT_MAX_AVOID = 6;
const HINT_SOURCE_DEPTH = 5;
const SHARED_AVOID_HINTS = [
  '相手の言葉をそのまま引用して始めること',
  '「〜のですね」「〜ということですね」で入ること',
  'このプロンプトに書かれた言葉や概念をそのまま応答に含めること',
  '共感だけで一段落して、相手の問いに触れないこと',
];

const dedupe = (arr) => Array.from(new Set(arr.filter((v) => typeof v === 'string' && v.trim().length)));

// Particle と、selected / activated 構造の両方から hint を集める。
// 集約は「上位 HINT_SOURCE_DEPTH 粒子分」に限定する。
const collectHintsFromActivated = (activated = {}, key) => {
  if (!activated || typeof activated !== 'object') return [];

  const collected = [];
  const push = (value) => {
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (typeof v === 'string') collected.push(v);
      });
    }
  };

  // 1) activated.activatedThoughts.items (Phase 3 で hints を残した)
  const thoughtItems = activated?.activatedThoughts?.items;
  if (Array.isArray(thoughtItems)) {
    thoughtItems.slice(0, HINT_SOURCE_DEPTH).forEach((item) => push(item?.[key]));
  }

  // 2) selectedThoughts / selectedMixedClusters から参照される thought の hints
  //    clusterId 経由で辿るのは重いので、ここでは activatedThoughts.items で代用する。
  //    （上位粒子から既に集めているので、substrate 側は省略）

  // 3) 万一 activatedFeelings / activatedMoves が hints を持つ場合も拾う
  const feelingItems = activated?.activatedFeelings?.items;
  if (Array.isArray(feelingItems)) {
    feelingItems.slice(0, HINT_SOURCE_DEPTH).forEach((item) => push(item?.[key]));
  }
  const moveItems = activated?.activatedMoves?.items;
  if (Array.isArray(moveItems)) {
    moveItems.slice(0, HINT_SOURCE_DEPTH).forEach((item) => push(item?.[key]));
  }

  return collected;
};

// latentState 側にも同じ構造が入っているので、そこからも拾う。
const collectHintsFromLatent = (latentState, key) => {
  if (!latentState || typeof latentState !== 'object') return [];
  const collected = [];
  const sources = [
    latentState?.activatedThoughts?.items,
    latentState?.activatedFeelings?.items,
    latentState?.activatedMoves?.items,
  ];
  sources.forEach((items) => {
    if (Array.isArray(items)) {
      items.slice(0, HINT_SOURCE_DEPTH).forEach((item) => {
        const value = item?.[key];
        if (Array.isArray(value)) {
          value.forEach((v) => {
            if (typeof v === 'string') collected.push(v);
          });
        }
      });
    }
  });
  return collected;
};

/**
 * stanceHints を 1 行に集約する（構えの向き）。
 * 例: 「（急がず、結論に飛ばず、一点に触れる）」
 * @returns {string}
 */
export const renderStanceLine = (activated, latentState) => {
  const hints = dedupe([
    ...collectHintsFromActivated(activated, 'stanceHints'),
    ...collectHintsFromLatent(latentState, 'stanceHints'),
  ]).slice(0, HINT_MAX_STANCE);
  if (!hints.length) return '';
  return `（${hints.join('、')}）`;
};

export const renderAvoidBlock = (activated = {}, _latentState) => {
  const hints = new Set(SHARED_AVOID_HINTS);
  const items = activated?.activatedThoughts?.items || [];
  items.slice(0, 3).forEach((item) => {
    if (Array.isArray(item.avoidHints)) {
      item.avoidHints.forEach((hint) => hints.add(hint));
    }
  });
  const list = [...hints].slice(0, HINT_MAX_AVOID);
  if (list.length === 0) return '';
  return `【この場では自然に避けるもの】\n${list.map((hint) => `- ${hint}`).join('\n')}`;
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
// LEGACY COMPATIBILITY LAYER
// @deprecated This function is a legacy helper for old prompt structure
// Production prompt path uses textPipeline (buildExistenceText, buildFieldText, buildMarginText)
// This helper remains for backward compatibility / debugging only
// DO NOT use in production prompt - prefer textPipeline descriptive path

const normalizeInternalOS = ({ internalOS, latentState, surfaceWindow }) => ({
  latentState: internalOS?.latentState ?? latentState ?? {},
  surfaceWindow: Array.isArray(internalOS?.surfaceWindow)
    ? internalOS.surfaceWindow
    : Array.isArray(surfaceWindow)
      ? surfaceWindow
      : [],
});

/**
 * @deprecated Legacy internal frame builder
 * This function builds bullet-point instructions for LLM based on internal state
 * Production prompt path uses textPipeline shared descriptive approach instead
 * Keep for backward compatibility / debugging but do not use in production buildAgentPrompt
 */
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
// LEGACY COMPATIBILITY LAYER
// @deprecated This function is a legacy helper for old prompt structure
// Production prompt path uses textPipeline / shared descriptive builders
// This helper remains for backward compatibility / debugging only
// DO NOT use in production prompt - prefer textPipeline descriptive path

/**
 * @deprecated Legacy surface guidance builder
 * This function builds directive-style hints for surface generation
 * Production prompt path uses textPipeline shared descriptive approach instead
 * Keep for backward compatibility / debugging but do not use in production buildAgentPrompt
 */
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
