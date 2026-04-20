import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import JoeDebugPanel, {
  JOE_DEBUG_SECTION_LABELS,
  JOE_REENTRY_WARNING_TEXT,
} from '../JoeDebugPanel.js';

const sampleEntry = {
  timestamp: Date.UTC(2026, 3, 20, 10, 0, 0),
  userText: '作品を出したいけど、まだ怖さもある。',
  estimateState: {
    desire: 0.7,
    fear: 0.6,
    freeze: 0.3,
    reach: 0.55,
    resignation: 0.1,
    selfErasure: 0.2,
    shame: 0.4,
    unfinished: 0.8,
  },
  microSignals: {
    punctuation: { assertion: 0.6, hesitation: 0.4, trailOff: 0.7 },
    fillers: { fillerDensity: 0.35 },
    negationPrefix: { softNegation: 0.52 },
    sentenceLength: { burstiness: 0.28, shortnessPressure: 0.41 },
    selfHedging: { epistemicLowering: 0.44 },
    quotation: { distancing: 0.12 },
  },
  microSignalBias: {
    maxDelta: 0.15,
    field: {
      axes: {
        softness: { base: 0.42, delta: 0.04, final: 0.46 },
        depth: { base: 0.51, delta: 0, final: 0.51 },
        urgency: { base: 0.2, delta: 0.03, final: 0.23 },
        fragility: { base: 0.37, delta: 0.06, final: 0.43 },
        playfulness: { base: 0.12, delta: 0, final: 0.12 },
      },
    },
    reaction: {
      axes: {
        touched: { base: 0.33, delta: 0.08, final: 0.41 },
        protect: { base: 0.29, delta: 0.05, final: 0.34 },
        clarify: { base: 0.14, delta: 0, final: 0.14 },
        curiosity: { base: 0.21, delta: 0, final: 0.21 },
        holdBackJudgment: { base: 0.48, delta: 0.11, final: 0.59 },
      },
    },
    stance: {
      axes: {
        receive: { base: 0.35, delta: 0.09, final: 0.44 },
        illuminate: { base: 0.28, delta: 0.05, final: 0.33 },
        structure: { base: 0.31, delta: -0.04, final: 0.27 },
        guard: { base: 0.22, delta: 0, final: 0.22 },
        nudge: { base: 0.19, delta: 0, final: 0.19 },
      },
    },
  },
  activated: {
    activeBeliefs: [
      { id: 'unfinished_is_alive', sense: '未完成は欠陥より、まだ途中に見える', score: 0.82 },
      { id: 'fear_touches_scale', sense: '怖さは弱さより、大事なものへの接触に見える', score: 0.75 },
    ],
    activeMemories: [
      { id: 'fire_was_already_there', trace: '向こうの中で動きが立ち上がった瞬間の記憶', score: 0.91 },
      { id: 'light_hidden_in_darkness', trace: '重さの中でも残っている反応を見つける感覚', score: 0.63 },
    ],
    activeField: [
      { id: 'unfinished_mask', text: '終わっていないのに終わったことにしている感じは、見落とさない', score: 0.88 },
      { id: 'fearful_reaching', text: '怖さがあっても手を伸ばしている感じには、近さとして反応する', score: 0.71 },
    ],
    activeResidue: [
      '一点だけ拾う。全部に触れようとしない。',
      '説教に向かわない。押し切る調子を避ける。',
      '解釈を重ねすぎない。言い切りすぎない。',
      '未完成を責めない。途中として扱う。',
    ].join('\n'),
    reentry: {
      text: '観察の起点: 止まり方、届かなさ、引っかかり。\n判断: 消えたと決めつけない。',
      tags: ['fear', 'freeze'],
      score: 1.4,
      weight: 0.61,
      breakdown: [
        { tag: 'fear', value: 0.6 },
        { tag: 'freeze', value: 0.3 },
        { tag: 'unfinished', value: 0.5 },
      ],
    },
    debug: {
      reentryComposition: {
        parts: [
          {
            label: '観察の起点',
            input: [
              { tag: 'fear', value: 0.6 },
              { tag: 'hesitation', value: 0.4 },
            ],
            selected: {
              text: '止まり方、届かなさ、引っかかり。',
              score: 0.82,
              tags: ['fear', 'freeze', 'receive'],
            },
          },
          {
            label: '判断',
            input: [
              { tag: 'holdBack', value: 0.59 },
              { tag: 'avoidAssertion', value: 0.48 },
            ],
            selected: {
              text: '消えたと決めつけない。',
              score: 0.78,
              tags: ['holdBack', 'nonClosure'],
            },
          },
          {
            label: '出力制約',
            input: [
              { tag: 'structureAvoid', value: 0.66 },
              { tag: 'touch', value: 0.51 },
            ],
            selected: {
              text: '整えすぎない。触れられていれば十分。',
              score: 0.8,
              tags: ['structureAvoid', 'touch'],
            },
          },
        ],
        finalText: '観察の起点: 止まり方、届かなさ、引っかかり。\n判断: 消えたと決めつけない。\n出力制約: 整えすぎない。触れられていれば十分。',
      },
      reentryCandidates: [
        {
          text: '観察の起点: 止まり方、届かなさ、引っかかり。\n判断: 消えたと決めつけない。',
          tags: ['fear', 'freeze'],
          score: 1.4,
          weight: 0.61,
          selected: true,
          breakdown: [
            { tag: 'fear', value: 0.6 },
            { tag: 'freeze', value: 0.3 },
            { tag: 'unfinished', value: 0.5 },
          ],
        },
        {
          text: '見る方向: 細くても残っている向き。\n返し方: 押すより触れる。',
          tags: ['reach', 'desire'],
          score: 0.55,
          weight: 0.12,
          selected: false,
          breakdown: [
            { tag: 'reach', value: 0.55 },
            { tag: 'desire', value: 0.7 },
          ],
        },
      ],
    },
  },
  systemInstruction: 'SYSTEM PROMPT',
  promptText: 'USER PROMPT',
};

