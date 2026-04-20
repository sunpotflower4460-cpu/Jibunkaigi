/**
 * detectSustainedGaze.test.js
 * Unit tests for sustained attention detection
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectSustainedGaze } from '../detectSustainedGaze.js';

describe('detectSustainedGaze', () => {
  it('should return empty array for empty context', () => {
    const result = detectSustainedGaze({});
    assert.deepEqual(result, []);
  });

  it('should detect high urgency from afterglow', () => {
    const context = {
      afterglowSeed: {
        field: { urgency: 0.7 }
      }
    };
    const result = detectSustainedGaze(context);
    assert.ok(result.length > 0);
    const urgencySignal = result.find(r => r.signal === 'sustained-urgency');
    assert.ok(urgencySignal);
  });

  it('should detect high fragility from afterglow', () => {
    const context = {
      afterglowSeed: {
        field: { fragility: 0.8 }
      }
    };
    const result = detectSustainedGaze(context);
    assert.ok(result.length > 0);
    const fragilitySignal = result.find(r => r.signal === 'sustained-fragility');
    assert.ok(fragilitySignal);
  });

  it('should detect unfinished threads from previousLatentState', () => {
    const context = {
      previousLatentState: {
        existence1: { unfinishedAllowed: 0.6 }
      }
    };
    const result = detectSustainedGaze(context);
    assert.ok(result.length > 0);
    const unfinishedSignal = result.find(r => r.signal === 'sustained-unfinished');
    assert.ok(unfinishedSignal);
  });

  it('should detect belief tensions from previousLatentState', () => {
    const context = {
      previousLatentState: {
        beliefTension: { totalTensionStrength: 0.7 }
      }
    };
    const result = detectSustainedGaze(context);
    assert.ok(result.length > 0);
    const tensionSignal = result.find(r => r.signal === 'sustained-tension');
    assert.ok(tensionSignal);
  });

  it('should combine signals from both sources', () => {
    const context = {
      afterglowSeed: {
        field: { urgency: 0.7, depth: 0.8 }
      },
      previousLatentState: {
        existence1: { unfinishedAllowed: 0.6 },
        beliefTension: { totalTensionStrength: 0.7 }
      }
    };
    const result = detectSustainedGaze(context);
    assert.ok(result.length >= 3);
  });

  it('should ignore low-intensity signals', () => {
    const context = {
      afterglowSeed: {
        field: { urgency: 0.3 }
      }
    };
    const result = detectSustainedGaze(context);
    assert.equal(result.length, 0);
  });
});
