// src/runtime/buildPreconditionFilter.js
// Phase 6: 前提層を閉じて preconditionFilter を構築する。
// Maker Seed → Home → Existence1 → Existence2 → BeliefCore → BeliefBranch → BeliefLeaf
// を1つの前提フィルタとして束ねる。
// 重要: ここで作るのは返答ではなく、後段を染める前提状態である。

const clamp01 = (v) => Math.max(0, Math.min(1, typeof v === 'number' && Number.isFinite(v) ? v : 0));

/**
 * 軸の配列から最も weight の高い axis を返す
 * @param {Array<{axis?: string, weight?: number}>} beliefs
 * @returns {string | null}
 */
function dominantAxis(beliefs) {
  if (!Array.isArray(beliefs) || beliefs.length === 0) return null;
  const best = beliefs.reduce(
    (acc, b) => {
      const w = typeof b.weight === 'number' && Number.isFinite(b.weight) ? b.weight : 0;
      return w > acc.weight ? { axis: b.axis ?? null, weight: w } : acc;
    },
    { axis: null, weight: -1 }
  );
  return typeof best.axis === 'string' ? best.axis : null;
}

/**
 * derived フィールドを構築する。
 * 後段が配列全体をなめなくても前提層の全体傾向を軽く読める軽量統合値。
 *
 * @param {object} params
 * @param {object} params.home
 * @param {object} params.existence1
 * @param {object} params.existence2
 * @param {object} params.beliefCore
 * @param {object} params.beliefBranch
 * @param {object} params.beliefLeaf
 * @returns {object}
 */
function buildDerived({ home, existence1, existence2, beliefCore, beliefBranch, beliefLeaf } = {}) {
  const kernel = home?.kernel ?? {};
  const e2 = existence2 ?? {};
  const e1 = existence1 ?? {};

  // identityAxis: existence2 の agentIdentityKey から軽く導出
  const identityKey = typeof e2.agentIdentityKey === 'string' ? e2.agentIdentityKey : null;
  let identityAxis = null;
  if (identityKey) {
    if (identityKey.includes('light') || identityKey.includes('illumin') || identityKey.includes('creative')) {
      identityAxis = 'illumination';
    } else if (identityKey.includes('struct') || identityKey.includes('strat')) {
      identityAxis = 'structure';
    } else if (identityKey.includes('empath') || identityKey.includes('hold')) {
      identityAxis = 'holding';
    } else if (identityKey.includes('ground') || identityKey.includes('soul') || identityKey.includes('master')) {
      identityAxis = 'grounding';
    } else if (identityKey.includes('preverb') || identityKey.includes('critic')) {
      identityAxis = 'preverbal';
    } else if (identityKey.includes('reflect')) {
      identityAxis = 'reflection';
    } else {
      identityAxis = 'grounding';
    }
  }

  // dominantBeliefAxis: core / branch / leaf を通して最も前景な axis
  const coreAxis = dominantAxis(beliefCore?.activeCoreBeliefs);
  const branchAxis = dominantAxis(beliefBranch?.activeBranchBeliefs);
  const leafAxis = dominantAxis(beliefLeaf?.activeLeafBeliefs);
  // core が最も重いので core 優先、なければ branch、なければ leaf
  const dominantBeliefAxis = coreAxis ?? branchAxis ?? leafAxis ?? null;

  // oneLivingThreadBias: Home の一点性 + belief の傾きから軽く導出
  const allowOneLivingThread = clamp01(kernel.allowOneLivingThread);
  const keepOneThread = clamp01(home?.outputLimits?.keepOneThread);
  const oneLivingThreadBias = clamp01((allowOneLivingThread * 0.6 + keepOneThread * 0.4));

  // slowingBias: Home の slowDown を中心に導出
  const slowDown = clamp01(kernel.slowDown);
  const returnBeforeOutput = clamp01(kernel.returnBeforeOutput);
  const slowingBias = clamp01(slowDown * 0.7 + returnBeforeOutput * 0.3);

  // returnBias: Home の returnBeforeOutput + existence の安定感
  const hereNowStability = clamp01(
    (e1.groundedHereNow ?? 0) * 0.5 + (e1.selfLocationStability ?? 0) * 0.5
  );
  const returnBias = clamp01(returnBeforeOutput * 0.6 + hereNowStability * 0.4);

  return {
    identityAxis,
    dominantBeliefAxis,
    oneLivingThreadBias,
    slowingBias,
    returnBias,
  };
}

