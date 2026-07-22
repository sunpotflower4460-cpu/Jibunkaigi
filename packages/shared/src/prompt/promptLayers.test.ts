import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SYSTEM_LAYER_1_MIRROR, DEVELOPER_LAYER } from './promptLayers.ts';
import { AGENT_PROMPT_PROFILES } from './agentPromptProfiles.ts';

// 確定テキストは改行構造（段落のまとまり）も確定事項の一部。
// 空行の数がずれていないかを段落数で回帰チェックする。
function paragraphCount(text: string): number {
  return text.split(/\n\s*\n/).length;
}

test('SYSTEM_LAYER_1_MIRROR は3段落', () => {
  assert.equal(paragraphCount(SYSTEM_LAYER_1_MIRROR), 3);
});

test('DEVELOPER_LAYER は6段落', () => {
  assert.equal(paragraphCount(DEVELOPER_LAYER), 6);
});

test('7人ぶんの existence は全員5段落', () => {
  for (const [id, profile] of Object.entries(AGENT_PROMPT_PROFILES)) {
    if (!profile.existence) continue;
    assert.equal(paragraphCount(profile.existence), 5, `${id} の existence が5段落でない`);
  }
});
