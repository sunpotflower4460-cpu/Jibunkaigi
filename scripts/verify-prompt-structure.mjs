// scripts/verify-prompt-structure.mjs
// Phase P-1 検証: 3つの異なるシナリオでプロンプト生成を確認

import { buildAgentSystemPrompt } from '../src/runtime/buildAgentPrompt.js';

const scenarios = {
  gentle: {
    name: '穏やかな相談',
    userText: '最近、なんとなく焦りを感じています',
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
    userText: 'もう無理で諦めたい。全部投げ出したい',
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
    userText: '何度説明してもわかってもらえない。イライラする',
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

console.log('='.repeat(80));
console.log('Phase P-1 プロンプト構造検証');
console.log('='.repeat(80));
console.log();

for (const [key, scenario] of Object.entries(scenarios)) {
  console.log('━'.repeat(80));
  console.log(`シナリオ: ${scenario.name}`);
  console.log(`ユーザー入力: 「${scenario.userText}」`);
  console.log('━'.repeat(80));
  console.log();

  const prompt = buildAgentSystemPrompt('creative', {
    ...baseParams,
    userText: scenario.userText,
    latentState: scenario.latentState,
  });

  console.log(prompt);
  console.log();
  console.log('—'.repeat(80));
  console.log();
}

console.log('='.repeat(80));
console.log('検証完了');
console.log('='.repeat(80));
console.log();
console.log('確認事項:');
console.log('✓ 3つのシナリオで異なるプロンプトが生成されているか');
console.log('✓ 【存在の前提】に latentState.existence2 の内容が反映されているか');
console.log('✓ 【今の場の空気】に field/stance/beliefCore の内容が反映されているか');
console.log('✓ 【場の余白】に consciousIntent.holdBack と permission の内容が反映されているか');
console.log('✓ アンカーテキスト「（ジョーとして。）」が含まれているか');
console.log();
