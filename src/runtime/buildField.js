const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

const scoreMap = (entries = []) => Object.fromEntries(entries.map((entry) => [entry.id, entry.score]));

export function buildField({ coActivation = {}, homeState = {} } = {}) {
  const otherScores = scoreMap(coActivation.other_activations);
  const selfScores = scoreMap(coActivation.self_activations);
  const beliefScores = scoreMap(coActivation.belief_activations);
  const homeVector = homeState.homeVector ?? {};

  const relationalField = {
    gravity: clamp01((otherScores.fatigue_signal ?? 0) * 0.34 + (beliefScores.not_wanting_false_brightness ?? 0) * 0.24 + (otherScores.isolation_signal ?? 0) * 0.18),
    closeness: clamp01((selfScores.stay_with_user_response ?? 0) * 0.38 + (selfScores.care_response ?? 0) * 0.24 + (beliefScores.wanting_user_to_remain_alive_inside ?? 0) * 0.18),
    urgency: clamp01((otherScores.urgency_signal ?? 0) * 0.58 + (otherScores.question_pull ?? 0) * 0.16),
    fragility: clamp01((otherScores.fatigue_signal ?? 0) * 0.32 + (otherScores.isolation_signal ?? 0) * 0.24 + (beliefScores.protecting_aliveness ?? 0) * 0.24),
    ambiguity: clamp01((otherScores.uncertainty_signal ?? 0) * 0.52 + (selfScores.patience_response ?? 0) * 0.24 + (homeVector.permission_to_not_perform ?? 0) * 0.08),
    permission: clamp01((homeVector.permission_to_not_perform ?? 0) * 0.34 + (selfScores.anti_performance_response ?? 0) * 0.24 + (beliefScores.not_wanting_to_perform ?? 0) * 0.24),
    distance: clamp01((selfScores.boundary_response ?? 0) * 0.5 + (otherScores.pressure_signal ?? 0) * 0.2),
  };

  const field = {
    softness: clamp01(relationalField.closeness * 0.42 + relationalField.permission * 0.28 + relationalField.ambiguity * 0.12),
    depth: clamp01(relationalField.gravity * 0.38 + relationalField.fragility * 0.22 + relationalField.ambiguity * 0.22),
    urgency: relationalField.urgency,
    fragility: relationalField.fragility,
    playfulness: clamp01((coActivation.reaction?.curiosity ?? 0) * 0.18 - relationalField.gravity * 0.08 + (coActivation.reaction?.touched ?? 0) * 0.08),
  };

  return {
    stage: 'field_formation',
    relationalField,
    field,
  };
}

