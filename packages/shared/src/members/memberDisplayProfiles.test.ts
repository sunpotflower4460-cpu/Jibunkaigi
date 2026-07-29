import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MEMBER_DISPLAY_PROFILES } from './memberDisplayProfiles.ts';
import { UNIVERSAL_AGENTS } from '../agents.ts';

// 表示用の要約（一言 / role / stance）が、確定テキスト（existence）の
// 光の根からずれていないことを見張る。
// 指示書10でサトウの core を「守る者」に整えた後も、これらの要約だけが
// 旧「足場・地面へ戻す」（フィオの身体アンカーと重なる枠組み）のまま
// 残っていたため、その回帰を防ぐ。

test('サトウの表示用テキストに、フィオと重なる「足場 / 地面へ戻す」枠組みが残っていない', () => {
  const satouAgent = UNIVERSAL_AGENTS.find((a) => a.id === 'satou');
  assert.ok(satouAgent, 'satou が UNIVERSAL_AGENTS に無い');
  const satouProfile = MEMBER_DISPLAY_PROFILES.find((p) => p.id === 'satou');
  assert.ok(satouProfile, 'satou が MEMBER_DISPLAY_PROFILES に無い');

  const texts = [satouAgent.role, satouAgent.stance, satouProfile.oneLine];
  for (const text of texts) {
    assert.doesNotMatch(text, /足場|地面へ戻す/, `旧サトウ像が残っている: ${text}`);
  }
});

test('サトウの表示用テキストが「守る者」の光の根に沿っている', () => {
  const satouAgent = UNIVERSAL_AGENTS.find((a) => a.id === 'satou');
  const satouProfile = MEMBER_DISPLAY_PROFILES.find((p) => p.id === 'satou');
  const joined = [satouAgent?.role, satouAgent?.stance, satouProfile?.oneLine].join(' / ');
  assert.match(joined, /危う|警報|崖/, `守る者の像が読み取れない: ${joined}`);
});

test('9人それぞれの一言 / role / stance が空文字でない', () => {
  for (const agent of UNIVERSAL_AGENTS) {
    assert.ok(agent.role.length > 0, `${agent.id}.role が空文字`);
    assert.ok(agent.stance.length > 0, `${agent.id}.stance が空文字`);
  }
  for (const profile of MEMBER_DISPLAY_PROFILES) {
    assert.ok(profile.oneLine.length > 0, `${profile.id}.oneLine が空文字`);
  }
});

test('一言が9人のあいだで重複していない（人格の混同の検知）', () => {
  const seen = new Map<string, string>();
  for (const profile of MEMBER_DISPLAY_PROFILES) {
    const duplicate = seen.get(profile.oneLine);
    assert.equal(
      duplicate,
      undefined,
      `${profile.id} と ${duplicate} の一言が同じ: ${profile.oneLine}`,
    );
    seen.set(profile.oneLine, profile.id);
  }
});
