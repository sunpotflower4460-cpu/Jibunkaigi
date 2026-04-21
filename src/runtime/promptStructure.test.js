// src/runtime/promptStructure.test.js
// Phase P-1検証テスト: 新プロンプト構造の動作確認
// - textPipeline モジュールの統合確認
// - 7ブロック構造の出力確認
// - field/stance/permission値による変動確認

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAgentSystemPrompt } from './buildAgentPrompt.js';
import { buildMirrorSystemPrompt } from './mirror.js';

// 3つのシナリオで異なる latentState を用意
const scenarios = {
  gentle: {
    name: '穏やかな相談',
    latentState: {
      existence2: {
        identityFeelingText: 'ざわつきを見る',
        recalledSelfTraits: ['冷静', '距離を取る'],
      },
      beliefCore: {
        dominantBeliefAxis: 'reflection',
      },
      beliefTension: {
        dominantTensionAxis: null,
      },
      field: {
        fragility: 0.3,
        permeability: 0.5,
      },
      stance: {
        guard: 0.25,
        receive: 0.7,
        illuminate: 0.4,
      },
      permission: {
        noHurry: 0.6,
        noPerformativeHelpfulness: 0.5,
        noOverExplain: 0.7,
        allowPartialUncertainty: 0.3,
        allowSilence: 0.2,
      },
      consciousIntent: {
        holdBack: '説明を重ねない',
      },
    },
  },
  intense: {
    name: '強い不安',
    latentState: {
      existence2: {
        identityFeelingText: '震えを感じる',
        recalledSelfTraits: ['守る', '静かに受ける'],
      },
      beliefCore: {
        dominantBeliefAxis: 'holding',
      },
      beliefTension: {
        dominantTensionAxis: 'protection',
      },
      field: {
        fragility: 0.8,
        permeability: 0.2,
      },
      stance: {
        guard: 0.85,
        receive: 0.9,
        illuminate: 0.1,
      },
      permission: {
        noHurry: 0.9,
        noPerformativeHelpfulness: 0.85,
        noOverExplain: 0.9,
        allowPartialUncertainty: 0.6,
        allowSilence: 0.8,
      },
      consciousIntent: {
        holdBack: '触れすぎない。そっと受ける',
      },
    },
  },
  angry: {
    name: '怒り混じり',
    latentState: {
      existence2: {
        identityFeelingText: '引っかかりを追う',
        recalledSelfTraits: ['違和感に敏感', '構造を見る'],
      },
      beliefCore: {
        dominantBeliefAxis: 'structure',
      },
      beliefTension: {
        dominantTensionAxis: 'friction',
      },
      field: {
        fragility: 0.5,
        permeability: 0.6,
      },
      stance: {
        guard: 0.4,
        receive: 0.5,
        illuminate: 0.75,
      },
      permission: {
        noHurry: 0.4,
        noPerformativeHelpfulness: 0.6,
        noOverExplain: 0.5,
        allowPartialUncertainty: 0.7,
        allowSilence: 0.3,
      },
      consciousIntent: {
        holdBack: '整理しすぎない',
      },
    },
  },
};

const baseParams = {
  activated: {},
  context: '',
  mode: 'medium',
  userText: 'test input',
  surfaceFrame: {
    pacing: 'slow',
    directness: 'gentle',
    emotionalTemperature: 'soft',
    lengthPlan: { lineCountHint: 4 },
    restraint: { holdBackSummary: 0.8, keepSilenceMargin: 0.6 },
    permissionHints: ['do_not_rush', 'do_not_over_explain'],
    speakIntentKey: 'touch_living_thread',
  },
};

test('新プロンプト構造は7ブロックを含む', () => {
  const prompt = buildAgentSystemPrompt('creative', {
    ...baseParams,
    latentState: scenarios.gentle.latentState,
  });

  // 7ブロックの見出し確認
  assert.ok(prompt.includes('【存在の前提】'), 'missing 存在の前提 block');
  assert.ok(prompt.includes('【今の場の空気】'), 'missing 今の場の空気 block');
  // 【場に浮かんでいるもの】は activated が空なので出ない
  assert.ok(prompt.includes('【場の余白】'), 'missing 場の余白 block');
  // 【内的方向づけ】は reentry が空なので出ない
  // 【ここまでの流れ】は context が空なので出ない
  // モード指示は【場の余白】に含まれる
  assert.ok(prompt.includes('触れたぶんだけで足りる'), 'missing mode guide in margin block');
});

test('アンカーテキストが含まれる', () => {
  // Phase 4-2 (修正指示書 v3): anchorLabel は「極薄で機能化」されており、
  // 一行で「どこに触れるか」を示す。性格説明文にはしない。
  const agentMap = {
    creative: '（ジョーとして。まだ消えていない一点に触れるように。）',
    soul: '（レイとして。まだ言葉になる前の気配に触れるように。）',
    strategist: '（ケンとして。絡まりと隠れた前提を見るように。）',
    empath: '（ミナとして。こぼれそうなものをそっと受け止めるように。）',
    critic: '（サトウとして。避けているものに静かに目を向けるように。）',
  };

  for (const [agentId, anchor] of Object.entries(agentMap)) {
    const prompt = buildAgentSystemPrompt(agentId, {
      ...baseParams,
      latentState: scenarios.gentle.latentState,
    });
    assert.ok(prompt.includes(anchor), `missing anchor for ${agentId}`);
  }
});

