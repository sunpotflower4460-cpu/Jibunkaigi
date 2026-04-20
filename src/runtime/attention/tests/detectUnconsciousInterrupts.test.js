/**
 * detectUnconsciousInterrupts.test.js
 * Unit tests for unconscious interrupt detection
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectUnconsciousInterrupts } from '../detectUnconsciousInterrupts.js';

describe('detectUnconsciousInterrupts', () => {
  it('should return empty array for empty context', () => {
    const result = detectUnconsciousInterrupts({});
    assert.deepEqual(result, []);
  });

  it('should detect interrupts from active tensions', () => {
    const context = {
      beliefTension: {
        activeTensions: [
          { axis: 'illumination', strength: 0.7 }
        ]
      }
    };
    const result = detectUnconsciousInterrupts(context);
    assert.ok(result.length > 0);
    const interruptSignal = result.find(r => r.signal === 'interrupt-need-clarity');
    assert.ok(interruptSignal);
    assert.ok(interruptSignal.intensity > 0);
  });

  it('should ignore low-strength tensions', () => {
    const context = {
      beliefTension: {
        activeTensions: [
          { axis: 'illumination', strength: 0.3 }
        ]
      }
    };
    const result = detectUnconsciousInterrupts(context);
    assert.equal(result.length, 0);
  });

  it('should detect multiple interrupts', () => {
    const context = {
      beliefTension: {
        activeTensions: [
          { axis: 'illumination', strength: 0.7 },
          { axis: 'structure', strength: 0.6 },
          { axis: 'presence', strength: 0.5 }
        ]
      }
    };
    const result = detectUnconsciousInterrupts(context);
    assert.ok(result.length >= 3);
  });

  it('should map belief axes to interrupt signals correctly', () => {
    const axes = [
      { axis: 'illumination', expectedSignal: 'interrupt-need-clarity' },
      { axis: 'structure', expectedSignal: 'interrupt-need-framework' },
      { axis: 'holding', expectedSignal: 'interrupt-need-containment' },
      { axis: 'presence', expectedSignal: 'interrupt-need-witness' },
      { axis: 'grounding', expectedSignal: 'interrupt-need-anchor' },
    ];

    axes.forEach(({ axis, expectedSignal }) => {
      const context = {
        beliefTension: {
          activeTensions: [{ axis, strength: 0.7 }]
        }
      };
      const result = detectUnconsciousInterrupts(context);
      assert.ok(result.length > 0);
      const signal = result.find(r => r.signal === expectedSignal);
      assert.ok(signal, `Expected signal ${expectedSignal} for axis ${axis}`);
    });
  });
});
