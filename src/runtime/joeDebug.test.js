import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getJoeDebugRuntimeFlags,
  isJoeDebugAvailable,
  isJoeDebugEnabled,
  setJoeDebugEnabled,
} from './joeDebug.js';

test('isJoeDebugAvailable respects explicit dev flag', () => {
  assert.equal(isJoeDebugAvailable({ dev: true }), true);
  assert.equal(isJoeDebugAvailable({ dev: false }), false);
});

test('isJoeDebugEnabled ignores query and storage when dev is false', () => {
  assert.equal(
    isJoeDebugEnabled({
      dev: false,
      hasWindow: true,
      search: '?joeDebug=1',
      storageGetter: () => '1',
    }),
    false,
  );
});

test('isJoeDebugEnabled allows query or storage only in dev with browser context', () => {
  assert.equal(
    isJoeDebugEnabled({
      dev: true,
      hasWindow: true,
      search: '?joeDebug=1',
      storageGetter: () => '0',
    }),
    true,
  );

  assert.equal(
    isJoeDebugEnabled({
      dev: true,
      hasWindow: true,
      search: '?joeDebug=0',
      storageGetter: () => '1',
    }),
    true,
  );

  assert.equal(
    isJoeDebugEnabled({
      dev: true,
      hasWindow: false,
      search: '?joeDebug=1',
      storageGetter: () => '1',
    }),
    false,
  );
});

test('setJoeDebugEnabled is a no-op when dev is false', () => {
  let setCount = 0;
  let removeCount = 0;

  setJoeDebugEnabled(true, {
    dev: false,
    hasWindow: true,
    storageSetter: () => { setCount += 1; },
    storageRemover: () => { removeCount += 1; },
  });
  setJoeDebugEnabled(false, {
    dev: false,
    hasWindow: true,
    storageSetter: () => { setCount += 1; },
    storageRemover: () => { removeCount += 1; },
  });

  assert.equal(setCount, 0);
  assert.equal(removeCount, 0);
});

test('getJoeDebugRuntimeFlags centralizes dev-only capture flags', () => {
  const flags = getJoeDebugRuntimeFlags({
    dev: true,
    hasWindow: true,
    search: '?joeDebug=1',
    storageGetter: () => '0',
    joePanelVisible: true,
    surfacePreviewEnabled: true,
  });

  assert.equal(flags.available, true);
  assert.equal(flags.joePanelEnabled, true);
  assert.equal(flags.joePanelVisible, true);
  assert.equal(flags.surfacePreviewEnabled, true);
  assert.equal(flags.shouldAttachBrowserControls, true);
  assert.equal(flags.shouldBuildJoeDebugEntry, true);
  assert.equal(flags.shouldBuildAgentDebugPreview, true);
  assert.equal(flags.shouldRenderJoeDebugPanel, true);
});

test('getJoeDebugRuntimeFlags disables all capture flags outside dev', () => {
  const flags = getJoeDebugRuntimeFlags({
    dev: false,
    hasWindow: true,
    search: '?joeDebug=1',
    storageGetter: () => '1',
    joePanelVisible: true,
    surfacePreviewEnabled: true,
  });

  assert.equal(flags.available, false);
  assert.equal(flags.joePanelEnabled, false);
  assert.equal(flags.joePanelVisible, false);
  assert.equal(flags.surfacePreviewEnabled, false);
  assert.equal(flags.shouldBuildJoeDebugEntry, false);
  assert.equal(flags.shouldBuildAgentDebugPreview, false);
  assert.equal(flags.shouldRenderJoeDebugPanel, false);
});
