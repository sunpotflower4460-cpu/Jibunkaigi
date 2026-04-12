// src/runtime/surfaceTranslator.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp01,
  pickDominantPatterns,
  summarizePermission,
  buildSurfaceFrame,
} from './surfaceTranslator.js';

describe('surfaceTranslator', () => {
  describe('clamp01', () => {
    it('should clamp values to 0-1 range', () => {
      assert.equal(clamp01(0.5), 0.5);
      assert.equal(clamp01(-0.5), 0);
      assert.equal(clamp01(1.5), 1);
      assert.equal(clamp01(0), 0);
      assert.equal(clamp01(1), 1);
    });
  });

  describe('pickDominantPatterns', () => {
    it('should pick top 2 patterns by weight', () => {
      const patternMix = {
        selected: [
          { id: 'pattern_a', weight: 0.5 },
          { id: 'pattern_b', weight: 0.3 },
          { id: 'pattern_c', weight: 0.2 },
        ],
      };

      const result = pickDominantPatterns(patternMix, 2);
      assert.equal(result.length, 2);
      assert.equal(result[0], 'pattern_a');
      assert.equal(result[1], 'pattern_b');
    });

    it('should return empty array for null input', () => {
      const result = pickDominantPatterns(null);
      assert.deepEqual(result, []);
    });

    it('should respect the limit parameter', () => {
      const patternMix = {
        selected: [
          { id: 'pattern_a', weight: 0.5 },
          { id: 'pattern_b', weight: 0.3 },
          { id: 'pattern_c', weight: 0.2 },
        ],
      };

      const result = pickDominantPatterns(patternMix, 1);
      assert.equal(result.length, 1);
      assert.equal(result[0], 'pattern_a');
    });
  });

  describe('summarizePermission', () => {
    it('should extract permission hints when values are >= 0.4', () => {
      const permission = {
        noHurry: 0.5,
        noOverExplain: 0.6,
        noPerformativeHelpfulness: 0.3,
        allowPartialUncertainty: 0.45,
      };

      const result = summarizePermission(permission);
      assert.ok(result.includes('do_not_rush'));
      assert.ok(result.includes('do_not_over_explain'));
      assert.equal(result.length, 2); // Limited to 2
    });

    it('should return empty array when no permissions are active', () => {
      const permission = {
        noHurry: 0.2,
        noOverExplain: 0.1,
      };

      const result = summarizePermission(permission);
      assert.deepEqual(result, []);
    });
  });

  describe('buildSurfaceFrame', () => {
    it('should return a serializable plain object', () => {
      const latentState = {
        field: { softness: 0.6, depth: 0.5, urgency: 0.2, fragility: 0.3 },
        stance: { receive: 0.7, illuminate: 0.3 },
        reaction: { touched: 0.5, protect: 0.4 },
        permission: { noHurry: 0.5 },
      };

      const patternMix = {
        selected: [
          { id: 'comfort_soft', weight: 0.6 },
          { id: 'truth_gentle', weight: 0.4 },
        ],
      };

      const result = buildSurfaceFrame({
        latentState,
        patternMix,
        surfaceWindow: [],
        afterglowSeed: null,
        agentId: 'creative',
        isMirror: false,
      });

      // Should be JSON-serializable
      const serialized = JSON.stringify(result);
      const deserialized = JSON.parse(serialized);
      assert.deepEqual(result, deserialized);

      // Should have required keys
      assert.ok('toneBias' in result);
      assert.ok('pacing' in result);
      assert.ok('directness' in result);
      assert.ok('emotionalTemperature' in result);
      assert.ok('dominantPatterns' in result);
      assert.ok('permissionHints' in result);
      assert.ok('fieldHint' in result);
      assert.ok('surfaceHint' in result);
      assert.ok('afterglowHint' in result);
      assert.ok('mirrorMode' in result);
    });

    it('should limit dominantPatterns to 2 items', () => {
      const patternMix = {
        selected: [
          { id: 'pattern_a', weight: 0.5 },
          { id: 'pattern_b', weight: 0.3 },
          { id: 'pattern_c', weight: 0.2 },
        ],
      };

      const result = buildSurfaceFrame({
        latentState: {},
        patternMix,
        surfaceWindow: [],
        afterglowSeed: null,
        agentId: 'creative',
      });

      assert.ok(result.dominantPatterns.length <= 2);
    });

    it('should limit permissionHints to 2 items', () => {
      const latentState = {
        permission: {
          noHurry: 0.5,
          noOverExplain: 0.6,
          noPerformativeHelpfulness: 0.7,
          allowPartialUncertainty: 0.8,
        },
      };

      const result = buildSurfaceFrame({
        latentState,
        patternMix: null,
        surfaceWindow: [],
        afterglowSeed: null,
        agentId: 'creative',
      });

      assert.ok(result.permissionHints.length <= 2);
    });

    it('should not crash when afterglowSeed is null', () => {
      const result = buildSurfaceFrame({
        latentState: {},
        patternMix: null,
        surfaceWindow: [],
        afterglowSeed: null,
        agentId: 'creative',
      });

      assert.ok(result);
      assert.equal(result.afterglowHint, 'no_continuity');
    });

    it('should set mirrorMode to true when isMirror is true', () => {
      const result = buildSurfaceFrame({
        latentState: {},
        patternMix: null,
        surfaceWindow: [],
        afterglowSeed: null,
        agentId: 'master',
        isMirror: true,
      });

      assert.equal(result.mirrorMode, true);
    });

    it('should not produce long strings', () => {
      const latentState = {
        field: { softness: 0.8, depth: 0.7, urgency: 0.6, fragility: 0.7 },
        stance: { receive: 0.9, illuminate: 0.8, structure: 0.7 },
        reaction: { touched: 0.9, protect: 0.8, curiosity: 0.7 },
        permission: {
          noHurry: 0.9,
          noOverExplain: 0.9,
          noPerformativeHelpfulness: 0.9,
          allowPartialUncertainty: 0.9,
        },
      };

      const result = buildSurfaceFrame({
        latentState,
        patternMix: null,
        surfaceWindow: [],
        afterglowSeed: null,
        agentId: 'creative',
      });

      // String fields should be reasonably short
      assert.ok(result.pacing.length < 50);
      assert.ok(result.directness.length < 50);
      assert.ok(result.emotionalTemperature.length < 50);
      assert.ok(result.fieldHint.length < 50);
      assert.ok(result.surfaceHint.length < 100);
      assert.ok(result.afterglowHint.length < 100);
    });

    it('should adjust directness and pacing for mirror mode', () => {
      const latentState = {
        field: { urgency: 0.8 },
        stance: { illuminate: 0.9, structure: 0.8 },
      };

      const normalResult = buildSurfaceFrame({
        latentState,
        patternMix: null,
        surfaceWindow: [],
        afterglowSeed: null,
        agentId: 'creative',
        isMirror: false,
      });

      const mirrorResult = buildSurfaceFrame({
        latentState,
        patternMix: null,
        surfaceWindow: [],
        afterglowSeed: null,
        agentId: 'master',
        isMirror: true,
      });

      // Mirror mode should soften directness and slow pacing
      assert.notEqual(normalResult.directness, mirrorResult.directness);
    });
  });
});
