const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

const top = (entries = [], max = 2) => [...entries].slice(0, max);

export function bindEmergences({ coActivation = {}, fieldState = {} } = {}) {
  const bindings = [];
  const other = top(coActivation.other_activations, 2);
  const self = top(coActivation.self_activations, 2);
  const beliefs = top(coActivation.belief_activations, 2);

  other.forEach((otherActivation) => {
    self.forEach((selfActivation) => {
      bindings.push({
        id: `${otherActivation.id}->${selfActivation.id}`,
        type: 'other_self',
        strength: clamp01((otherActivation.score * 0.52) + (selfActivation.score * 0.42)),
        ambiguity: clamp01(fieldState.relationalField?.ambiguity ?? 0),
        notes: [otherActivation.note, selfActivation.note],
      });
    });

    beliefs.forEach((beliefActivation) => {
      bindings.push({
        id: `${otherActivation.id}->${beliefActivation.id}`,
        type: 'other_belief',
        strength: clamp01((otherActivation.score * 0.48) + (beliefActivation.score * 0.4)),
        ambiguity: clamp01((fieldState.relationalField?.ambiguity ?? 0) * 0.84),
        notes: [otherActivation.note, beliefActivation.note],
      });
    });
  });

  return {
    stage: 'binding_emergence',
    bindings: bindings
      .filter((binding) => binding.strength > 0.12)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 6),
  };
}

