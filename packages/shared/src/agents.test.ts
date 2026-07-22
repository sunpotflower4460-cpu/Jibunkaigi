import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONCRETE_AGENT_IDS } from './agents.ts';
import { CONNECTED_AGENT_IDS, AGENT_DEFINITIONS } from './toolEngine/agents/index.ts';
import { AGENT_PROMPT_PROFILES, getAgentPromptProfile } from './prompt/agentPromptProfiles.ts';

test('CONCRETE_AGENT_IDS.length === 7（7人体制）', () => {
  assert.equal(CONCRETE_AGENT_IDS.length, 7);
});

test('CONNECTED_AGENT_IDS の全IDが AGENT_DEFINITIONS（tool層）に存在する', () => {
  for (const id of CONNECTED_AGENT_IDS) {
    assert.ok(AGENT_DEFINITIONS[id], `${id} が AGENT_DEFINITIONS に無い`);
  }
});

test('CONNECTED_AGENT_IDS の全IDが AGENT_PROMPT_PROFILES に存在する', () => {
  for (const id of CONNECTED_AGENT_IDS) {
    assert.ok(AGENT_PROMPT_PROFILES[id], `${id} が AGENT_PROMPT_PROFILES に無い`);
  }
});

test("getAgentPromptProfile('tom').existence に「遊ぶ者の在り方」が含まれる", () => {
  const profile = getAgentPromptProfile('tom');
  assert.match(profile.existence ?? '', /遊ぶ者の在り方/);
});

test("getAgentPromptProfile('fio').existence に「風のような在り方」が含まれる", () => {
  const profile = getAgentPromptProfile('fio');
  assert.match(profile.existence ?? '', /風のような在り方/);
});
