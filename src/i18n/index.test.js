/**
 * Tests for the i18n translation layer.
 * - translate() fallback chain (lang → ja → key)
 * - variable interpolation ({name} etc.)
 * - ja/en key parity (every key exists in both tables)
 * - no empty values
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { translate } from './index.js';
import { translations } from './translations.js';

describe('translate() fallback chain', () => {
  it('returns the value for an existing key in the requested language', () => {
    assert.strictEqual(translate('en', 'common.close'), translations.en['common.close']);
    assert.strictEqual(translate('ja', 'common.close'), translations.ja['common.close']);
  });

  it('falls back to Japanese when the key is missing in the requested language', () => {
    // Inject a ja-only key just for this assertion via a known existing ja key.
    // 'app.name' exists in both, so instead verify the documented behavior:
    // an unknown lang resolves through the ja table.
    assert.strictEqual(translate('xx', 'common.close'), translations.ja['common.close']);
  });

  it('falls back to the key itself when missing in both tables', () => {
    assert.strictEqual(translate('en', '__does_not_exist__'), '__does_not_exist__');
    assert.strictEqual(translate('ja', '__does_not_exist__'), '__does_not_exist__');
  });
});

describe('translate() interpolation', () => {
  it('replaces a single named variable', () => {
    const out = translate('en', 'floating.summon.aria', { name: 'Joe' });
    assert.ok(out.includes('Joe'), 'should interpolate {name}');
    assert.ok(!out.includes('{name}'), 'should not leave the placeholder');
  });

  it('replaces multiple variables', () => {
    const out = translate('ja', 'agentbar.summon.aria', { name: 'レイ', role: '魂の託宣' });
    assert.ok(out.includes('レイ'));
    assert.ok(out.includes('魂の託宣'));
    assert.ok(!out.includes('{name}') && !out.includes('{role}'));
  });

  it('replaces every occurrence of the same variable (global)', () => {
    // translate uses a global regex, so a repeated placeholder is fully replaced.
    const table = translations.ja;
    const original = table['__test_dup__'];
    table['__test_dup__'] = '{x}-{x}';
    try {
      assert.strictEqual(translate('ja', '__test_dup__', { x: 'A' }), 'A-A');
    } finally {
      if (original === undefined) delete table['__test_dup__'];
      else table['__test_dup__'] = original;
    }
  });
});

describe('ja/en key parity', () => {
  it('every Japanese key has an English counterpart and vice versa', () => {
    const ja = Object.keys(translations.ja).sort();
    const en = Object.keys(translations.en).sort();
    const missingInEn = ja.filter((k) => !(k in translations.en));
    const missingInJa = en.filter((k) => !(k in translations.ja));
    assert.deepStrictEqual(missingInEn, [], `keys missing in en: ${missingInEn.join(', ')}`);
    assert.deepStrictEqual(missingInJa, [], `keys missing in ja: ${missingInJa.join(', ')}`);
    assert.strictEqual(ja.length, en.length);
  });
});

describe('translation values', () => {
  it('has no empty string values in either table', () => {
    for (const lang of ['ja', 'en']) {
      for (const [key, value] of Object.entries(translations[lang])) {
        assert.strictEqual(typeof value, 'string', `${lang}.${key} should be a string`);
        assert.ok(value.trim().length > 0, `${lang}.${key} should not be empty`);
      }
    }
  });
});
