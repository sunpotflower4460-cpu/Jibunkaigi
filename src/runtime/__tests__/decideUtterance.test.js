import test from 'node:test';
import assert from 'node:assert/strict';

import { decideUtterance } from '../decideUtterance.js';

test('decideUtterance keeps self decision separate from utterance rendering', () => {
  const result = decideUtterance('もう無理かも。どうしたらいい？', {
    fieldState: {
      relationalField: {
        gravity: 0.72,
        closeness: 0.64,
        urgency: 0.38,
        fragility: 0.81,
        ambiguity: 0.48,
        permission: 0.62,
        distance: 0.24,
      },
    },
    coActivation: {
      reaction: {
        touched: 0.78,
        protect: 0.84,
        clarify: 0.44,
        curiosity: 0.18,
        holdBackJudgment: 0.74,
      },
    },
    meaningState: {
      stillUnknown: true,
    },
    homeState: {
      homeVector: {
        overperformance: 0.18,
        overorganization: 0.26,
        permission_to_not_perform: 0.72,
      },
    },
  });

  assert.equal(typeof result.replyIntent, 'string');
  assert.equal(typeof result.stance, 'string');
  assert.equal(typeof result.shouldAnswerQuestion, 'boolean');
  assert.equal(typeof result.shouldStayOpen, 'boolean');
  assert.ok(Array.isArray(result.withheldBias));
  assert.ok(result.permissionVector.allowPartialUncertainty > 0);
});

