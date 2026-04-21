import {
  PROTO_MEANING_BLEND_WEIGHTS,
  PROTO_MEANING_CONTEXT_BIAS,
  PROTO_MEANING_KEYWORD_BIAS,
  PROTO_MEANING_MAX_CANDIDATES,
  PROTO_MEANING_THRESHOLDS,
} from './config/microSignalBias.js';

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));
const DEFAULT_SENSORY_FALLBACK = 'まだ言葉になる前の感触がうっすら残っている';
const DEFAULT_NARRATIVE_FALLBACK = 'まだ決め切らずに持っておきたい意味が残っている';

const normalizeContext = (context = {}) => ({
  agentId: typeof context?.agentId === 'string' ? context.agentId : null,
  userText: typeof context?.userText === 'string' ? context.userText : '',
  dominantBeliefAxis: typeof context?.dominantBeliefAxis === 'string' ? context.dominantBeliefAxis : null,
  dominantTensionAxis: typeof context?.dominantTensionAxis === 'string' ? context.dominantTensionAxis : null,
  identityKey: typeof context?.identityKey === 'string' ? context.identityKey : null,
});

const pushCandidate = (target, text, weight) => {
  if (!text) return;
  target.push({ text, weight: clamp01(weight) });
};

const finalizeCandidates = (candidates = []) => {
  const seen = new Set();

  return candidates
    .sort((a, b) => b.weight - a.weight)
    .filter(({ text }) => {
      if (seen.has(text)) return false;
      seen.add(text);
      return true;
    })
    .slice(0, PROTO_MEANING_MAX_CANDIDATES)
    .map(({ text }) => text);
};

const buildWeightedCandidateScore = (vectors = {}, weights = {}) => Object.entries(weights).reduce(
  (sum, [vectorKey, vectorWeights]) => sum + Object.entries(vectorWeights).reduce(
    (vectorSum, [key, weight]) => (
      vectorSum + (clamp01(vectors?.[vectorKey]?.[key]) * weight)
    ),
    0,
  ),
  0,
);

export const createInitialProtoMeaning = () => ({
  sensory: [],
  narrative: [],
});

