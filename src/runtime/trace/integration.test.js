// src/runtime/trace/integration.test.js
// Integration test to verify trace flows through runInternalOS

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createTrace, TraceStage } from './agentTraceBuilder.js';
import { runInternalOS } from '../runInternalOS.js';

describe('trace integration with runInternalOS', () => {
  it('captures events when trace is passed to runInternalOS', () => {
    const trace = createTrace('test-session', 'creative', 'test-turn');

    const result = runInternalOS('こんにちは', {
      agentId: 'creative',
      lengthPreference: 'medium',
      trace,
    });

    // Verify runInternalOS completed successfully
    assert.ok(result);
    assert.ok(result.latentState);
    assert.ok(result.surfaceWindow);
    assert.ok(result.patternMix);

    // Verify trace captured events
    assert.ok(trace.events.length > 0, 'trace should have captured events');

    // Verify key stages were captured
    const stages = trace.events.map(e => e.stage);
    assert.ok(stages.includes(TraceStage.INPUT), 'should capture INPUT stage');
    assert.ok(stages.includes(TraceStage.MICRO_SIGNAL), 'should capture MICRO_SIGNAL stage');
    assert.ok(stages.includes(TraceStage.LATENT_MAKER_SEED), 'should capture LATENT_MAKER_SEED stage');
    assert.ok(stages.includes(TraceStage.LATENT_HOME), 'should capture LATENT_HOME stage');
    assert.ok(stages.includes(TraceStage.DYNAMIC_FIELD), 'should capture DYNAMIC_FIELD stage');
    assert.ok(stages.includes(TraceStage.DECISION), 'should capture DECISION stage');
    assert.ok(stages.includes(TraceStage.RESIDUE), 'should capture RESIDUE stage');

    console.log(`Captured ${trace.events.length} trace events`);
  });

  it('runInternalOS works without trace (backward compatibility)', () => {
    const result = runInternalOS('こんにちは', {
      agentId: 'creative',
      lengthPreference: 'medium',
      // trace not provided - should work fine
    });

    // Verify runInternalOS completed successfully
    assert.ok(result);
    assert.ok(result.latentState);
    assert.ok(result.surfaceWindow);
    assert.ok(result.patternMix);
    assert.ok(result.debugInfo);
  });

  it('trace can be finalized after runInternalOS', () => {
    const trace = createTrace('test-session', 'creative', 'test-turn');

    runInternalOS('テスト', {
      agentId: 'creative',
      trace,
    });

    const finalized = trace.finalize();

    assert.ok(finalized.finalized);
    assert.ok(finalized.endTime);
    assert.ok(finalized.duration >= 0);
    assert.ok(Object.isFrozen(finalized));
    assert.ok(Object.isFrozen(finalized.events));
  });

  it('captures at least 15 stages for a full runInternalOS', () => {
    const trace = createTrace('test-session', 'creative', 'test-turn');

    runInternalOS('これはテストです', {
      agentId: 'creative',
      lengthPreference: 'medium',
      trace,
    });

    // Should capture many stages (INPUT, MICRO_SIGNAL, latent layers, dynamic layers, etc.)
    assert.ok(
      trace.events.length >= 15,
      `Expected at least 15 trace events, got ${trace.events.length}`
    );
  });
});
