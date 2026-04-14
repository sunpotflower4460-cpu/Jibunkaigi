import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAgentSystemPrompt } from './buildAgentPrompt.js';
import { buildBaselineSystemPrompt, buildBaselineUserPrompt } from './buildBaselinePrompt.js';

test('baseline prompt builder returns non-null for Joe', () => {
  const sys = buildBaselineSystemPrompt('creative', { userText: '動けない', mode: 'short' });
  const user = buildBaselineUserPrompt('creative', { userName: 'テスト', userText: '動けない' });

  assert.ok(sys);
  assert.ok(user);
  assert.match(sys, /ジョー/);
  assert.match(user, /テスト/);
});

test('baseline and current prompts are different routes', () => {
  const baseline = buildBaselineSystemPrompt('creative', { userText: '挑戦したい', mode: 'medium' });
  const current = buildAgentSystemPrompt('creative', {
    activated: {},
    context: '',
    mode: 'medium',
    userText: '挑戦したい',
    internalOS: null,
    surfaceFrame: null,
    stateGuide: '',
    internalFrame: '',
    surfaceGuidance: '',
  });

  assert.ok(baseline && current);
  assert.notEqual(baseline, current);
  assert.doesNotMatch(baseline, /internal/i);
  assert.doesNotMatch(baseline, /surface/i);
});
