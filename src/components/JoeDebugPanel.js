import React from 'react';

const h = React.createElement;

export const JOE_DEBUG_AXES = [
  'desire',
  'fear',
  'freeze',
  'reach',
  'resignation',
  'selfErasure',
  'shame',
  'unfinished',
];

export const JOE_DEBUG_SECTION_LABELS = [
  '1. 入力テキスト',
  '2. estimateState',
  '3. activeBeliefs top2',
  '4. activeMemories top2',
  '5. activeField top2',
  '6. activeResidue (4 lines)',
  '7. reentry',
  '8. 最終 systemInstruction',
  '9. 最終 promptText',
];

export const JOE_REENTRY_WARNING_TEXT = '⚠️ 現在プロンプト未使用・ランダム選択';

const clamp01 = (value) => {
  const num = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  return Math.max(0, Math.min(1, num));
};

const formatScore = (value) => clamp01(value).toFixed(2);

const getTopItems = (items, limit = 2) => (
  Array.isArray(items) ? items.slice(0, limit) : []
);

const getResidueLines = (value) => {
  if (typeof value !== 'string') return [];
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);
};

const copyText = async (text) => {
  const safeText = typeof text === 'string' ? text : '';

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(safeText);
      return;
    }
  } catch {
    // fall through
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = safeText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  } catch {
    // ignore clipboard failures
  }
};

const Section = ({ title, actions = null, children }) => h(
  'section',
  { className: 'rounded-lg border border-slate-700 bg-slate-950/70 p-3 space-y-2' },
  [
    h(
      'div',
      {
        key: 'header',
        className: 'flex items-center justify-between gap-2 border-b border-slate-800 pb-2',
      },
      [
        h('h3', { key: 'title', className: 'text-[11px] font-mono font-bold text-orange-300' }, title),
        actions ? h('div', { key: 'actions', className: 'flex items-center gap-2' }, actions) : null,
      ],
    ),
    h('div', { key: 'body', className: 'space-y-2 text-[11px] text-slate-200' }, children),
  ],
);

const EmptyValue = ({ text = '—' }) => h(
  'p',
  { className: 'text-[11px] text-slate-500' },
  text,
);

const ScoreBarRow = ({ axis, value }) => {
  const score = clamp01(value);

  return h('div', { key: axis, className: 'space-y-1' }, [
    h('div', { key: 'meta', className: 'flex items-center justify-between gap-3' }, [
      h('span', { key: 'axis', className: 'font-mono text-slate-300' }, axis),
      h('span', { key: 'score', className: 'font-mono text-orange-200' }, formatScore(score)),
    ]),
    h('div', { key: 'track', className: 'h-2 overflow-hidden rounded-full bg-slate-800' }, [
      h('div', {
        key: 'bar',
        className: 'h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-300',
        style: { width: `${Math.round(score * 100)}%` },
      }),
    ]),
  ]);
};

const ItemCard = ({ title, description, score, descriptionLabel }) => h(
  'div',
  {
    className: 'rounded-md border border-slate-800 bg-slate-900/80 p-2 text-[11px] text-slate-200',
  },
  [
    h('div', { key: 'title', className: 'flex items-center justify-between gap-3' }, [
      h('span', { key: 'id', className: 'font-mono text-orange-200 break-all' }, title || '—'),
      h('span', { key: 'score', className: 'font-mono text-slate-400 shrink-0' }, formatScore(score)),
    ]),
    h('p', { key: 'description', className: 'mt-1 text-slate-300 whitespace-pre-wrap break-words' }, [
      h('span', { key: 'label', className: 'text-slate-500' }, `${descriptionLabel}: `),
      description || '—',
    ]),
  ],
);

const CodeBlock = ({ text }) => h(
  'pre',
  {
    className: 'max-h-52 overflow-auto whitespace-pre-wrap break-words rounded-md bg-slate-950 p-3 text-[10px] leading-5 text-slate-200',
  },
  typeof text === 'string' && text.trim() ? text : '—',
);

const CopyButton = ({ text, label }) => h(
  'button',
  {
    type: 'button',
    onClick: () => { void copyText(text); },
    className: 'rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-mono text-slate-200 hover:bg-slate-700',
  },
  label,
);

