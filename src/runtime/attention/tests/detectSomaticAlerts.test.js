/**
 * detectSomaticAlerts.test.js
 * Unit tests for somatic attention detection
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectSomaticAlerts } from '../detectSomaticAlerts.js';

describe('detectSomaticAlerts', () => {
  it('should return empty array for empty input', () => {
    const result = detectSomaticAlerts('');
    assert.deepEqual(result, []);
  });

  it('should detect fear patterns', () => {
    const result = detectSomaticAlerts('怖いけど、やってみたい');
    assert.ok(result.length > 0);
    const fearSignal = result.find(r => r.signal === 'fear-tremor');
    assert.ok(fearSignal);
    assert.ok(fearSignal.intensity > 0.6);
  });

  it('should detect contradiction patterns', () => {
    const result = detectSomaticAlerts('でも、本当は違う');
    assert.ok(result.length > 0);
    const contraSignal = result.find(r => r.signal === 'contradiction-pull');
    assert.ok(contraSignal);
  });

  it('should detect pain patterns', () => {
    const result = detectSomaticAlerts('辛くて、苦しい');
    assert.ok(result.length > 0);
    const painSignal = result.find(r => r.signal === 'pain-somatic');
    assert.ok(painSignal);
    assert.ok(painSignal.intensity > 0.7);
  });

  it('should detect multiple patterns in same input', () => {
    const result = detectSomaticAlerts('怖いけど、でもやりたい');
    assert.ok(result.length >= 2);
    const signals = result.map(r => r.signal);
    assert.ok(signals.includes('fear-tremor'));
    assert.ok(signals.includes('contradiction-pull'));
  });

  it('should detect body sensation patterns', () => {
    const result = detectSomaticAlerts('胸がざわざわする');
    assert.ok(result.length > 0);
    const bodySignal = result.find(r => r.signal === 'visceral-unease');
    assert.ok(bodySignal);
  });

  it('should detect desire patterns', () => {
    const result = detectSomaticAlerts('やりたい、欲しい');
    assert.ok(result.length > 0);
    const desireSignal = result.find(r => r.signal === 'desire-pull');
    assert.ok(desireSignal);
  });

  it('should detect resignation patterns', () => {
    const result = detectSomaticAlerts('もう無理だ');
    assert.ok(result.length > 0);
    const resignSignal = result.find(r => r.signal === 'resignation-drop');
    assert.ok(resignSignal);
    assert.ok(resignSignal.intensity > 0.7);
  });

  it('should detect hidden truth patterns', () => {
    const result = detectSomaticAlerts('本当はそうじゃない');
    assert.ok(result.length > 0);
    const truthSignal = result.find(r => r.signal === 'hidden-truth');
    assert.ok(truthSignal);
  });

  it('should handle complex input with multiple emotional states', () => {
    const input = '怖いけど、でもやりたい。本当は嬉しいのに、なんか辛い';
    const result = detectSomaticAlerts(input);
    assert.ok(result.length >= 3);
  });
});
