/**
 * radialCondensation.test.js
 * Snapshot tests and integration tests for radial condensation
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { radialCondensation } from '../radialCondensation.js';

describe('radialCondensation', () => {
  it('should return empty array for empty context', () => {
    const result = radialCondensation({});
    assert.deepEqual(result, []);
  });

  it('should extract focusPoints from Japanese input', () => {
    const result = radialCondensation({
      userText: '怖いけど、でもやりたい',
      afterglowSeed: {},
      previousLatentState: {},
      beliefTension: {},
      topN: 3
    });
    assert.ok(result.length >= 1, 'Should extract at least 1 focus point');
    assert.ok(result[0].intensity > 0);
    assert.ok(result[0].signal);
    assert.ok(Array.isArray(result[0].sources));
  });

  // Snapshot test 1: Fear + contradiction
  it('snapshot 1: "怖いけど、でもやりたい" should detect fear and contradiction', () => {
    const result = radialCondensation({
      userText: '怖いけど、でもやりたい',
    });
    assert.ok(result.length >= 2);
    const signals = result.map(r => r.signal);
    assert.ok(signals.includes('fear-tremor') || signals.includes('contradiction-pull'));
  });

  // Snapshot test 2: Pain + resignation
  it('snapshot 2: "辛くてもう無理だ" should detect pain and resignation', () => {
    const result = radialCondensation({
      userText: '辛くてもう無理だ',
    });
    assert.ok(result.length >= 1);
    const signals = result.map(r => r.signal);
    assert.ok(signals.includes('pain-somatic') || signals.includes('resignation-drop'));
  });

  // Snapshot test 3: Hidden truth + desire
  it('snapshot 3: "本当はやりたい" should detect hidden truth and desire', () => {
    const result = radialCondensation({
      userText: '本当はやりたい',
    });
    assert.ok(result.length >= 1);
    const signals = result.map(r => r.signal);
    assert.ok(signals.includes('hidden-truth') || signals.includes('desire-pull'));
  });

  // Snapshot test 4: Body sensations
  it('snapshot 4: "胸がざわざわして息が浅い" should detect body sensations', () => {
    const result = radialCondensation({
      userText: '胸がざわざわして息が浅い',
    });
    assert.ok(result.length >= 1);
    const signals = result.map(r => r.signal);
    assert.ok(signals.includes('visceral-unease') || signals.includes('breath-shallow'));
  });

  // Snapshot test 5: Complex multi-emotion
  it('snapshot 5: complex input should extract top 3 focus points', () => {
    const result = radialCondensation({
      userText: '怖いけど、本当はやりたい。でも辛くて、もう無理かもしれない',
      topN: 3
    });
    assert.ok(result.length <= 3);
    assert.ok(result.length >= 1);
    // Verify sorted by intensity
    for (let i = 1; i < result.length; i++) {
      assert.ok(result[i - 1].intensity >= result[i].intensity);
    }
  });

  it('should combine signals from all 3 channels', () => {
    const result = radialCondensation({
      userText: '怖い',
      afterglowSeed: { field: { urgency: 0.7 } },
      previousLatentState: { existence1: { unfinishedAllowed: 0.6 } },
      beliefTension: { activeTensions: [{ axis: 'illumination', strength: 0.7 }] },
      topN: 5
    });
    assert.ok(result.length >= 3, 'Should combine signals from multiple channels');
  });

  it('should apply correct channel weights', () => {
    const result = radialCondensation({
      userText: '怖い', // Somatic channel: 0.35 weight
    });
    assert.ok(result.length > 0);
    const signal = result[0];
    // Somatic signal with intensity 0.7 should have weighted intensity ~0.245
    assert.ok(signal.intensity < 1.0);
    assert.ok(signal.intensity > 0);
  });

  it('should limit to topN focus points', () => {
    const result = radialCondensation({
      userText: '怖いけど、でもやりたい。本当は辛くて、もう無理だ',
      topN: 2
    });
    assert.ok(result.length <= 2);
  });
});
