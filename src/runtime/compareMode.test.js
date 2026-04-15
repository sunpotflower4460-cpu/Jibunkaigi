import test from 'node:test';
import assert from 'node:assert/strict';

import { readCompareModeFlag, shouldShowComparePanel } from './compareMode.js';

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
