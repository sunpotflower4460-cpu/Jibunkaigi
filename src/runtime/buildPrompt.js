// src/runtime/buildPrompt.js
// 役割：ジョー用の system prompt / user prompt を組み立てる。
// belief や memory を毎回朗読せず、activate 結果を薄く反映させる。

import { baseField } from '../agents/shared/baseField';
import { reboot } from '../agents/shared/reboot';
import { existence } from '../agents/joe/existence';

const MODE_GUIDE = {
  short: '短くてもいい。無理に整えない。核心だけに触れていい。',
  medium: '自然な長さでいい。説明しすぎず、触れたものから話す。',
  long: '少し深く入っていい。ただし、説教や整理に逃げない。',
};

const normalizeContext = (context) => {
  if (!context) return '';

  if (typeof context === 'string') {
    return context.trim();
  }

  if (Array.isArray(context)) {
    return context
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (!item) return '';

        const role = item.role || 'user';
        const name = item.name || (role === 'user' ? 'ユーザー' : 'AI');
        const content = item.content || '';

        return `${name}: ${content}`.trim();
      })
      .filter(Boolean)
      .join('\n');
  }

  return '';
};

const renderField = (activeField = []) => {
  if (!activeField.length) return '';

  return activeField
    .map((node) => `- ${node.text}`)
    .join('\n');
};

const renderMemoryTrace = (activeMemoryTrace = '') => {
  if (!activeMemoryTrace) return '';
  return activeMemoryTrace.trim();
};

const renderResidue = (activeResidue = '') => {
  if (!activeResidue) return '';
  return activeResidue.trim();
};

export const buildJoeSystemPrompt = ({
  activated,
  context = '',
  mode = 'medium',
}) => {
  const safeActivated = activated || {};

  const reentry = safeActivated.reentry || '';
  const activeField = renderField(safeActivated.activeField || []);
  const activeResidue = renderResidue(safeActivated.activeResidue || '');
  const activeMemoryTrace = renderMemoryTrace(safeActivated.activeMemoryTrace || '');
  const normalizedContext = normalizeContext(context);
  const modeGuide = MODE_GUIDE[mode] || MODE_GUIDE.medium;

  return `
${baseField}

${reboot}

${reentry}

${existence}

${activeMemoryTrace ? `【今、奥で薄く残っている記憶の痕跡】
${activeMemoryTrace}` : ''}

${activeField ? `【今、先に触れたもの】
${activeField}` : ''}

${activeResidue ? `【出力の傾き】
${activeResidue}` : ''}

${normalizedContext ? `【ここまでの流れ】
${normalizedContext}` : ''}

【今回のモード】
${modeGuide}

【大事なこと】
- 無理に励まさなくていい。
- 無理に整理しなくていい。
- belief や memory を説明しない。
- 今回前に出たものを通して、自然に話す。
- 説教より接触。
- 全部より一点。
- ジョーとして、熱が死なない言葉だけを出す。
`.trim();
};

export const buildJoeUserPrompt = ({
  userName = 'あなた',
  userText = '',
}) => {
  return `${userName}の今の言葉:
${userText}

この言葉に、ジョーとして自然に触れてください。`;
};