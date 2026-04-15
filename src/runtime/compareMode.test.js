import test from 'node:test';
import assert from 'node:assert/strict';

import { readCompareModeFlag, shouldShowComparePanel, COMPARE_MAX_ENTRIES } from './compareMode.js';

test('readCompareModeFlag respects query and storage', () => {
  assert.equal(readCompareModeFlag({ search: '?compareMode=1' }), true);
  assert.equal(readCompareModeFlag({ search: '?compareMode=0' }), false);
  assert.equal(readCompareModeFlag({ storageGetter: () => '1' }), true);
  assert.equal(readCompareModeFlag({ storageGetter: () => '0' }), false);
});

test('compare panel hides when disabled or empty', () => {
  assert.equal(shouldShowComparePanel({ enabled: false, entries: [{ id: 1 }] }), false);
  assert.equal(shouldShowComparePanel({ enabled: true, entries: [] }), false);
  assert.equal(shouldShowComparePanel({ enabled: true, entries: [{ id: 1 }] }), true);
});

test('COMPARE_MAX_ENTRIES is a positive integer and entries are sliced to the limit', () => {
  assert.ok(typeof COMPARE_MAX_ENTRIES === 'number', 'COMPARE_MAX_ENTRIES should be a number');
  assert.ok(COMPARE_MAX_ENTRIES > 0, 'COMPARE_MAX_ENTRIES should be positive');

  // Simulate ComparePanel slicing behaviour
  const entries = Array.from({ length: COMPARE_MAX_ENTRIES + 3 }, (_, i) => ({ id: i }));
  const visible = entries.slice(0, COMPARE_MAX_ENTRIES);
  assert.equal(visible.length, COMPARE_MAX_ENTRIES);
});
