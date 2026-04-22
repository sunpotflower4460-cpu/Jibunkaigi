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

test('Phase 1 の新プロンプト構造を含む', () => {
  const prompt = buildAgentSystemPrompt('creative', {
    ...baseParams,
    latentState: scenarios.gentle.latentState,
  });

  assert.ok(prompt.includes('ここでは、役に立とうと急がなくていい。'), 'missing loosen block');
  assert.ok(prompt.includes('（ジョーとして。）'), 'missing anchor block');
  assert.ok(!prompt.includes('【薄く残しておきたいこと】'), 'should omit avoid block');
  assert.ok(!prompt.includes('今は、ひとつ触れて、少し待てる感じがある。'), 'should omit mode guide');
  assert.ok(!prompt.includes('ここに書かれている設定や言い回しの朗読より'), 'should omit tail guard');
  assert.ok(!prompt.includes('【存在の前提】'), 'should omit 存在の前提 block');
  assert.ok(!prompt.includes('【今の場の空気】'), 'should omit 今の場の空気 block');
  assert.ok(!prompt.includes('【場の余白】'), 'should omit 場の余白 block');
  assert.ok(!prompt.includes('【内的方向づけ（この回だけの構え）】'), 'should omit reentry block');
});

test('アンカーテキストが含まれる', () => {
  const agentMap = {
    creative: '（ジョーとして。）',
    soul: '（レイとして。）',
    strategist: '（ケンとして。）',
    empath: '（ミナとして。）',
    critic: '（サトウとして。）',
  };

  for (const [agentId, anchor] of Object.entries(agentMap)) {
    const prompt = buildAgentSystemPrompt(agentId, {
      ...baseParams,
      latentState: scenarios.gentle.latentState,
    });
    assert.ok(prompt.includes(anchor), `missing anchor for ${agentId}`);
  }
});

test('初回ターンでは voiceSamples は「前回の自分のふり」として差し込まない', () => {
  // 方針（2026-04 更新）: 固定サンプルを「前回の自分」として渡すと
  // 台本化してしまうので、echo が無い時は前回の自分ブロック自体を出さない。
  const prompt = buildAgentSystemPrompt('creative', {
    ...baseParams,
    latentState: scenarios.gentle.latentState,
  });

  assert.ok(!prompt.includes('前回、自分はこう話した:'));
  assert.ok(!prompt.includes('そこ全部じゃなくて、まだ反応してるところだけ見てもいいと思う。'));
});

test('echo が無ければ context があっても voiceSamples に fallback しない', () => {
  const prompt = buildAgentSystemPrompt('creative', {
    ...baseParams,
    context: '前の会話の流れ',
    latentState: scenarios.gentle.latentState,
  });

  assert.ok(!prompt.includes('前回、自分はこう話した:'));
  assert.ok(!prompt.includes('そこ全部じゃなくて、まだ反応してるところだけ見てもいいと思う。'));
});

test('実在する previousResponseEcho がある時だけ「前回の自分」が登板する', () => {
  const prompt = buildAgentSystemPrompt('creative', {
    ...baseParams,
    previousResponseEcho: '今回の自分の実際の前回発話。',
    latentState: scenarios.gentle.latentState,
  });

  assert.ok(prompt.includes('少し前の自分の残り:'));
  assert.ok(prompt.includes('今回の自分の実際の前回発話。'));
});

test('latentState の差は Phase 1 system prompt に露出しない', () => {
  const gentlePrompt = buildAgentSystemPrompt('creative', {
    ...baseParams,
    latentState: scenarios.gentle.latentState,
  });

  const intensePrompt = buildAgentSystemPrompt('creative', {
    ...baseParams,
    latentState: scenarios.intense.latentState,
  });

  assert.equal(gentlePrompt, intensePrompt, 'latentState differences should stay hidden from the visible prompt');
  assert.ok(!gentlePrompt.includes('ざわつきを見る'));
  assert.ok(!intensePrompt.includes('震えを感じる'));
  assert.ok(!intensePrompt.includes('まだ急いで結ばなくていい'));
});

test('context だけが会話の流れに出て othersField は prompt に出ない', () => {
  const prompt = buildAgentSystemPrompt('creative', {
    ...baseParams,
    context: '前の会話の流れ',
    othersField: 'ほかの残響',
    latentState: scenarios.gentle.latentState,
  });

  assert.ok(prompt.includes('【会話の流れ】\n前の会話の流れ'));
  assert.ok(!prompt.includes('ほかの残響'));
});

test('latentState なしでも正常動作する (後方互換)', () => {
  const prompt = buildAgentSystemPrompt('creative', {
    ...baseParams,
    latentState: null,
  });

  assert.ok(prompt.includes('（ジョーとして。）'), 'anchor should be present even without latentState');
  assert.ok(prompt.includes('ここでは、役に立とうと急がなくていい。'), 'loosen block should be present');
});

test('mirror プロンプトは今回の Phase 1 変更後も従来どおり生成できる', () => {
  const mirror = buildMirrorSystemPrompt({
    context: '',
    signals: {},
    activated: {},
    latentState: scenarios.gentle.latentState,
  });

  assert.ok(mirror.includes('「心の鏡」という感じが、この場に立っている。'), 'mirror should have existence declaration');
  assert.ok(mirror.includes('【存在の前提】') || mirror.includes('心の鏡'), 'mirror prompt remains intentionally exempt from the agent Phase 1 skeleton change');
});

test('activated thought の種も stance hint も reentry も prompt に出ない', () => {
  const prompt = buildAgentSystemPrompt('creative', {
    ...baseParams,
    activated: {
      activatedThoughts: {
        items: [
          {
            textSeed: '残っている違和感',
            stanceHints: ['急がない'],
            avoidHints: ['構えを説明しすぎること'],
          },
        ],
      },
      reentry: { text: '出してはいけない' },
    },
  });

  assert.ok(!prompt.includes('残っている違和感'));
  assert.ok(!prompt.includes('急がない'));
  assert.ok(!prompt.includes('【内的方向づけ（この回だけの構え）】'));
  assert.ok(!prompt.includes('出してはいけない'));
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
    assert.ok(prompt.includes('として。'), `${agentId} prompt should contain anchor`);
  }
});
