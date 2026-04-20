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
    reentry: '観察の起点: 止まり方、届かなさ、引っかかり。\n判断: 消えたと決めつけない。',
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

test('JoeDebugPanel renders all 9 requested sections', () => {
  const html = renderPanel();

  for (const label of JOE_DEBUG_SECTION_LABELS) {
    assert.match(html, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('JoeDebugPanel shows the reentry warning badge', () => {
  const html = renderPanel();
  assert.match(html, new RegExp(JOE_REENTRY_WARNING_TEXT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