test('buildExistenceText が latentState から動的生成する', () => {
  const gentlePrompt = buildAgentSystemPrompt('creative', {
    ...baseParams,
    latentState: scenarios.gentle.latentState,
  });

  const intensePrompt = buildAgentSystemPrompt('creative', {
    ...baseParams,
    latentState: scenarios.intense.latentState,
  });

  // identityFeelingText が反映されているか
  assert.ok(gentlePrompt.includes('ざわつきを見る'), 'gentle scenario should include identityFeelingText');
  assert.ok(intensePrompt.includes('震えを感じる'), 'intense scenario should include identityFeelingText');

  // recalledSelfTraits が反映されているか
  assert.ok(gentlePrompt.includes('冷静'), 'gentle scenario should include trait');
  assert.ok(intensePrompt.includes('守る'), 'intense scenario should include trait');
});

test('buildFieldText が field/stance/beliefCore から動的生成する', () => {
  const gentlePrompt = buildAgentSystemPrompt('creative', {
    ...baseParams,
    latentState: scenarios.gentle.latentState,
  });

  const intensePrompt = buildAgentSystemPrompt('creative', {
    ...baseParams,
    latentState: scenarios.intense.latentState,
  });

  // fragility に応じた描写の変動確認（数値が異なる）
  // gentle: fragility 0.3, intense: fragility 0.8 なので異なる描写が期待される
  assert.notEqual(gentlePrompt, intensePrompt, 'prompts should differ based on latentState');

  // beliefCore.dominantBeliefAxis の反映確認
  // gentle: reflection, intense: holding, angry: structure
  const angryPrompt = buildAgentSystemPrompt('creative', {
    ...baseParams,
    latentState: scenarios.angry.latentState,
  });

  // 3つのシナリオで異なるプロンプトが生成されるか
  assert.notEqual(gentlePrompt, intensePrompt);
  assert.notEqual(gentlePrompt, angryPrompt);
  assert.notEqual(intensePrompt, angryPrompt);
});

test('buildMarginText が permission と consciousIntent.holdBack から動的生成する', () => {
  const gentlePrompt = buildAgentSystemPrompt('creative', {
    ...baseParams,
    latentState: scenarios.gentle.latentState,
  });

  const intensePrompt = buildAgentSystemPrompt('creative', {
    ...baseParams,
    latentState: scenarios.intense.latentState,
  });

  // consciousIntent.holdBack の反映確認
  assert.ok(gentlePrompt.includes('説明を重ねない'), 'gentle should include holdBack text');
  assert.ok(intensePrompt.includes('触れすぎない。そっと受ける'), 'intense should include holdBack text');

  // permission の反映確認 (noOverExplain: 0.7 なので閾値 0.5 を超える)
  assert.ok(gentlePrompt.includes('言い切らなくても崩れない'), 'gentle should include permission text');

  // permission の反映確認 (allowSilence: 0.8 なので閾値 0.5 を超える)
  assert.ok(intensePrompt.includes('少し黙っていても途切れない'), 'intense should include allowSilence text');
});

test('latentState なしでも正常動作する (後方互換)', () => {
  const prompt = buildAgentSystemPrompt('creative', {
    ...baseParams,
    latentState: null,
  });

  // アンカーテキストは必ず含まれる
  assert.ok(prompt.includes('（ジョーとして。'), 'anchor should be present even without latentState');

  // モードガイドは場の余白に含まれる
  assert.ok(prompt.includes('触れたぶんだけで足りる'), 'mode guide should be present in margin section');
});

test('mirror プロンプトも7ブロック構造を持つ', () => {
  const mirror = buildMirrorSystemPrompt({
    context: '',
    signals: {},
    activated: {},
    latentState: scenarios.gentle.latentState,
  });

  assert.ok(mirror.includes('あなたは「心の鏡」。'), 'mirror should have existence declaration');
  assert.ok(mirror.includes('【存在の前提】') || mirror.includes('心の鏡'), 'mirror should have existence block');
});

test('A/B比較: 異なる field.fragility で異なる場の描写が生成される', () => {
  const lowFragility = buildAgentSystemPrompt('creative', {
    ...baseParams,
    latentState: {
      ...scenarios.gentle.latentState,
      field: { fragility: 0.2, permeability: 0.5 },
    },
  });

  const highFragility = buildAgentSystemPrompt('creative', {
    ...baseParams,
    latentState: {
      ...scenarios.gentle.latentState,
      field: { fragility: 0.9, permeability: 0.5 },
    },
  });

  // fragility の値が変わると、プロンプトも変わる
  assert.notEqual(lowFragility, highFragility, 'different fragility should produce different prompts');
});

test('A/B比較: 異なる stance.guard で異なる姿勢描写が生成される', () => {
  const lowGuard = buildAgentSystemPrompt('creative', {
    ...baseParams,
    latentState: {
      ...scenarios.gentle.latentState,
      stance: { guard: 0.1, receive: 0.5, illuminate: 0.5 },
    },
  });

  const highGuard = buildAgentSystemPrompt('creative', {
    ...baseParams,
    latentState: {
      ...scenarios.gentle.latentState,
      stance: { guard: 0.95, receive: 0.9, illuminate: 0.2 },
    },
  });

  // stance.guard の値が変わると、プロンプトも変わる
  assert.notEqual(lowGuard, highGuard, 'different guard should produce different prompts');
});

test('全エージェントが新構造でプロンプト生成できる', () => {
  const agentIds = ['creative', 'soul', 'strategist', 'empath', 'critic'];

  for (const agentId of agentIds) {
    const prompt = buildAgentSystemPrompt(agentId, {
      ...baseParams,
      latentState: scenarios.gentle.latentState,
    });

    assert.equal(typeof prompt, 'string');
    assert.ok(prompt.length > 10, `${agentId} prompt should not be empty`);
    assert.ok(prompt.includes('【'), `${agentId} prompt should contain block markers`);
  }
});
