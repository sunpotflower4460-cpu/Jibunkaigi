import test from 'node:test';
import assert from 'node:assert/strict';

import {
  INSPECTOR_STORAGE_KEY,
  isInspectorEnabled,
  setInspectorEnabled,
} from './inspectorDebug.js';

test('isInspectorEnabled respects query and storage', () => {
  assert.equal(
    isInspectorEnabled({
      hasWindow: true,
      search: '?inspector=1',
      storageGetter: () => '0',
    }),
    true,
  );

  assert.equal(
    isInspectorEnabled({
      hasWindow: true,
      search: '?inspector=0',
      storageGetter: () => '1',
    }),
    true,
  );

  assert.equal(
    isInspectorEnabled({
      hasWindow: true,
      search: '',
      storageGetter: () => 'true',
    }),
    true,
  );

  assert.equal(
    isInspectorEnabled({
      hasWindow: true,
      search: '',
      storageGetter: () => null,
    }),
    false,
  );
});

test('isInspectorEnabled disables outside browser context and survives storage failures', () => {
  assert.equal(
    isInspectorEnabled({
      hasWindow: false,
      search: '?inspector=1',
      storageGetter: () => '1',
    }),
    false,
  );

  assert.equal(
    isInspectorEnabled({
      hasWindow: true,
      search: '',
      storageGetter: () => {
        throw new Error('storage error');
      },
    }),
    false,
  );
});

test('setInspectorEnabled writes and removes the expected storage key', () => {
  let lastSet = null;
  let removedKey = null;

  setInspectorEnabled(true, {
    hasWindow: true,
    storageSetter: (value) => {
      lastSet = value;
    },
    storageRemover: () => {
      removedKey = INSPECTOR_STORAGE_KEY;
    },
  });

  setInspectorEnabled(false, {
    hasWindow: true,
    storageSetter: (value) => {
      lastSet = value;
    },
    storageRemover: () => {
      removedKey = INSPECTOR_STORAGE_KEY;
    },
  });

  assert.equal(lastSet, '1');
  assert.equal(removedKey, INSPECTOR_STORAGE_KEY);
});
