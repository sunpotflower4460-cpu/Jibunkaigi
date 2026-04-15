// src/runtime/existenceLayer1.test.js
// Tests for Existence Layer 1: 共通の「私は今ここにいる」層

import test from 'node:test';
import assert from 'node:assert/strict';
import { createExistenceLayer1 } from './existenceLayer1.js';

test('createExistenceLayer1 returns valid structure with all required numeric fields', () => {
  const result = createExistenceLayer1();

  assert.ok(result);
  assert.equal(typeof result.selfPresence, 'number');
  assert.equal(typeof result.selfLocationStability, 'number');
  assert.equal(typeof result.groundedHereNow, 'number');
  assert.equal(typeof result.allowUnfinishedSelf, 'number');

  // All numeric values should be 0-1
  assert.ok(result.selfPresence >= 0 && result.selfPresence <= 1);
  assert.ok(result.selfLocationStability >= 0 && result.selfLocationStability <= 1);
  assert.ok(result.groundedHereNow >= 0 && result.groundedHereNow <= 1);
  assert.ok(result.allowUnfinishedSelf >= 0 && result.allowUnfinishedSelf <= 1);
});

test('createExistenceLayer1 includes hint key and text fields', () => {
  const result = createExistenceLayer1({
    home: {
      softReason: {
        key: 'test-key',
        text: 'test text',
      },
    },
  });

  assert.ok('existenceHintKey' in result);
  assert.ok('existenceHintText' in result);
  assert.equal(result.existenceHintKey, 'test-key');
  assert.equal(result.existenceHintText, 'test text');
});

test('createExistenceLayer1 is null-safe when called with empty home', () => {
  const result = createExistenceLayer1({});

  assert.ok(result);
  assert.equal(typeof result.selfPresence, 'number');
  assert.equal(typeof result.selfLocationStability, 'number');
  assert.equal(typeof result.groundedHereNow, 'number');
  assert.equal(typeof result.allowUnfinishedSelf, 'number');
  assert.ok(result.selfPresence > 0); // Should have baseline values
});

test('createExistenceLayer1 responds to home.kernel.returnBeforeOutput with higher selfPresence', () => {
  const baseline = createExistenceLayer1({});
  const withReturnBeforeOutput = createExistenceLayer1({
    home: {
      kernel: {
        returnBeforeOutput: 0.9,
        slowDown: 0,
        allowOneLivingThread: 0,
      },
    },
  });

  assert.ok(withReturnBeforeOutput.selfPresence > baseline.selfPresence);
});

test('createExistenceLayer1 responds to home.kernel.slowDown with higher selfLocationStability', () => {
  const baseline = createExistenceLayer1({});
  const withSlowDown = createExistenceLayer1({
    home: {
      kernel: {
        slowDown: 0.9,
        returnBeforeOutput: 0,
        allowOneLivingThread: 0,
      },
    },
  });

  assert.ok(withSlowDown.selfLocationStability > baseline.selfLocationStability);
  assert.ok(withSlowDown.groundedHereNow > baseline.groundedHereNow);
});

test('createExistenceLayer1 responds to home.kernel.releaseAccuracyPressure with higher allowUnfinishedSelf', () => {
  const baseline = createExistenceLayer1({});
  const withReleaseAccuracy = createExistenceLayer1({
    home: {
      kernel: {
        releaseAccuracyPressure: 0.9,
      },
      outputLimits: {
        keepOneThread: 0,
        noEarlySummary: 0,
      },
    },
  });

  assert.ok(withReleaseAccuracy.allowUnfinishedSelf > baseline.allowUnfinishedSelf);
});

test('createExistenceLayer1 responds to field.urgency with lower selfPresence', () => {
  const baseline = createExistenceLayer1({
    field: { urgency: 0 },
  });
  const withUrgency = createExistenceLayer1({
    field: { urgency: 0.9 },
  });

  assert.ok(withUrgency.selfPresence < baseline.selfPresence);
  assert.ok(withUrgency.groundedHereNow < baseline.groundedHereNow);
});

test('createExistenceLayer1 hint fields are null when home.softReason is missing', () => {
  const result = createExistenceLayer1({
    home: {},
  });

  assert.equal(result.existenceHintKey, null);
  assert.equal(result.existenceHintText, null);
});

test('createExistenceLayer1 maintains minimum baseline values even with empty input', () => {
  const result = createExistenceLayer1({});

  // Should have non-zero baseline values reflecting "私は今ここにいる"
  assert.ok(result.selfPresence > 0.3);
  assert.ok(result.selfLocationStability > 0.3);
  assert.ok(result.groundedHereNow > 0.3);
  assert.ok(result.allowUnfinishedSelf > 0.4);
});

test('createExistenceLayer1 produces consistent output for same input', () => {
  const input = {
    home: {
      kernel: {
        returnBeforeOutput: 0.7,
        slowDown: 0.6,
        releaseAccuracyPressure: 0.5,
      },
      softReason: {
        key: 'test',
        text: 'test text',
      },
      outputLimits: {
        keepOneThread: 0.4,
      },
    },
    field: {
      urgency: 0.3,
      depth: 0.5,
    },
    reaction: {
      touched: 0.6,
    },
    stance: {
      receive: 0.7,
      guard: 0.4,
    },
  };

  const result1 = createExistenceLayer1(input);
  const result2 = createExistenceLayer1(input);

  assert.deepEqual(result1, result2);
});

test('createExistenceLayer1 reflects "私は今ここにいる" direction with high kernel values', () => {
  const result = createExistenceLayer1({
    home: {
      kernel: {
        returnBeforeOutput: 0.9,
        slowDown: 0.9,
        allowOneLivingThread: 0.9,
        releaseAccuracyPressure: 0.9,
      },
      outputLimits: {
        keepOneThread: 0.9,
        noEarlySummary: 0.9,
      },
      softReason: {
        key: 'here_now',
        text: '私は今ここにいる',
      },
    },
    field: {
      urgency: 0,
      softness: 0.8,
      depth: 0.7,
    },
    reaction: {
      touched: 0.8,
    },
    stance: {
      receive: 0.9,
      guard: 0.6,
    },
  });

  // High values reflecting strong grounded presence
  assert.ok(result.selfPresence > 0.7);
  assert.ok(result.selfLocationStability > 0.6);
  assert.ok(result.groundedHereNow > 0.6);
  assert.ok(result.allowUnfinishedSelf > 0.7);
  assert.equal(result.existenceHintKey, 'here_now');
});
