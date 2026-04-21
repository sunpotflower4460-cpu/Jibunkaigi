// src/runtime/agentIdentity.test.js
// Phase 1 (修正指示書 v3): agentId canonicalization

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  UI_TO_CANONICAL_AGENT_ID,
  CANONICAL_TO_UI_AGENT_ID,
  CANONICAL_AGENT_IDS,
  normalizeAgentId,
  toCanonicalAgentId,
  toUiAgentId,
  isCanonicalAgentId,
} from './agentIdentity.js';

test('UI -> canonical 変換表は指示書通りの 6 対応を持つ', () => {
  assert.equal(UI_TO_CANONICAL_AGENT_ID.creative, 'joe');
  assert.equal(UI_TO_CANONICAL_AGENT_ID.soul, 'ray');
  assert.equal(UI_TO_CANONICAL_AGENT_ID.strategist, 'ken');
  assert.equal(UI_TO_CANONICAL_AGENT_ID.empath, 'mina');
  assert.equal(UI_TO_CANONICAL_AGENT_ID.critic, 'satou');
  assert.equal(UI_TO_CANONICAL_AGENT_ID.master, 'mirror');
});

test('canonical -> UI 変換表は逆写像である', () => {
  for (const [ui, canonical] of Object.entries(UI_TO_CANONICAL_AGENT_ID)) {
    assert.equal(CANONICAL_TO_UI_AGENT_ID[canonical], ui);
  }
});

test('toCanonicalAgentId は UI id を canonical に正規化する', () => {
  assert.equal(toCanonicalAgentId('creative'), 'joe');
  assert.equal(toCanonicalAgentId('soul'), 'ray');
  assert.equal(toCanonicalAgentId('strategist'), 'ken');
  assert.equal(toCanonicalAgentId('empath'), 'mina');
  assert.equal(toCanonicalAgentId('critic'), 'satou');
  assert.equal(toCanonicalAgentId('master'), 'mirror');
});

test('toCanonicalAgentId は canonical id をそのまま返す', () => {
  for (const id of CANONICAL_AGENT_IDS) {
    assert.equal(toCanonicalAgentId(id), id);
  }
});

test('toCanonicalAgentId は大小・前後空白を吸収する', () => {
  assert.equal(toCanonicalAgentId('  CREATIVE '), 'joe');
  assert.equal(toCanonicalAgentId('Soul'), 'ray');
});

test('toCanonicalAgentId は未知 id を正規化形で返す', () => {
  assert.equal(toCanonicalAgentId('unknown-x'), 'unknown-x');
  assert.equal(toCanonicalAgentId(null), '');
  assert.equal(toCanonicalAgentId(undefined), '');
});

test('toUiAgentId は canonical id を UI id に戻す', () => {
  assert.equal(toUiAgentId('joe'), 'creative');
  assert.equal(toUiAgentId('ray'), 'soul');
  assert.equal(toUiAgentId('ken'), 'strategist');
  assert.equal(toUiAgentId('mina'), 'empath');
  assert.equal(toUiAgentId('satou'), 'critic');
  assert.equal(toUiAgentId('mirror'), 'master');
});

test('isCanonicalAgentId は canonical のみ true を返す', () => {
  for (const id of CANONICAL_AGENT_IDS) {
    assert.equal(isCanonicalAgentId(id), true);
  }
  assert.equal(isCanonicalAgentId('creative'), false);
  assert.equal(isCanonicalAgentId('master'), false);
  assert.equal(isCanonicalAgentId(''), false);
});

test('normalizeAgentId は lowercase + trim する', () => {
  assert.equal(normalizeAgentId(' CREATIVE '), 'creative');
  assert.equal(normalizeAgentId(null), '');
});
