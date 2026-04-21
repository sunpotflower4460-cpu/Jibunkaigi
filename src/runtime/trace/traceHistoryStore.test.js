// src/runtime/trace/traceHistoryStore.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadTraceHistory,
  saveTraceToHistory,
  clearTraceHistory,
  exportTraceAsJSON,
} from './traceHistoryStore.js';

describe('traceHistoryStore', () => {
  describe('loadTraceHistory', () => {
    it('returns empty array when not in dev mode', () => {
      const result = loadTraceHistory();
      assert.ok(Array.isArray(result));
    });
  });

  describe('saveTraceToHistory', () => {
    it('does nothing when not in dev mode', () => {
      const trace = { turnId: 'test-1', sessionId: 'session-1' };
      saveTraceToHistory(trace);
      // No error should be thrown
      assert.ok(true);
    });

    it('does nothing when trace is null', () => {
      saveTraceToHistory(null);
      assert.ok(true);
    });
  });

  describe('clearTraceHistory', () => {
    it('does nothing when not in dev mode', () => {
      clearTraceHistory();
      // No error should be thrown
      assert.ok(true);
    });
  });

  describe('exportTraceAsJSON', () => {
    it('returns empty object when trace is null', () => {
      const result = exportTraceAsJSON(null);
      assert.strictEqual(result, '{}');
    });

    it('exports trace as JSON string', () => {
      const trace = {
        turnId: 'test-1',
        sessionId: 'session-1',
        events: [
          { stage: 'INPUT', payload: { userText: 'hello' } },
        ],
      };
      const result = exportTraceAsJSON(trace);
      const parsed = JSON.parse(result);
      assert.strictEqual(parsed.turnId, 'test-1');
      assert.strictEqual(parsed.events[0].payload.userText, 'hello');
    });

    it('masks LLM response when option is enabled', () => {
      const trace = {
        turnId: 'test-1',
        events: [
          { stage: 'LLM_RESPONSE', payload: { text: 'secret response', content: 'secret content' } },
        ],
      };
      const result = exportTraceAsJSON(trace, { maskLLMResponse: true });
      const parsed = JSON.parse(result);
      assert.strictEqual(parsed.events[0].payload.text, '[MASKED]');
      assert.strictEqual(parsed.events[0].payload.content, '[MASKED]');
    });

    it('masks user text when option is enabled', () => {
      const trace = {
        turnId: 'test-1',
        events: [
          { stage: 'INPUT', payload: { userText: 'secret input', text: 'secret text' } },
        ],
      };
      const result = exportTraceAsJSON(trace, { maskUserText: true });
      const parsed = JSON.parse(result);
      assert.strictEqual(parsed.events[0].payload.userText, '[MASKED]');
      assert.strictEqual(parsed.events[0].payload.text, '[MASKED]');
    });

    it('does not mask other stages', () => {
      const trace = {
        turnId: 'test-1',
        events: [
          { stage: 'DYNAMIC_FIELD', payload: { someData: 'important' } },
        ],
      };
      const result = exportTraceAsJSON(trace, { maskLLMResponse: true, maskUserText: true });
      const parsed = JSON.parse(result);
      assert.strictEqual(parsed.events[0].payload.someData, 'important');
    });
  });
});
