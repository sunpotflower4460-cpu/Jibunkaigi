const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

const countMatches = (text, keywords) =>
  keywords.reduce((count, keyword) => count + (text.includes(keyword) ? 1 : 0), 0);

const toActivation = (id, score, origin, note) => ({
  id,
  score: clamp01(score),
  origin,
  note,
});

const topActivations = (activations) =>
  activations
    .filter((entry) => entry.score > 0.08)
    .sort((a, b) => b.score - a.score);

const scoreBeliefActivation = (belief, otherScores, selfScores) => {
  const otherScore = Object.entries(belief.activationAffinity?.other ?? {}).reduce(
    (sum, [id, weight]) => sum + ((otherScores[id] ?? 0) * weight),
    0,
  );
  const selfScore = Object.entries(belief.activationAffinity?.self ?? {}).reduce(
    (sum, [id, weight]) => sum + ((selfScores[id] ?? 0) * weight),
    0,
  );

  return clamp01((otherScore * 0.56) + (selfScore * 0.34) + ((belief.weight ?? 0) * 0.18));
};

export function coActivate(input, options = {}) {
  const text = typeof input === 'string' ? input.trim().toLowerCase() : '';
  const substrate = options.selfSubstrate ?? { beliefs: [] };
  const homeVector = options.homeState?.homeVector ?? {};

  const fatigueHits = countMatches(text, ['疲れ', 'しんど', '無理', '限界', '動けない', 'つらい']);
  const isolationHits = countMatches(text, ['ひとり', '誰にも', '言えない', '孤独', '置いて']);
  const uncertaintyHits = countMatches(text, ['わから', 'かも', 'まだ', '気がする', '曖昧']);
  const urgencyHits = countMatches(text, ['今すぐ', 'すぐ', '早く', 'もう', '急ぎ']);
  const hopeHits = countMatches(text, ['したい', 'やりたい', '残りたい', '望む', 'できたら']);
  const pressureHits = countMatches(text, ['しなきゃ', 'べき', '期待', '役に立', 'ちゃんと']);
  const questionHits = countMatches(text, ['?', '？', 'どう', 'なぜ', 'なんで', 'どこまで']);

  const other_activations = topActivations([
    toActivation('fatigue_signal', 0.12 + fatigueHits * 0.22, 'other', '相手の言葉に疲れや消耗がにじむ'),
    toActivation('isolation_signal', 0.08 + isolationHits * 0.24, 'other', '切れそうな距離や孤立感がある'),
    toActivation('uncertainty_signal', 0.1 + uncertaintyHits * 0.18, 'other', 'まだ意味が定まらない揺れがある'),
    toActivation('urgency_signal', urgencyHits * 0.24 + (text.includes('!') || text.includes('！') ? 0.08 : 0), 'other', '答えや動きへの時間圧がある'),
    toActivation('hope_signal', 0.04 + hopeHits * 0.18, 'other', 'まだ残っている向きや希望がある'),
    toActivation('pressure_signal', pressureHits * 0.24, 'other', '期待や義務の圧が前に出ている'),
    toActivation('question_pull', 0.06 + questionHits * 0.18, 'other', '問いがこちらを引いている'),
  ]);

  const otherScores = Object.fromEntries(other_activations.map((entry) => [entry.id, entry.score]));

  const self_activations = topActivations([
    toActivation(
      'care_response',
      0.08 + (otherScores.fatigue_signal ?? 0) * 0.62 + (otherScores.isolation_signal ?? 0) * 0.18,
      'self',
      '削れた感じに対して守りたい反応が起きる',
    ),
    toActivation(
      'truth_response',
      0.08 + (otherScores.question_pull ?? 0) * 0.28 + (otherScores.uncertainty_signal ?? 0) * 0.34,
      'self',
      '整えずに本当の輪郭へ寄りたい反応が起きる',
    ),
    toActivation(
      'anti_performance_response',
      0.12 + (homeVector.permission_to_not_perform ?? 0) * 0.5 + (otherScores.pressure_signal ?? 0) * 0.24,
      'self',
      '役立ち演技ではなくいたい反応が起きる',
    ),
    toActivation(
      'patience_response',
      0.08 + (otherScores.uncertainty_signal ?? 0) * 0.34 + (1 - (otherScores.urgency_signal ?? 0)) * 0.14,
      'self',
      'まだ定めずに留まろうとする反応が起きる',
    ),
    toActivation(
      'stay_with_user_response',
      0.08 + (otherScores.isolation_signal ?? 0) * 0.44 + (otherScores.hope_signal ?? 0) * 0.28,
      'self',
      '離さずに場に残りたい反応が起きる',
    ),
    toActivation(
      'boundary_response',
      0.06 + (otherScores.urgency_signal ?? 0) * 0.18 + (otherScores.pressure_signal ?? 0) * 0.22,
      'self',
      '押し込みすぎない距離を取りたい反応が起きる',
    ),
  ]);

  const selfScores = Object.fromEntries(self_activations.map((entry) => [entry.id, entry.score]));

  const belief_activations = topActivations(
    substrate.beliefs.map((belief) => toActivation(
      belief.id,
      scoreBeliefActivation(belief, otherScores, selfScores),
      'belief',
      belief.hopesForUser,
    )),
  );

  const beliefScores = Object.fromEntries(belief_activations.map((entry) => [entry.id, entry.score]));

  const reaction = {
    touched: clamp01((otherScores.fatigue_signal ?? 0) * 0.34 + (selfScores.care_response ?? 0) * 0.46 + (otherScores.hope_signal ?? 0) * 0.14),
    protect: clamp01((selfScores.care_response ?? 0) * 0.38 + (beliefScores.protecting_aliveness ?? 0) * 0.34 + (otherScores.isolation_signal ?? 0) * 0.16),
    clarify: clamp01((selfScores.truth_response ?? 0) * 0.34 + (otherScores.question_pull ?? 0) * 0.28 + (beliefScores.wanting_truth_without_force ?? 0) * 0.14),
    curiosity: clamp01((otherScores.hope_signal ?? 0) * 0.26 + (otherScores.question_pull ?? 0) * 0.24 + (selfScores.truth_response ?? 0) * 0.18),
    holdBackJudgment: clamp01((selfScores.patience_response ?? 0) * 0.32 + (selfScores.anti_performance_response ?? 0) * 0.28 + (beliefScores.not_wanting_to_perform ?? 0) * 0.18),
  };

  return {
    stage: 'co_activation',
    other_activations,
    self_activations,
    belief_activations,
    reaction,
  };
}

