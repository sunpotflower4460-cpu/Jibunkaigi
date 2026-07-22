import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AGENT_PROMPT_PROFILES } from './agentPromptProfiles.ts';

const CONCRETE_AGENT_IDS = ['satou', 'joe', 'mina', 'ray', 'ken', 'tom', 'fio'] as const;

test('サトウの core に「目を背けない」または「守る」が含まれる（フィオとの混同の回帰防止）', () => {
  const core = AGENT_PROMPT_PROFILES.satou.core;
  assert.ok(core.includes('目を背けない') || core.includes('守る'), `core: ${core}`);
});

test('7人それぞれの core / sees / avoids / tone が空文字でない', () => {
  for (const id of CONCRETE_AGENT_IDS) {
    const profile = AGENT_PROMPT_PROFILES[id];
    for (const field of ['core', 'sees', 'avoids', 'tone'] as const) {
      assert.ok(profile[field].length > 0, `${id}.${field} が空文字`);
    }
  }
});

test('avoids に各エージェントの抑制（安全装置）が反映されている', () => {
  assert.match(AGENT_PROMPT_PROFILES.satou.avoids, /踏み込みすぎ/);
  assert.match(AGENT_PROMPT_PROFILES.mina.avoids, /共倒れ|沈/);
  assert.match(AGENT_PROMPT_PROFILES.tom.avoids, /茶化す/);
  assert.match(AGENT_PROMPT_PROFILES.joe.avoids, /押しつけ|ない光/);
});