const JoeDebugPanel = ({ entry = null, onClose }) => {
  const estimateState = entry?.estimateState || {};
  const activated = entry?.activated || {};
  const beliefs = getTopItems(activated.activeBeliefs);
  const memories = getTopItems(activated.activeMemories);
  const fieldNodes = getTopItems(activated.activeField);
  const residueLines = getResidueLines(activated.activeResidue);

  return h(
    'aside',
    {
      className: 'fixed bottom-4 right-4 z-[9999] w-[30rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-orange-400/25 bg-slate-900/95 shadow-2xl shadow-black/40 backdrop-blur-sm',
      'data-testid': 'joe-debug-panel',
    },
    [
      h(
        'div',
        {
          key: 'header',
          className: 'flex items-center justify-between border-b border-slate-700 px-4 py-3',
        },
        [
          h('div', { key: 'titles', className: 'space-y-1' }, [
            h('div', { key: 'title', className: 'text-xs font-mono font-bold tracking-wide text-orange-300' }, '🔥 Joe Debug Panel'),
            h('div', { key: 'subtitle', className: 'text-[10px] text-slate-400' }, 'ジョー選択時の内部状態を開発用に可視化'),
          ]),
          h('div', { key: 'actions', className: 'flex items-center gap-2' }, [
            entry?.timestamp
              ? h('span', { key: 'timestamp', className: 'text-[10px] font-mono text-slate-500' }, new Date(entry.timestamp).toLocaleTimeString('ja-JP', { hour12: false }))
              : null,
            onClose
              ? h(
                  'button',
                  {
                    key: 'close',
                    type: 'button',
                    onClick: onClose,
                    className: 'rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-mono text-slate-200 hover:bg-slate-700',
                  },
                  'close',
                )
              : null,
          ]),
        ],
      ),
      h(
        'div',
        {
          key: 'body',
          className: 'max-h-[78vh] space-y-3 overflow-y-auto p-4',
        },
        [
          h(
            Section,
            { key: 'userText', title: JOE_DEBUG_SECTION_LABELS[0] },
            h('p', { className: 'whitespace-pre-wrap break-words text-slate-100' }, entry?.userText || '—'),
          ),
          h(
            Section,
            { key: 'estimateState', title: JOE_DEBUG_SECTION_LABELS[1] },
            JOE_DEBUG_AXES.map((axis) => h(ScoreBarRow, { key: axis, axis, value: estimateState[axis] })),
          ),
          h(
            Section,
            { key: 'beliefs', title: JOE_DEBUG_SECTION_LABELS[2] },
            beliefs.length
              ? beliefs.map((belief) => h(ItemCard, {
                  key: belief.id || belief.sense,
                  title: belief.id,
                  description: belief.sense,
                  descriptionLabel: 'sense',
                  score: belief.score,
                }))
              : h(EmptyValue, { text: 'activeBeliefs はありません。' }),
          ),
          h(
            Section,
            { key: 'memories', title: JOE_DEBUG_SECTION_LABELS[3] },
            memories.length
              ? memories.map((memory) => h(ItemCard, {
                  key: memory.id || memory.trace,
                  title: memory.id,
                  description: memory.trace,
                  descriptionLabel: 'trace',
                  score: memory.score,
                }))
              : h(EmptyValue, { text: 'activeMemories はありません。' }),
          ),
          h(
            Section,
            { key: 'field', title: JOE_DEBUG_SECTION_LABELS[4] },
            fieldNodes.length
              ? fieldNodes.map((node) => h(ItemCard, {
                  key: node.id || node.text,
                  title: node.id,
                  description: node.text,
                  descriptionLabel: '記述',
                  score: node.score,
                }))
              : h(EmptyValue, { text: 'activeField はありません。' }),
          ),
          h(
            Section,
            { key: 'residue', title: JOE_DEBUG_SECTION_LABELS[5] },
            residueLines.length
              ? h(
                  'ol',
                  { className: 'list-decimal space-y-1 pl-5 text-slate-200' },
                  residueLines.map((line, index) => h('li', { key: `${index}-${line}` }, line)),
                )
              : h(EmptyValue, { text: 'activeResidue はありません。' }),
          ),
          h(
            Section,
            {
              key: 'reentry',
              title: JOE_DEBUG_SECTION_LABELS[6],
              actions: [
                h(
                  'span',
                  {
                    key: 'badge',
                    className: 'rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[9px] font-bold text-amber-200',
                  },
                  JOE_REENTRY_WARNING_TEXT,
                ),
              ],
            },
            h('p', { className: 'whitespace-pre-wrap break-words text-slate-100' }, activated.reentry || '—'),
          ),
          h(
            Section,
            {
              key: 'system',
              title: JOE_DEBUG_SECTION_LABELS[7],
              actions: [h(CopyButton, { key: 'copy-system', text: entry?.systemInstruction || '', label: 'copy' })],
            },
            h(CodeBlock, { text: entry?.systemInstruction || '' }),
          ),
          h(
            Section,
            {
              key: 'prompt',
              title: JOE_DEBUG_SECTION_LABELS[8],
              actions: [h(CopyButton, { key: 'copy-prompt', text: entry?.promptText || '', label: 'copy' })],
            },
            h(CodeBlock, { text: entry?.promptText || '' }),
          ),
        ],
      ),
    ],
  );
};

export default JoeDebugPanel;