export const buildProtoMeaning = (fusedState = {}, context = {}) => {
  const lexical = fusedState?.lexical ?? {};
  const fused = fusedState?.fused ?? {};
  const normalizedContext = normalizeContext(context);
  const userText = normalizedContext.userText;
  const sensoryCandidates = [];
  const narrativeCandidates = [];

  if ((fused.hesitation ?? 0) >= PROTO_MEANING_THRESHOLDS.light || /(?:ためら|止ま|うまく言えない)/.test(userText)) {
    pushCandidate(sensoryCandidates, 'ためらいが喉元に残っている', fused.hesitation);
  }
  if ((fused.pressure ?? 0) >= PROTO_MEANING_THRESHOLDS.moderate || /(?:急ぐ|壊れそう|圧|焦)/.test(userText)) {
    pushCandidate(sensoryCandidates, '胸の前に圧がかかっている', fused.pressure);
  }
  if ((fused.unfinishedPull ?? 0) >= PROTO_MEANING_THRESHOLDS.light || /(?:残って|違和感|気になる|消したくない)/.test(userText)) {
    pushCandidate(sensoryCandidates, '終わりきらないざらつきが残っている', fused.unfinishedPull);
  }
  if ((fused.guardedness ?? 0) >= PROTO_MEANING_THRESHOLDS.light || /(?:怖|笑われ|引っ込|合わせる)/.test(userText)) {
    pushCandidate(sensoryCandidates, '守りながら外をうかがっている', fused.guardedness);
  }
  if ((fused.ember ?? 0) >= PROTO_MEANING_THRESHOLDS.light || /(?:出したい|やりたい|進みたい|消したくない)/.test(userText)) {
    pushCandidate(
      sensoryCandidates,
      (fused.pressure ?? 0) >= PROTO_MEANING_THRESHOLDS.moderate
        ? '火種はあるが、前に出る直前で揺れている'
        : '細い火種がまだ消えずに残っている',
      Math.max(fused.ember ?? 0, fused.pressure ?? 0)
    );
  }
  if ((fused.selfSilencing ?? 0) >= PROTO_MEANING_THRESHOLDS.sensorySelfSilencing) {
    pushCandidate(sensoryCandidates, '言葉が出る前に自分で少し引いている', fused.selfSilencing);
  }

  if (
    (
      (fused.ember ?? 0) >= PROTO_MEANING_THRESHOLDS.light
      && (fused.hesitation ?? 0) >= PROTO_MEANING_THRESHOLDS.narrativeHesitationSupport
    )
    || /(?:出したい|やりたい|作りたい|書きたい)/.test(userText)
  ) {
    pushCandidate(
      narrativeCandidates,
      '出したいものは残っているが、前に出す手前でためらっている',
      buildWeightedCandidateScore(
        { fused },
        PROTO_MEANING_BLEND_WEIGHTS.expressiveHesitation,
      )
    );
  }
  if (
    (
      (fused.unfinishedPull ?? 0) >= PROTO_MEANING_THRESHOLDS.light
      && (lexical.resignation ?? 0) >= PROTO_MEANING_THRESHOLDS.narrativeResignationSupport
    )
    || /(?:諦め|無理|残って|気になる)/.test(userText)
  ) {
    pushCandidate(
      narrativeCandidates,
      '諦めかけているが、まだ切り離せていない',
      buildWeightedCandidateScore(
        { lexical, fused },
        PROTO_MEANING_BLEND_WEIGHTS.resignationPull,
      )
    );
  }
  if (
    (
      (fused.guardedness ?? 0) >= PROTO_MEANING_THRESHOLDS.light
      && (fused.reachability ?? 0) >= PROTO_MEANING_THRESHOLDS.narrativeReachabilitySupport
    )
    || /(?:怖|笑われ|届|出したい|見せたい)/.test(userText)
  ) {
    pushCandidate(
      narrativeCandidates,
      '守りを残しつつ、届く形を探している',
      buildWeightedCandidateScore(
        { fused },
        PROTO_MEANING_BLEND_WEIGHTS.guardedReach,
      )
    );
  }
  if (
    (fused.selfSilencing ?? 0) >= PROTO_MEANING_THRESHOLDS.moderate
    || /(?:引っ込|合わせる|自分がいなくなる)/.test(userText)
  ) {
    pushCandidate(
      narrativeCandidates,
      '自分を引っ込めて場を乱さないようにしている',
      fused.selfSilencing
    );
  }
  if (
    (
      (fused.pressure ?? 0) >= PROTO_MEANING_THRESHOLDS.moderate
      && (fused.ember ?? 0) >= PROTO_MEANING_THRESHOLDS.light
    )
    || /(?:急ぐ|壊れそう|怖|進みたい)/.test(userText)
  ) {
    pushCandidate(
      narrativeCandidates,
      '急ぎと怖さのあいだで、火を消さない持ち方を探している',
      buildWeightedCandidateScore(
        { fused },
        PROTO_MEANING_BLEND_WEIGHTS.pressureHolding,
      )
    );
  }
  if (
    (
      (lexical.unfinished ?? 0) >= PROTO_MEANING_THRESHOLDS.narrativeUnfinishedSupport
      && (lexical.reach ?? 0) >= PROTO_MEANING_THRESHOLDS.narrativeReachabilitySupport
    )
    || /(?:残って|消したくない|違和感)/.test(userText)
  ) {
    pushCandidate(
      narrativeCandidates,
      '終わったことにせず、残っている向きを持ち続けている',
      buildWeightedCandidateScore(
        { lexical },
        PROTO_MEANING_BLEND_WEIGHTS.unfinishedReach,
      )
    );
  }

  if (normalizedContext.dominantBeliefAxis === 'holding' || normalizedContext.dominantBeliefAxis === 'presence') {
    pushCandidate(
      narrativeCandidates,
      '壊さずに持つことを優先している',
      PROTO_MEANING_CONTEXT_BIAS.holdingOrPresenceNarrative,
    );
  }
  if (normalizedContext.dominantBeliefAxis === 'illumination') {
    pushCandidate(
      narrativeCandidates,
      'まだ見えていない核を照らそうとしている',
      PROTO_MEANING_CONTEXT_BIAS.illuminationNarrative,
    );
  }
  if (normalizedContext.dominantTensionAxis === 'preverbal') {
    pushCandidate(
      narrativeCandidates,
      'まだ文章になる前の輪郭を守っている',
      PROTO_MEANING_CONTEXT_BIAS.preverbalNarrative,
    );
  }
  if (
    (normalizedContext.identityKey || '').includes('creative')
    && (fused.ember ?? 0) >= PROTO_MEANING_THRESHOLDS.moderate
  ) {
    pushCandidate(
      narrativeCandidates,
      '小さくても、創作の芯はまだ消していない',
      PROTO_MEANING_CONTEXT_BIAS.creativeEmberNarrative,
    );
  }
  if (/違和感/.test(userText)) {
    pushCandidate(
      sensoryCandidates,
      '小さな引っかかりが皮膚の近くに残っている',
      PROTO_MEANING_KEYWORD_BIAS.discomfortSensory,
    );
  }
  if (/壊れそう/.test(userText)) {
    pushCandidate(
      sensoryCandidates,
      '急ぐと崩れそうな薄さがある',
      PROTO_MEANING_KEYWORD_BIAS.brittleSensory,
    );
  }
  if (/笑われ/.test(userText)) {
    pushCandidate(
      sensoryCandidates,
      '外の視線に触れる前で身を引いている',
      PROTO_MEANING_KEYWORD_BIAS.socialGazeSensory,
    );
  }

  const sensory = finalizeCandidates(sensoryCandidates);
  const narrative = finalizeCandidates(narrativeCandidates);

  return {
    sensory: sensory.length ? sensory : [DEFAULT_SENSORY_FALLBACK],
    narrative: narrative.length ? narrative : [DEFAULT_NARRATIVE_FALLBACK],
  };
};
