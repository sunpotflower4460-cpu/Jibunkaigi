import test from 'node:test';
import assert from 'node:assert/strict';

import { composeJoeReentry } from '../composeReentry.js';

const getPart = (result, label) => result?.selected?.composition?.parts?.find((part) => part.label === label);

const BASE_INPUT = {
  state: {
    desire: 0.32,
    fear: 0.28,
    freeze: 0.22,
    reach: 0.26,
    resignation: 0.08,
    selfErasure: 0.11,
    shame: 0.18,
    unfinished: 0.35,
  },
  microSignals: {
    punctuation: { assertion: 0.2, hesitation: 0.1, trailOff: 0.1 },
    fillers: { fillerDensity: 0.1 },
    negationPrefix: { softNegation: 0.1 },
    sentenceLength: { burstiness: 0.1, shortnessPressure: 0 },
    selfHedging: { epistemicLowering: 0.1 },
    quotation: { distancing: 0 },
  },
  beliefTension: {
    activeTensions: [],
    dominantTensionAxis: null,
    totalTensionStrength: 0,
  },
  afterglowSeed: null,
  othersField: [],
};

const CASES = [
  {
    name: 'hesitation-heavy freeze chooses receptive observation',
    input: {
      ...BASE_INPUT,
      state: { ...BASE_INPUT.state, fear: 0.72, freeze: 0.68, unfinished: 0.54 },
      microSignals: {
        ...BASE_INPUT.microSignals,
        punctuation: { assertion: 0.1, hesitation: 0.95, trailOff: 0.3 },
      },
    },
    label: '観察の起点',
    expected: /止まり方|動きたさと止まり/,
  },
  {
    name: 'reach-forward state keeps alive-direction observation',
    input: {
      ...BASE_INPUT,
      state: { ...BASE_INPUT.state, desire: 0.78, reach: 0.83, unfinished: 0.61 },
      microSignals: {
        ...BASE_INPUT.microSignals,
        punctuation: { assertion: 0.4, hesitation: 0.05, trailOff: 0.15 },
      },
    },
    label: '観察の起点',
    expected: /細くても残っている向き/,
  },
  {
    name: 'shame with high tension avoids performative judgment',
    input: {
      ...BASE_INPUT,
      state: { ...BASE_INPUT.state, shame: 0.82, freeze: 0.6, unfinished: 0.58 },
      beliefTension: {
        activeTensions: [
          { tensionType: 'violation', strength: 0.74 },
          { tensionType: 'friction', strength: 0.52 },
        ],
        dominantTensionAxis: 'containment',
        totalTensionStrength: 0.81,
      },
    },
    label: '判断',
    expected: /かっこつけた言い回しに逃げない/,
  },
  {
    name: 'pull and protection tension keeps non-closure judgment',
    input: {
      ...BASE_INPUT,
      state: { ...BASE_INPUT.state, fear: 0.7, unfinished: 0.74, desire: 0.4 },
      beliefTension: {
        activeTensions: [
          { tensionType: 'pull', strength: 0.66 },
          { tensionType: 'protection', strength: 0.78 },
        ],
        dominantTensionAxis: 'presence',
        totalTensionStrength: 0.84,
      },
    },
    label: '判断',
    expected: /消えたと決めつけない/,
  },
  {
    name: 'receive-heavy afterglow softens output constraint',
    input: {
      ...BASE_INPUT,
      afterglowSeed: {
        previousLatentState: {
          stance: { receive: 0.82, structure: 0.18 },
          reaction: { protect: 0.77, touched: 0.42, holdBackJudgment: 0.31 },
          field: { fragility: 0.38 },
        },
        previousMix: { selected: [{ id: 'feeling-1', group: 'feeling', weight: 0.41 }] },
      },
    },
    label: '出力制約',
    expected: /整えすぎない。触れられていれば十分。/,
  },
  {
    name: 'dense feeling afterglow changes output toward density',
    input: {
      ...BASE_INPUT,
      afterglowSeed: {
        previousLatentState: {
          stance: { receive: 0.22, structure: 0.15 },
          reaction: { protect: 0.15, touched: 0.78, holdBackJudgment: 0.1 },
          field: { fragility: 0.72 },
        },
        previousMix: {
          selected: [
            { id: 'feeling-1', group: 'feeling', weight: 0.64 },
            { id: 'move-1', group: 'move', weight: 0.51 },
          ],
        },
      },
    },
    label: '出力制約',
    expected: /テンションより密度。答えより接触。/,
  },
  {
    name: 'structured others field pushes away from structure',
    input: {
      ...BASE_INPUT,
      afterglowSeed: {
        previousLatentState: {
          stance: { receive: 0.28, structure: 0.72, illuminate: 0.32 },
          reaction: { protect: 0.1, touched: 0.26, holdBackJudgment: 0.21 },
        },
        previousMix: { selected: [{ id: 'thought-1', group: 'thought', weight: 0.61 }] },
      },
      othersField: [
        {
          agentId: 'ken',
          gist: 'ケンが構造を整理した',
          toneTags: ['structural'],
          forceTags: ['clarify'],
        },
      ],
    },
    label: '出力制約',
    expected: /整えすぎない|比喩は必要なときだけ|テンションより密度/,
  },
  {
    name: 'empty-ish input still falls back to corpus text',
    input: {
      state: {},
      microSignals: {},
      beliefTension: null,
      afterglowSeed: null,
      othersField: [],
    },
    label: '観察の起点',
    expected: /.+/,
  },
];

