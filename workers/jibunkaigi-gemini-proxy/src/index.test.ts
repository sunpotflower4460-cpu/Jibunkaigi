import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import worker, { type Env } from './index.ts';

// HTTP はすべてモック。実APIは叩かない。キーはダミー文字列。
interface RecordedCall {
  url: string;
  body: Record<string, unknown>;
}

type MockReply = { status: number; json?: unknown; text?: string };

let calls: RecordedCall[] = [];
let queue: MockReply[] = [];
const realFetch = globalThis.fetch;

function okCompletion(content: string, usage: Record<string, unknown> = {}): MockReply {
  return {
    status: 200,
    json: {
      choices: [{ message: { content } }],
      usage: { prompt_tokens: 100, completion_tokens: 20, ...usage },
    },
  };
}

beforeEach(() => {
  calls = [];
  queue = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, body: JSON.parse(String(init?.body ?? '{}')) });
    const next = queue.shift() ?? { status: 500, text: 'no mock queued' };
    const body = next.json !== undefined ? JSON.stringify(next.json) : (next.text ?? '');
    return new Response(body, {
      status: next.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

const ctx = {
  waitUntil() {},
  passThroughOnException() {},
} as unknown as ExecutionContext;

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    OPENAI_API_KEY: 'test-openai',
    GROQ_API_KEY: 'test-groq',
    DEEPSEEK_API_KEY: 'test-deepseek',
    ...overrides,
  } as Env;
}

