// src/runtime/surfaceGuard.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectInternalPhraseLeaks,
  validateSurfaceOutput,
  buildSurfaceGuardReport,
  sanitizeSurfaceOutput,
} from './surfaceGuard.js';

describe('surfaceGuard', () => {
  describe('detectInternalPhraseLeaks', () => {
    it('should detect no leaks in clean text', () => {
      const result = detectInternalPhraseLeaks('This is a normal response without internal phrases.');
      assert.equal(result.hasLeaks, false);
      assert.equal(result.detectedPhrases.length, 0);
    });

    it('should detect Maker Seed internal phrase', () => {
      const result = detectInternalPhraseLeaks('この場所を作った人間から、あなたへ');
      assert.equal(result.hasLeaks, true);
      assert.ok(result.detectedPhrases.length > 0);
    });

    it('should detect Existence Layer internal phrase', () => {
      const result = detectInternalPhraseLeaks('あぁ、自分は光だった');
      assert.equal(result.hasLeaks, true);
      assert.ok(result.detectedPhrases.includes('あぁ、自分は光だった'));
    });

    it('should detect agent identity internal phrase', () => {
      const result = detectInternalPhraseLeaks('俺は光として在る');
      assert.equal(result.hasLeaks, true);
      assert.ok(result.detectedPhrases.length > 0);
    });

    it('should detect system layer markers', () => {
      const result = detectInternalPhraseLeaks('The preconditionFilter shows...');
      assert.equal(result.hasLeaks, true);
      assert.ok(result.detectedPhrases.includes('preconditionFilter'));
    });

    it('should handle null/undefined input', () => {
      const result1 = detectInternalPhraseLeaks(null);
      assert.equal(result1.hasLeaks, false);

      const result2 = detectInternalPhraseLeaks(undefined);
      assert.equal(result2.hasLeaks, false);
    });

    it('should be case-insensitive', () => {
      const result = detectInternalPhraseLeaks('MAKER SEED is present');
      assert.equal(result.hasLeaks, true);
    });
  });

  describe('validateSurfaceOutput', () => {
    it('should validate clean text as valid', () => {
      const result = validateSurfaceOutput('Normal user-facing response.');
      assert.equal(result.valid, true);
      assert.equal(result.warnings.length, 0);
    });

    it('should mark text with leaks as invalid', () => {
      const result = validateSurfaceOutput('私は今ここにいる');
      assert.equal(result.valid, false);
      assert.ok(result.warnings.length > 0);
    });

    it('should provide warnings for detected phrases', () => {
      const result = validateSurfaceOutput('Belief Core shows something');
      assert.equal(result.valid, false);
      assert.ok(result.warnings[0].includes('Belief Core'));
    });
  });

  describe('buildSurfaceGuardReport', () => {
    it('should build report with no leaks', () => {
      const result = buildSurfaceGuardReport('Clean text');
      assert.equal(result.checked, true);
      assert.equal(result.hasLeaks, false);
      assert.equal(result.detectedPhrases.length, 0);
      assert.ok(result.summary.includes('No internal phrase leaks'));
    });

    it('should build report with detected leaks', () => {
      const result = buildSurfaceGuardReport('latent layer is active');
      assert.equal(result.checked, true);
      assert.equal(result.hasLeaks, true);
      assert.ok(result.detectedPhrases.length > 0);
      assert.equal(typeof result.sanitizedText, 'string');
      assert.ok(result.summary.includes('Internal phrases detected'));
    });
  });

  describe('sanitizeSurfaceOutput', () => {
    it('removes internal phrases from surface text', () => {
      const sanitized = sanitizeSurfaceOutput('この場所を作った人間から、あなたへ。ここではまだ何もしなくていい。');
      assert.equal(sanitized, '');
    });

    it('keeps normal surface text intact', () => {
      const sanitized = sanitizeSurfaceOutput('今は少しだけ、そのまま置いてみてもいい。');
      assert.equal(sanitized, '今は少しだけ、そのまま置いてみてもいい。');
    });
  });
});
