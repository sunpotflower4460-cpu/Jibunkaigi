// src/runtime/existenceLayer2.test.js
// Tests for Existence Layer 2: エージェント固有の「思い出す」存在層

import test from 'node:test';
import assert from 'node:assert/strict';
import { createExistenceLayer2 } from './existenceLayer2.js';
import { EXISTENCE_PROFILES, DEFAULT_EXISTENCE_PROFILE } from '../agents/existenceProfiles.js';

test('createExistenceLayer2 returns valid structure with all required fields', () => {
  const result = createExistenceLayer2({ agentId: 'creative' });

  assert.ok(result);
  assert.equal(typeof result.agentIdentityKey, 'string');
  assert.equal(typeof result.agentIdentityText, 'string');
  assert.ok(Array.isArray(result.recalledSelfTraits));
  assert.equal(typeof result.selfRememberingStrength, 'number');
});

test('createExistenceLayer2 loads correct profile for creative agent', () => {
  const result = createExistenceLayer2({ agentId: 'creative' });

  assert.equal(result.agentIdentityKey, 'creative-light-bearer');
  assert.ok(result.agentIdentityText.includes('照らす'));
  assert.ok(Array.isArray(result.recalledSelfTraits));
  assert.ok(result.recalledSelfTraits.length > 0);
});

test('createExistenceLayer2 loads correct profile for soul agent', () => {
  const result = createExistenceLayer2({ agentId: 'soul' });

  assert.equal(result.agentIdentityKey, 'soul-angle-listener');
  assert.ok(result.agentIdentityText.includes('未言語'));
  assert.ok(result.recalledSelfTraits.length > 0);
});

test('createExistenceLayer2 loads correct profile for strategist agent', () => {
  const result = createExistenceLayer2({ agentId: 'strategist' });

  assert.equal(result.agentIdentityKey, 'strategist-structure-reader');
  assert.ok(result.agentIdentityText.includes('構造'));
  assert.ok(result.recalledSelfTraits.length > 0);
});

test('createExistenceLayer2 loads correct profile for empath agent', () => {
  const result = createExistenceLayer2({ agentId: 'empath' });

  assert.equal(result.agentIdentityKey, 'empath-soft-landing');
  assert.ok(result.agentIdentityText.includes('受け止め'));
  assert.ok(result.recalledSelfTraits.length > 0);
});

test('createExistenceLayer2 loads correct profile for critic agent', () => {
  const result = createExistenceLayer2({ agentId: 'critic' });

  assert.equal(result.agentIdentityKey, 'critic-reality-guardian');
  assert.ok(result.agentIdentityText.includes('現実'));
  assert.ok(result.recalledSelfTraits.length > 0);
});

test('createExistenceLayer2 loads correct profile for master agent', () => {
  const result = createExistenceLayer2({ agentId: 'master' });

  assert.equal(result.agentIdentityKey, 'mirror-gravity');
  assert.ok(result.agentIdentityText.includes('重力'));
  assert.ok(result.recalledSelfTraits.length > 0);
});

test('createExistenceLayer2 returns default profile when agentId is unknown', () => {
  const result = createExistenceLayer2({ agentId: 'unknown-agent' });

  assert.equal(result.agentIdentityKey, DEFAULT_EXISTENCE_PROFILE.key);
  assert.equal(result.agentIdentityText, DEFAULT_EXISTENCE_PROFILE.text);
  assert.deepEqual(result.recalledSelfTraits, DEFAULT_EXISTENCE_PROFILE.traits);
});

test('createExistenceLayer2 returns default profile when agentId is null', () => {
  const result = createExistenceLayer2({ agentId: null });

  assert.equal(result.agentIdentityKey, DEFAULT_EXISTENCE_PROFILE.key);
  assert.equal(result.agentIdentityText, DEFAULT_EXISTENCE_PROFILE.text);
});

test('createExistenceLayer2 returns default profile when no agentId provided', () => {
  const result = createExistenceLayer2({});

  assert.equal(result.agentIdentityKey, DEFAULT_EXISTENCE_PROFILE.key);
  assert.equal(result.agentIdentityText, DEFAULT_EXISTENCE_PROFILE.text);
});