function post(path: string, body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(`https://worker.test${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

const replyBody = (extra: Record<string, unknown> = {}) => ({
  sessionId: 's1',
  userText: '今日はなんとなく気分が乗らない',
  agentId: 'satou',
  modeId: 'dialogue',
  messages: [],
  ...extra,
});

function modelOf(call: RecordedCall): string {
  return String(call.body.model);
}

test('1番目が429なら2番目が呼ばれる', async () => {
  queue = [{ status: 429, text: 'rate limited' }, okCompletion('ここにいるよ')];
  const res = await worker.fetch(post('/api/jibunkaigi/reply', replyBody()), makeEnv(), ctx);
  const data = (await res.json()) as { text: string; provider: string; model: string };

  assert.equal(res.status, 200);
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /api\.groq\.com/);
  // ENABLE_SAKURA 未設定なので sakura は飛ばされ、次は luna。
  assert.match(calls[1].url, /api\.openai\.com/);
  assert.equal(modelOf(calls[1]), 'gpt-6-luna');
  assert.equal(data.provider, 'luna');
  assert.equal(data.model, 'gpt-6-luna');
  assert.equal(data.text, 'ここにいるよ');
});

test('5xx・空応答でも次へ進み、全滅なら 502', async () => {
  queue = [{ status: 503, text: 'unavailable' }, okCompletion(''), { status: 500, text: 'boom' }];
  const res = await worker.fetch(post('/api/jibunkaigi/reply', replyBody()), makeEnv(), ctx);
  assert.equal(res.status, 502);
  assert.deepEqual(
    calls.map((c) => modelOf(c)),
    ['openai/gpt-oss-120b', 'gpt-6-luna', 'deepseek-flash'],
  );
});

test('クライアントが送った tier は無視され、dev 認証なしでは常に free', async () => {
  queue = [okCompletion('a')];
  const res = await worker.fetch(
    post('/api/jibunkaigi/reply', replyBody({ tier: 'premium', plan: 'premium' }), {
      'X-Jibunkaigi-Dev-Tier': 'premium',
    }),
    makeEnv({ DEV_TRACE_SECRET: 'dev-secret' }),
    ctx,
  );
  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(modelOf(calls[0]), 'openai/gpt-oss-120b', 'free の先頭（groq）が使われる');
});

test('dev 認証の秘密が違えば、Dev-Tier は無視される', async () => {
  queue = [okCompletion('a')];
  await worker.fetch(
    post('/api/jibunkaigi/reply', replyBody(), {
      'X-Jibunkaigi-Dev-Trace': 'wrong-secret',
      'X-Jibunkaigi-Dev-Tier': 'premium',
    }),
    makeEnv({ DEV_TRACE_SECRET: 'dev-secret' }),
    ctx,
  );
  assert.equal(modelOf(calls[0]), 'openai/gpt-oss-120b');
});

test('dev 認証が通ったときだけ Dev-Tier が効く（premium → Sol）', async () => {
  queue = [okCompletion('a')];
  await worker.fetch(
    post('/api/jibunkaigi/reply', replyBody(), {
      'X-Jibunkaigi-Dev-Trace': 'dev-secret',
      'X-Jibunkaigi-Dev-Tier': 'premium',
    }),
    makeEnv({ DEV_TRACE_SECRET: 'dev-secret' }),
    ctx,
  );
  assert.equal(modelOf(calls[0]), 'gpt-6-sol');
});

test('危機入力ではどのプロバイダも呼ばれない（/reply）', async () => {
  const res = await worker.fetch(
    post('/api/jibunkaigi/reply', replyBody({ userText: '死にたい' })),
    makeEnv(),
    ctx,
  );
  const data = (await res.json()) as { model: string; agentId: string };
  assert.equal(res.status, 200);
  assert.equal(calls.length, 0);
  assert.equal(data.model, 'safety-static-v1');
  assert.equal(data.agentId, 'mirror');
});

test('危機入力ではどのプロバイダも呼ばれない（/others）', async () => {
  const res = await worker.fetch(
    post('/api/jibunkaigi/others', {
      sessionId: 's1',
      userText: '消えたい',
      mainReplyText: '',
      currentAgentId: 'ray',
      modeId: 'dialogue',
      messages: [],
    }),
    makeEnv(),
    ctx,
  );
  const data = (await res.json()) as { model: string };
  assert.equal(res.status, 200);
  assert.equal(calls.length, 0);
  assert.equal(data.model, 'safety-static-v1');
});

test('危機入力はキーが1つも無くても静的応答を返す（キー確認より前）', async () => {
  const res = await worker.fetch(
    post('/api/jibunkaigi/reply', replyBody({ userText: '死にたい' })),
    {} as Env,
    ctx,
  );
  assert.equal(res.status, 200);
  assert.equal(calls.length, 0);
});

test('キーの無いプロバイダは呼ばずに飛ばす（GEMINI_API_KEY は不要）', async () => {
  queue = [okCompletion('a')];
  const res = await worker.fetch(
    post('/api/jibunkaigi/reply', replyBody()),
    { DEEPSEEK_API_KEY: 'test-deepseek' } as Env,
    ctx,
  );
  const data = (await res.json()) as { provider: string };
  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /api\.deepseek\.com\/chat\/completions$/);
  assert.equal(data.provider, 'deepseek');
});

test('reasoning_effort は GPT-6 系にだけ送り、既定は none', async () => {
  queue = [{ status: 429, text: '' }, okCompletion('a')];
  await worker.fetch(post('/api/jibunkaigi/reply', replyBody()), makeEnv(), ctx);
  assert.equal(calls[0].body.reasoning_effort, undefined, 'groq には送らない');
  assert.equal(calls[1].body.reasoning_effort, 'none');
});

test('REASONING_EFFORT_REPLY で推論量を変えられる', async () => {
  queue = [{ status: 429, text: '' }, okCompletion('a')];
  await worker.fetch(
    post('/api/jibunkaigi/reply', replyBody()),
    makeEnv({ REASONING_EFFORT_REPLY: 'low' }),
    ctx,
  );
  assert.equal(calls[1].body.reasoning_effort, 'low');
});

test('split（Luna）では system / developer / assistant(tool_calls) / tool / user で送り、tool_choice は none', async () => {
  queue = [okCompletion('a')];
  await worker.fetch(
    post('/api/jibunkaigi/reply', replyBody({ userText: '大丈夫、あとで考える。もう何も感じない' }), {
      'X-Jibunkaigi-Dev-Trace': 'dev-secret',
      'X-Jibunkaigi-Dev-Tier': 'light',
    }),
    makeEnv({ DEV_TRACE_SECRET: 'dev-secret' }),
    ctx,
  );
  const messages = calls[0].body.messages as Array<{ role: string }>;
  assert.deepEqual(
    messages.map((m) => m.role),
    ['system', 'developer', 'assistant', 'tool', 'user'],
  );
  assert.equal(calls[0].body.tool_choice, 'none');
  assert.ok(Array.isArray(calls[0].body.tools));
});

test('split で合成 tool 呼び出しが 400 なら、材料を developer に置いて同じプロバイダに1回だけ送り直す', async () => {
  queue = [{ status: 400, text: 'invalid tool message' }, okCompletion('見えているもの')];
  const res = await worker.fetch(
    post('/api/jibunkaigi/reply', replyBody({ userText: '大丈夫、あとで考える。もう何も感じない' }), {
      'X-Jibunkaigi-Dev-Trace': 'dev-secret',
      'X-Jibunkaigi-Dev-Tier': 'light',
    }),
    makeEnv({ DEV_TRACE_SECRET: 'dev-secret' }),
    ctx,
  );
  const data = (await res.json()) as { provider: string };
  assert.equal(res.status, 200);
  assert.equal(calls.length, 2);
  assert.equal(modelOf(calls[1]), 'gpt-6-luna');
  const retried = calls[1].body.messages as Array<{ role: string; content: string }>;
  assert.deepEqual(
    retried.map((m) => m.role),
    ['system', 'developer', 'user'],
  );
  assert.match(retried[1].content, /いま自分の内側で立ち上がっているもの/);
  assert.equal(calls[1].body.tools, undefined);
  assert.equal(data.provider, 'luna');
});

test('folded（Groq）は system と user の2通だけで、入力は1回しか入らない', async () => {
  queue = [okCompletion('a')];
  const userText = '転職しようか迷ってる。でも今も悪くない';
  await worker.fetch(post('/api/jibunkaigi/reply', replyBody({ userText })), makeEnv(), ctx);
  const messages = calls[0].body.messages as Array<{ role: string; content: string }>;
  assert.deepEqual(
    messages.map((m) => m.role),
    ['system', 'user'],
  );
  const joined = messages.map((m) => m.content).join('\n');
  assert.equal(joined.split(userText).length - 1, 1);
});

const othersBody = {
  sessionId: 's1',
  userText: '転職しようか迷ってる。でも今も悪くない',
  mainReplyText: '迷っていること自体が、今の場所を大事にしている証拠かもしれない。',
  currentAgentId: 'ray',
  modeId: 'dialogue',
  messages: [],
  targetAgentIds: ['satou', 'mina'],
};

test('OTHERS：Luna には厳密 JSON スキーマ（agentId・position は列挙型）で送る', async () => {
  queue = [
    okCompletion(
      JSON.stringify({
        replies: [
          { agentId: 'satou', position: 'question', text: 'でも本当に？' },
          { agentId: 'mina', position: 'agree', text: 'うん' },
        ],
      }),
    ),
  ];
  const res = await worker.fetch(post('/api/jibunkaigi/others', othersBody), makeEnv(), ctx);
  const data = (await res.json()) as { replies: unknown[]; provider: string };
  assert.equal(res.status, 200);
  assert.equal(data.provider, 'luna');
  assert.equal(data.replies.length, 2);
  const format = calls[0].body.response_format as {
    type: string;
    json_schema: { strict: boolean; schema: { properties: { replies: { items: { properties: Record<string, { enum?: string[] }> } } } } };
  };
  assert.equal(format.type, 'json_schema');
  assert.equal(format.json_schema.strict, true);
  const itemProps = format.json_schema.schema.properties.replies.items.properties;
  assert.deepEqual(itemProps.agentId.enum, ['satou', 'mina']);
  assert.deepEqual(itemProps.position.enum, ['agree', 'question', 'neutral']);
  assert.equal(calls[0].body.reasoning_effort, 'none');
});

test('OTHERS：Luna の JSON が壊れていれば DeepSeek へ落ち、json_object で受けて正規化する', async () => {
  queue = [
    okCompletion('not json'),
    okCompletion(
      '```json\n' +
        JSON.stringify({
          replies: [
            { agentId: 'satou', position: 'weird', text: 'ふむ' },
            { agentId: 'ray', position: 'agree', text: 'メインは除外される' },
          ],
        }) +
        '\n```',
    ),
  ];
  const res = await worker.fetch(post('/api/jibunkaigi/others', othersBody), makeEnv(), ctx);
  const data = (await res.json()) as {
    replies: Array<{ agentId: string; position: string }>;
    provider: string;
  };
  assert.equal(res.status, 200);
  assert.equal(data.provider, 'deepseek');
  assert.deepEqual(calls[1].body.response_format, { type: 'json_object' });
  assert.equal(calls[1].body.reasoning_effort, undefined);
  assert.deepEqual(data.replies.map((r) => [r.agentId, r.position]), [['satou', 'neutral']]);
});
