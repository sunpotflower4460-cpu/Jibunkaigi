// src/runtime/trace/agentTraceBuilder.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createTrace, TraceStage, convertDebugInfoToTraceEvents } from './agentTraceBuilder.js';

describe('agentTraceBuilder', () => {
  it('creates trace with sessionId, agentId, turnId', () => {
    const trace = createTrace('session-1', 'creative', 'turn-1');
    assert.strictEqual(trace.sessionId, 'session-1');
    assert.strictEqual(trace.agentId, 'creative');
    assert.strictEqual(trace.turnId, 'turn-1');
    assert.strictEqual(trace.finalized, false);
    assert.ok(Array.isArray(trace.events));
    assert.strictEqual(trace.events.length, 0);
  });

  it('pushes events with stage and payload', () => {
    const trace = createTrace('session-1', 'creative', 'turn-1');
    trace.push(TraceStage.INPUT, { text: 'hello' });
    trace.push(TraceStage.MICRO_SIGNAL, { signals: {} });

    assert.strictEqual(trace.events.length, 2);
    assert.strictEqual(trace.events[0].stage, TraceStage.INPUT);
    assert.deepStrictEqual(trace.events[0].payload, { text: 'hello' });
    assert.strictEqual(trace.events[1].stage, TraceStage.MICRO_SIGNAL);
  });

  it('finalizes trace and freezes it', () => {
    const trace = createTrace('session-1', 'creative', 'turn-1');
    trace.push(TraceStage.INPUT, { text: 'hello' });

    const finalized = trace.finalize();

    assert.strictEqual(finalized.finalized, true);
    assert.ok(finalized.endTime);
    assert.ok(finalized.duration >= 0);
    assert.ok(Object.isFrozen(finalized));
    assert.ok(Object.isFrozen(finalized.events));
  });

  it('prevents push after finalize', () => {
    const trace = createTrace('session-1', 'creative', 'turn-1');
    trace.push(TraceStage.INPUT, { text: 'hello' });
    trace.finalize();

    trace.push(TraceStage.MICRO_SIGNAL, { signals: {} });

    // Should still have only 1 event
    assert.strictEqual(trace.events.length, 1);
  });

  it('converts debugInfo to trace events', () => {
    const debugInfo = {
      microSignals: { signal1: 0.5 },
      makerSeedActive: true,
      homeLayerActive: true,
      preconditionFilterPreview: { filter: 'data' },
      preconditionBiasPreview: { bias: 'data' },
    };

    const events = convertDebugInfoToTraceEvents(debugInfo);

    assert.ok(events.length >= 5);
    assert.ok(events.some(e => e.stage === TraceStage.MICRO_SIGNAL));
    assert.ok(events.some(e => e.stage === TraceStage.LATENT_MAKER_SEED));
    assert.ok(events.some(e => e.stage === TraceStage.LATENT_HOME));
    assert.ok(events.some(e => e.stage === TraceStage.PRECONDITION_FILTER));
    assert.ok(events.some(e => e.stage === TraceStage.PRECONDITION_BIAS));
  });

  it('handles empty debugInfo gracefully', () => {
    const events = convertDebugInfoToTraceEvents(null);
    assert.strictEqual(events.length, 0);

    const events2 = convertDebugInfoToTraceEvents({});
    assert.strictEqual(events2.length, 0);
  });
});