const renderPanel = (entry = sampleEntry) => renderToStaticMarkup(
  React.createElement(JoeDebugPanel, { entry }),
);

test('JoeDebugPanel mounts without crashing', () => {
  const html = renderPanel();
  assert.match(html, /Joe Debug Panel/);
});

test('JoeDebugPanel handles null activated safely', () => {
  const html = renderPanel({ ...sampleEntry, activated: null });
  assert.match(html, /activeBeliefs はありません。/);
  assert.match(html, /activeMemories はありません。/);
  assert.match(html, /activeField はありません。/);
});

test('JoeDebugPanel renders all requested sections', () => {
  const html = renderPanel();

  for (const label of JOE_DEBUG_SECTION_LABELS) {
    assert.match(html, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('JoeDebugPanel renders micro-signal values', () => {
  const html = renderPanel();

  assert.match(html, /マイクロシグナル/);
  assert.match(html, /punctuation/);
  assert.match(html, /softNegation/);
  assert.match(html, /epistemicLowering/);
  assert.match(html, /micro-signal による補正量 delta/);
  assert.match(html, /各軸の delta 上限: ±0.15/);
  assert.match(html, /structure/);
});

test('JoeDebugPanel shows the reentry state-driven badge', () => {
  const html = renderPanel();
  assert.match(html, new RegExp(JOE_REENTRY_WARNING_TEXT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(html, /合成の過程/);
  assert.match(html, /最終合成テキスト/);
  assert.match(html, /入力: fear:0\.[0-9]{2} \/ hesitation:0\.[0-9]{2}/);
  assert.match(html, /なぜこの reentry が選ばれたか/);
  assert.match(html, /breakdown: fear:0.60 \/ freeze:0.30 \/ unfinished:0.50/);
});
