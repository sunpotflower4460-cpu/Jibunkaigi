// Mock agent replies for Phase 2 local conversation.
// These are placeholder responses only — not real AI output.
// Replace with Gemini Proxy calls in Phase 3.

import type { MobileAgentId } from '../state/mobileTypes';

function shorten(text: string, maxLen = 24): string {
  const trimmed = text.trim();
  return trimmed.length <= maxLen ? trimmed : trimmed.slice(0, maxLen) + '…';
}

// Returns a deterministic-ish mock reply for the given agent.
export function createMockAgentReply(agentId: MobileAgentId, userText: string): string {
  switch (agentId) {
    case 'mirror':
      return `ここまでの言葉を映すと、「${shorten(userText)}」の奥に、まだ形になっていない感覚が残っているように見えます。`;
    case 'joe':
      return 'まだ消えていない一点があるなら、そこを無視しなくていいと思う。';
    case 'ken':
      return 'まず、今の話には「感情」と「判断」と「次にすること」が混ざっていそうです。';
    case 'mina':
      return '急いで整えなくても大丈夫です。今は、そのまま置いておける場所を作りましょう。';
    case 'satou':
      return '現実の足場として、まず一つだけ確認するとしたら何でしょう。';
    case 'tom':
      return 'その重さ、握りしめているだけかもしれません。視点を一つ変えたら、どう見えるでしょう。';
    case 'fio':
      return '今、体はどんな感じでしょう。息や、足の裏の感覚に、少しだけ意識を向けてみませんか。';
    case 'ray':
    default:
      return '言葉になる前の気配を、少しだけ一緒に見てみましょう。';
  }
}

// Selects a real agent when "delegate" mode is active.
// Replace with pickContextualAgent logic in Phase 3.
export function pickMockDelegatedAgent(_userText: string): MobileAgentId {
  const pool: MobileAgentId[] = ['ray', 'joe', 'ken', 'mina', 'satou', 'tom', 'fio'];
  return pool[Math.floor(Math.random() * pool.length)];
}

// Agent display labels.
export const AGENT_LABELS: Record<MobileAgentId, string> = {
  mirror: '心の鏡',
  delegate: '委ねる',
  ray: 'レイ',
  joe: 'ジョー',
  ken: 'ケン',
  mina: 'ミナ',
  satou: 'サトウ',
  tom: 'トム',
  fio: 'フィオ',
};

// Thinking indicator text per agent.
export const AGENT_THINKING_TEXT: Record<MobileAgentId, string> = {
  mirror: '心の鏡が、ここまでの声を映しています…',
  delegate: '場に合う視点を探しています…',
  ray: 'レイが、言葉になる前の気配を見ています…',
  joe: 'ジョーが、まだ消えていない一点を見ています…',
  ken: 'ケンが、構造を静かに見ています…',
  mina: 'ミナが、今の気持ちを受け止めています…',
  satou: 'サトウが、現実の足場を確かめています…',
  tom: 'トムが、ひとつ上から眺めています…',
  fio: 'フィオが、体の声に耳を澄ませています…',
};

// Mirror (心の鏡) summary response logic.
export function createMirrorSummaryReply(userMessages: string[]): string {
  if (userMessages.length < 2) {
    return 'まずはもう少し言葉を置いても大丈夫です。';
  }
  const lastText = userMessages[userMessages.length - 1];
  return `ここまで聞いていると、「${shorten(lastText, 20)}」という言葉が、まだ揺れているように感じます。決めつけずに、そのまま見てみましょう。`;
}
