// Mock agent replies for Universal Local Conversation MVP.
// These are placeholder responses only — not real AI output.
// Replace with Gemini Proxy calls in Phase 3.

import type { UniversalAgentId, UniversalModeId } from '../state/mobileTypes';

function shorten(text: string, maxLen = 20): string {
  const trimmed = text.trim();
  return trimmed.length <= maxLen ? trimmed : trimmed.slice(0, maxLen) + '…';
}

export const AGENT_LABELS: Record<UniversalAgentId, string> = {
  mirror: '心の鏡',
  delegate: '委ねる',
  ray: 'レイ',
  joe: 'ジョー',
  ken: 'ケン',
  mina: 'ミナ',
  satou: 'サトウ',
};

export const AGENT_THINKING_TEXT: Record<UniversalAgentId, string> = {
  mirror: '心の鏡が、ここまでの声を映しています…',
  delegate: '場に合う視点を探しています…',
  ray: 'レイが、言葉になる前の気配を見ています…',
  joe: 'ジョーが、まだ消えていない一点を見ています…',
  ken: 'ケンが、構造を静かに見ています…',
  mina: 'ミナが、今の気持ちを受け止めています…',
  satou: 'サトウが、現実の足場を確かめています…',
};

// Mode-aware mock responses per agent.
// flash: short and direct. dialogue: reflective and open. deep: introspective.
const AGENT_RESPONSES: Record<UniversalAgentId, Record<UniversalModeId, string>> = {
  ray: {
    flash: '言葉になる前の何かが、まだそこにある。',
    dialogue: '言葉になる前の気配を、少しだけ一緒に見てみましょう。急がなくていいです。',
    deep: 'まだ形になっていないものほど、大切なことを含んでいることがあります。その感覚を、消さずに持っていてください。',
  },
  joe: {
    flash: 'まだ消えていない一点がある。それを無視しなくていい。',
    dialogue: 'まだ消えていない一点があるなら、そこを無視しなくていいと思う。どんな形で残っていますか？',
    deep: '何かが引っかかり続けているとき、それはまだ終わっていないサインかもしれない。焦って答えを出さなくていい。',
  },
  ken: {
    flash: '感情・判断・次にすること、が混ざっています。',
    dialogue: 'まず、今の話には「感情」と「判断」と「次にすること」が混ざっていそうです。少し分けてみましょう。',
    deep: '複数のことが同時に動いているとき、まず何が何かを静かに見分けることから始めると、次の一手が見えてきます。',
  },
  mina: {
    flash: '急いで整えなくて大丈夫。',
    dialogue: '急いで整えなくても大丈夫です。今は、そのまま置いておける場所を作りましょう。',
    deep: 'うまく言葉にできないことも、感じていることは本物です。今ここにある気持ちを、そのまま受け取ります。',
  },
  satou: {
    flash: '一つだけ確認するとしたら、何ですか？',
    dialogue: '現実の足場として、まず一つだけ確認するとしたら何でしょう。小さくていいです。',
    deep: '大きなことを一度に変えなくていい。今日、一つだけ動かせることを見つけることが、一番確かな前進です。',
  },
  mirror: {
    flash: 'ここまでの言葉が、映っています。',
    dialogue: 'ここまでの言葉を映すと、まだ形になっていない感覚が残っているように見えます。',
    deep: 'ここまで話してきたことの中に、あなた自身がまだ気づいていない何かが、静かに宿っているように感じます。',
  },
  // delegate is resolved before this function is called; fallback only.
  delegate: {
    flash: '...',
    dialogue: '...',
    deep: '...',
  },
};

// Returns a mode-aware mock reply for the given agent.
export function createUniversalAgentReply(
  agentId: UniversalAgentId,
  userText: string,
  modeId: UniversalModeId = 'dialogue',
): string {
  if (agentId === 'mirror') {
    return createMirrorReply(userText, modeId);
  }
  return AGENT_RESPONSES[agentId]?.[modeId] ?? '言葉を、少し一緒に見てみましょう。';
}

// 心の鏡: summarise from userText with mode awareness.
export function createMirrorReply(lastText: string, modeId: UniversalModeId = 'dialogue'): string {
  const short = shorten(lastText);
  switch (modeId) {
    case 'flash':
      return `「${short}」、映っています。`;
    case 'deep':
      return `「${short}」という言葉の奥に、まだ触れていない感覚が静かに残っています。`;
    default:
      return `ここまで聞いていると、「${short}」という言葉がまだ揺れているように感じます。決めつけずに、そのまま見てみましょう。`;
  }
}

// 心の鏡 summary response using the full message history.
export function createMirrorSummaryReply(
  userMessages: string[],
  modeId: UniversalModeId = 'dialogue',
): string {
  if (userMessages.length < 2) {
    return 'まずはもう少し言葉を置いても大丈夫です。';
  }
  return createMirrorReply(userMessages[userMessages.length - 1], modeId);
}

// Selects a real agent when "delegate" mode is active.
// Replace with pickContextualAgent logic in Phase 3.
export function pickUniversalDelegatedAgent(_userText: string): UniversalAgentId {
  const pool: UniversalAgentId[] = ['ray', 'joe', 'ken', 'mina', 'satou'];
  return pool[Math.floor(Math.random() * pool.length)];
}
