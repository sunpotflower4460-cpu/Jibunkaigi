import test from 'node:test';
import assert from 'node:assert/strict';

import { buildField } from '../buildField.js';

test('buildField forms a relational field instead of a user diagnosis', () => {
  const result = buildField({
    coActivation: {
      other_activations: [
        { id: 'fatigue_signal', score: 0.82 },
        { id: 'question_pull', score: 0.58 },
      ],
      self_activations: [
        { id: 'care_response', score: 0.78 },
        { id: 'anti_performance_response', score: 0.42 },
      ],
      belief_activations: [
        { id: 'protecting_aliveness', score: 0.88 },
        { id: 'not_wanting_to_perform', score: 0.62 },
      ],
      reaction: {
        touched: 0.8,
        protect: 0.74,
        clarify: 0.46,
        curiosity: 0.22,
        holdBackJudgment: 0.58,
      },
    },
    homeState: {
      homeVector: {
        permission_to_not_perform: 0.72,
      },
    },
  });

  assert.ok('gravity' in result.relationalField);
  assert.ok('closeness' in result.relationalField);
  assert.ok('permission' in result.relationalField);
  assert.equal('userDiagnosis' in result.relationalField, false);
});