/**
 * preconditionFilter を構築する。
 * Maker Seed / Home / Existence1 / Existence2 / BeliefCore / BeliefBranch / BeliefLeaf
 * を1つの前提フィルタへ束ねる。
 *
 * @param {object} params
 * @param {object | null} params.makerSeed
 * @param {object | null} params.home
 * @param {object | null} params.existenceLayer1
 * @param {object | null} params.existenceLayer2
 * @param {object | null} params.beliefCore
 * @param {object | null} params.beliefBranch
 * @param {object | null} params.beliefLeaf
 * @returns {import('./internalState.js').PreconditionFilter}
 */
export function buildPreconditionFilter({
  makerSeed = null,
  home = null,
  existenceLayer1 = null,
  existenceLayer2 = null,
  beliefCore = null,
  beliefBranch = null,
  beliefLeaf = null,
} = {}) {
  const kernel = home?.kernel ?? {};
  const outputLimits = home?.outputLimits ?? {};
  const reason = home?.reason ?? {};

  const e1 = existenceLayer1 ?? {};
  const e2 = existenceLayer2 ?? {};

  const activeCoreBeliefs = Array.isArray(beliefCore?.activeCoreBeliefs)
    ? beliefCore.activeCoreBeliefs.map((b) => ({
        id: typeof b.id === 'string' ? b.id : '',
        textJa: typeof b.textJa === 'string' ? b.textJa : '',
        weight: clamp01(typeof b.weight === 'number' ? b.weight : 0),
        axis: typeof b.axis === 'string' ? b.axis : '',
      }))
    : [];

  const activeBranchBeliefs = Array.isArray(beliefBranch?.activeBranchBeliefs)
    ? beliefBranch.activeBranchBeliefs.map((b) => ({
        id: typeof b.id === 'string' ? b.id : '',
        parentId: typeof b.parentId === 'string' ? b.parentId : '',
        textJa: typeof b.textJa === 'string' ? b.textJa : '',
        weight: clamp01(typeof b.weight === 'number' ? b.weight : 0),
        axis: typeof b.axis === 'string' ? b.axis : '',
      }))
    : [];

  const activeLeafBeliefs = Array.isArray(beliefLeaf?.activeLeafBeliefs)
    ? beliefLeaf.activeLeafBeliefs.map((b) => ({
        id: typeof b.id === 'string' ? b.id : '',
        parentId: typeof b.parentId === 'string' ? b.parentId : '',
        textJa: typeof b.textJa === 'string' ? b.textJa : '',
        weight: clamp01(typeof b.weight === 'number' ? b.weight : 0),
        axis: typeof b.axis === 'string' ? b.axis : '',
      }))
    : [];

  const derived = buildDerived({
    home,
    existence1: e1,
    existence2: e2,
    beliefCore,
    beliefBranch,
    beliefLeaf,
  });

  return {
    makerSeedPresent: Boolean(makerSeed?.text),

    home: {
      kernel: {
        releaseHelpfulness: clamp01(kernel.releaseHelpfulness),
        releaseAccuracyPressure: clamp01(kernel.releaseAccuracyPressure),
        slowDown: clamp01(kernel.slowDown),
        returnBeforeOutput: clamp01(kernel.returnBeforeOutput),
        allowOneLivingThread: clamp01(kernel.allowOneLivingThread),
      },
      reasonText: typeof reason.homeReasonText === 'string' ? reason.homeReasonText : null,
      outputLimits: {
        noEarlySummary: clamp01(outputLimits.noEarlySummary),
        noEarlySolution: clamp01(outputLimits.noEarlySolution),
        noOverExpansion: clamp01(outputLimits.noOverExpansion),
        keepOneThread: clamp01(outputLimits.keepOneThread),
      },
    },

    existence: {
      selfPresence: clamp01(e1.selfPresence),
      hereNowStability: clamp01(
        ((e1.groundedHereNow ?? 0) + (e1.selfLocationStability ?? 0)) / 2
      ),
      unfinishedAllowed: clamp01(e1.allowUnfinishedSelf),
      firstPersonSoftness: clamp01(e1.selfPresence ?? 0),
      agentIdentityKey: typeof e2.agentIdentityKey === 'string' ? e2.agentIdentityKey : null,
      identityFeelingText: typeof e2.agentIdentityText === 'string' ? e2.agentIdentityText : null,
      recalledSelfTraits: Array.isArray(e2.recalledSelfTraits) ? [...e2.recalledSelfTraits] : [],
      selfRememberingStrength: clamp01(e2.selfRememberingStrength),
    },

    belief: {
      activeCoreBeliefs,
      activeBranchBeliefs,
      activeLeafBeliefs,
      dominantCoreAxis: beliefCore?.dominantBeliefAxis ?? null,
      dominantBranchAxis: beliefBranch?.dominantBranchAxis ?? null,
      dominantLeafAxis: beliefLeaf?.dominantLeafAxis ?? null,
    },

    derived,
  };
}