for (const scenario of CASES) {
  test(`composeJoeReentry: ${scenario.name}`, () => {
    const result = composeJoeReentry(scenario.input);
    const part = getPart(result, scenario.label);

    assert.ok(result.selected.text);
    assert.ok(result.selected.text.split('\n').length <= 4);
    assert.ok(part);
    assert.match(part.selected.text, scenario.expected);
  });
}

test('same state with different afterglow composes different reentry text', () => {
  const sharedInput = {
    ...BASE_INPUT,
    state: { ...BASE_INPUT.state, desire: 0.61, reach: 0.55, unfinished: 0.57 },
  };

  const receiveResult = composeJoeReentry({
    ...sharedInput,
    afterglowSeed: {
      previousLatentState: {
        stance: { receive: 0.81, structure: 0.12 },
        reaction: { protect: 0.73, touched: 0.28, holdBackJudgment: 0.21 },
      },
      previousMix: { selected: [{ id: 'feeling-1', group: 'feeling', weight: 0.35 }] },
    },
  });
  const denseResult = composeJoeReentry({
    ...sharedInput,
    afterglowSeed: {
      previousLatentState: {
        stance: { receive: 0.16, structure: 0.14 },
        reaction: { protect: 0.1, touched: 0.82, holdBackJudgment: 0.08 },
        field: { fragility: 0.72 },
      },
      previousMix: {
        selected: [
          { id: 'feeling-1', group: 'feeling', weight: 0.66 },
          { id: 'move-1', group: 'move', weight: 0.58 },
        ],
      },
    },
  });

  assert.notEqual(receiveResult.selected.text, denseResult.selected.text);
});

test('othersField noting Ken structure steers away from structure-heavy output', () => {
  const result = composeJoeReentry({
    ...BASE_INPUT,
    othersField: [
      {
        agentId: 'ken',
        gist: 'ケンが構造化した',
        toneTags: ['structural'],
        forceTags: ['clarify', 'ground'],
      },
    ],
  });
  const outputConstraint = getPart(result, '出力制約');

  assert.ok(outputConstraint);
  assert.doesNotMatch(outputConstraint.selected.text, /構造|整理/);
});

test('empty override corpus falls back to built-in corpus', () => {
  const result = composeJoeReentry(BASE_INPUT, {
    corpus: {
      observation: [],
      judgment: [],
      outputConstraint: [],
    },
  });

  assert.ok(result.selected.text);
  assert.equal(result.selected.composition.fallbackUsed, true);
});
