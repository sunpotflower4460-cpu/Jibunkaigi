import test from 'node:test'
import assert from 'node:assert/strict'

import { buildOuterGuidePrompt } from './buildOuterGuidePrompt.js'

test('outer guide prompt sharpens compare coaching output', () => {
  const { systemInstruction, userPrompt } = buildOuterGuidePrompt({
    agentId: 'creative',
    userText: '新しい作品を出したいけど怖い',
    baselineReply: 'やってみようぜ。小さく出して手応え掴もう。',
    currentReply: 'その怖さの正体を一緒に見よう。小さく出す一手を決めよう。',
    mode: 'medium',
  })

  assert.match(systemInstruction, /Outer Guide/)
  assert.match(systemInstruction, /採点や勝敗は決めない/)
  assert.match(systemInstruction, /得たもの: \.\.\./)
  assert.match(systemInstruction, /失ったもの: \.\.\./)
  assert.match(systemInstruction, /改善提案: \.\.\./)
  assert.match(systemInstruction, /観点名を 1〜3 個だけ書く。改善提案は 1 つだけ/)
  assert.match(systemInstruction, /長文講評・勝敗判定/) 
  assert.match(systemInstruction, /ジョー比較では特に/)

  assert.match(userPrompt, /\[Baseline\]/)
  assert.match(userPrompt, /\[Current\]/)
  assert.match(userPrompt, /何を得て/)
  assert.match(userPrompt, /何を失ったか/)
  assert.match(userPrompt, /必ず以下の3行だけ/)
  assert.match(userPrompt, /改善提案: <改善提案を 1 つだけ>/)
})