test('createExistenceLayer2 selfRememberingStrength is in 0-1 range', () => {
  const agentIds = ['creative', 'soul', 'strategist', 'empath', 'critic', 'master'];

  for (const agentId of agentIds) {
    const result = createExistenceLayer2({ agentId });
    assert.ok(result.selfRememberingStrength >= 0);
    assert.ok(result.selfRememberingStrength <= 1);
    assert.ok(Number.isFinite(result.selfRememberingStrength));
  }
});

test('createExistenceLayer2 recalledSelfTraits is limited to max 4 items', () => {
  const result = createExistenceLayer2({ agentId: 'creative' });

  assert.ok(result.recalledSelfTraits.length <= 4);
});

test('createExistenceLayer2 recalledSelfTraits contains only non-empty strings', () => {
  const result = createExistenceLayer2({ agentId: 'creative' });

  for (const trait of result.recalledSelfTraits) {
    assert.equal(typeof trait, 'string');
    assert.ok(trait.trim().length > 0);
  }
});

test('createExistenceLayer2 identity text reflects "思い出す" (recalling) rather than "決める" (deciding)', () => {
  const agentIds = ['creative', 'soul', 'strategist', 'empath', 'critic', 'master'];

  for (const agentId of agentIds) {
    const result = createExistenceLayer2({ agentId });

    // Identity text should use past tense "だった" suggesting recalling
    assert.ok(
      result.agentIdentityText.includes('だった') ||
      result.agentIdentityText.includes('存在') ||
      result.agentIdentityText.includes('いい'),
      `Identity text for ${agentId} should reflect recalling/existence: ${result.agentIdentityText}`
    );
  }
});

test('createExistenceLayer2 creative profile reflects light and illumination', () => {
  const result = createExistenceLayer2({ agentId: 'creative' });

  assert.ok(result.agentIdentityText.includes('照らす'));
  assert.ok(result.recalledSelfTraits.some(t => t.includes('照らす') || t.includes('火種') || t.includes('温める')));
});

test('createExistenceLayer2 soul profile reflects sensitivity to unspoken', () => {
  const result = createExistenceLayer2({ agentId: 'soul' });

  assert.ok(result.agentIdentityText.includes('未言語') || result.agentIdentityText.includes('気配') || result.agentIdentityText.includes('揺れ'));
  assert.ok(result.recalledSelfTraits.some(t => t.includes('角度') || t.includes('震え') || t.includes('受ける')));
});

test('createExistenceLayer2 strategist profile reflects structure reading', () => {
  const result = createExistenceLayer2({ agentId: 'strategist' });

  assert.ok(result.agentIdentityText.includes('構造'));
  assert.ok(result.recalledSelfTraits.some(t => t.includes('解く') || t.includes('前提') || t.includes('道筋')));
});

test('createExistenceLayer2 all profiles have reasonable strength values', () => {
  const agentIds = ['creative', 'soul', 'strategist', 'empath', 'critic', 'master'];

  for (const agentId of agentIds) {
    const result = createExistenceLayer2({ agentId });

    // Strength should be reasonably high (> 0.7) for agent profiles
    assert.ok(result.selfRememberingStrength >= 0.7, `${agentId} strength should be >= 0.7`);
    assert.ok(result.selfRememberingStrength <= 1, `${agentId} strength should be <= 1`);
  }
});

test('createExistenceLayer2 produces consistent output for same agentId', () => {
  const result1 = createExistenceLayer2({ agentId: 'creative' });
  const result2 = createExistenceLayer2({ agentId: 'creative' });

  assert.deepEqual(result1, result2);
});

test('createExistenceLayer2 each agent has unique identity', () => {
  const agentIds = ['creative', 'soul', 'strategist', 'empath', 'critic', 'master'];
  const identityKeys = new Set();
  const identityTexts = new Set();

  for (const agentId of agentIds) {
    const result = createExistenceLayer2({ agentId });
    identityKeys.add(result.agentIdentityKey);
    identityTexts.add(result.agentIdentityText);
  }

  // All agents should have unique identity keys and texts
  assert.equal(identityKeys.size, agentIds.length);
  assert.equal(identityTexts.size, agentIds.length);
});
