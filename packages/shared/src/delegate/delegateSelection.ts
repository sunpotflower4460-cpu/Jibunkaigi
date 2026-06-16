// Context-based delegate selection.
//
// This replaces the legacy "character-count remainder" pseudo-random pick
// (see pickMockDelegatedAgent in ../mockReply.ts, kept as @deprecated) with a
// lightweight, deterministic-by-injection scoring model.
//
// Design goals (Phase 1 of jibunkaigi-uiux-vnext-design):
//   - When the user delegates ("委ねる"), the system should *read the room*
//     and choose a concrete voice based on the text + recent context, instead
//     of a meaningless length modulo.
//   - The scoring step (scoreDelegateVoices) is pure and exported so it can be
//     verified deterministically in tests / debugging.
//   - The selection step (pickDelegateByContext) keeps a little serendipity via
//     softmax sampling, but accepts an injectable rng so behaviour can be
//     pinned to fixed values for verification.
//
// NOTE (future safety policy / crisis handling):
//   Some cue patterns below intentionally include self-harm / crisis words
//   ("死にたい" / "消えたい") so that such input is routed toward ミナ (the
//   accepting voice). This is *routing only*. It is NOT a safety mechanism and
//   must not turn this app into a medical / counselling product. When a real
//   safety policy / crisis-handling layer is introduced, these cues should be
//   reconnected to that layer rather than left as pure routing. Keeping the
//   words here lets the future safety design hook in without conflicting with
//   the current routing behaviour.

import { CONCRETE_AGENT_IDS, type ConcreteAgentId } from '../agents';

/**
 * Minimal message shape needed for context scoring. Intentionally decoupled
 * from UniversalMessage so this module stays platform-agnostic (web + mobile)
 * and does not depend on app state types.
 */
export interface DelegateMessageLike {
  role: 'user' | 'agent';
  text: string;
  agentId?: string;
}

export interface PickDelegateOptions {
  /** Injectable random source in [0, 1). Defaults to Math.random. */
  rng?: () => number;
  /** Softmax temperature. Lower = more deterministic. Defaults to 0.6. */
  temperature?: number;
}

/**
 * Cue patterns per concrete agent. Each agent owns a single combined regex so
 * that countMatches can run it with a global flag and sum occurrences.
 */
const CUE_PATTERNS: Record<ConcreteAgentId, RegExp> = {
  // ミナ: accepting / emotional weight. (See crisis-routing note at top.)
  mina: /つら|辛|苦し|悲し|疲れ|しんど|泣|不安|怖|こわ|さみし|寂し|孤独|消えたい|死にたい|もう無理|傷つ/,
  // ケン: structure / untangling / choices.
  ken: /どうすれ|どうしたら|どうやって|整理|迷|わからなく|分からなく|混乱|選択|どっち|比較|計画|優先|前提|条件/,
  // サトウ: reality / footing / cost.
  satou: /お金|金銭|時間|期限|締切|納期|やらなきゃ|やるべき|現実|仕事|責任|逃げ|甘え|リスク|損/,
  // レイ: pre-verbal / intuition / silence. Also the neutral fallback.
  ray: /なんとなく|何となく|うまく言え|言葉にならな|言葉にできな|もやもや|モヤモヤ|気配|曖昧|ぼんやり|沈黙|違和感/,
  // ジョー: the spark that has not gone out / lingering desire.
  joe: /まだ|残って|やりたい|捨てきれ|諦め|あきらめ|悔し|本当は|ほんとは|好き|夢|希望|手放せ/,
};

/**
 * レイ gets a small base score so that in a neutral context (no cues match),
 * the pre-verbal voice is gently favoured rather than picked uniformly.
 */
const RAY_BASE_SCORE = 0.4;

/**
 * If an agent was the most recent concrete speaker, dampen its score so the
 * delegation naturally rotates voices instead of getting stuck.
 */
const INERTIA_PENALTY = 0.5;

function countMatches(pattern: RegExp, text: string): number {
  const globalPattern = new RegExp(pattern.source, 'g');
  const matches = text.match(globalPattern);
  return matches ? matches.length : 0;
}

/**
 * Find the most recent concrete agent that actually spoke, used for the
 * inertia penalty. Returns null when no concrete agent is found.
 */
function findLastConcreteAgent(
  previousMessages: DelegateMessageLike[],
): ConcreteAgentId | null {
  for (let i = previousMessages.length - 1; i >= 0; i -= 1) {
    const msg = previousMessages[i];
    if (msg.role !== 'agent' || !msg.agentId) continue;
    const candidate = msg.agentId as ConcreteAgentId;
    if (CONCRETE_AGENT_IDS.includes(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Pure scoring function. Given the current user text and recent context,
 * returns a non-negative weight per concrete agent.
 *
 * Deterministic: same inputs always produce the same scores, so this is the
 * primary surface for tests / debugging.
 */
export function scoreDelegateVoices(
  userText: string,
  previousMessages: DelegateMessageLike[] = [],
): Record<ConcreteAgentId, number> {
  const text = userText ?? '';
  const lastConcreteAgent = findLastConcreteAgent(previousMessages);

  const scores = {} as Record<ConcreteAgentId, number>;
  for (const id of CONCRETE_AGENT_IDS) {
    let score = id === 'ray' ? RAY_BASE_SCORE : 0;
    score += countMatches(CUE_PATTERNS[id], text);
    if (lastConcreteAgent === id) {
      score *= INERTIA_PENALTY;
    }
    scores[id] = score;
  }

  return scores;
}

/**
 * Pick a concrete agent for a delegated turn based on context.
 *
 * Uses softmax over scoreDelegateVoices, then samples with the injected rng.
 * Inject `rng` (and optionally a low `temperature`) to make behaviour
 * deterministic in tests.
 */
export function pickDelegateByContext(
  userText: string,
  previousMessages: DelegateMessageLike[] = [],
  options: PickDelegateOptions = {},
): ConcreteAgentId {
  const rng = options.rng ?? Math.random;
  const temperature = options.temperature ?? 0.6;

  const scores = scoreDelegateVoices(userText, previousMessages);
  const ids = CONCRETE_AGENT_IDS;

  // Softmax weights. Guard against a non-positive temperature.
  const safeTemperature = temperature > 0 ? temperature : 0.6;
  const weights = ids.map((id) => Math.exp(scores[id] / safeTemperature));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // Degenerate guard: if weights are not usable, fall back to レイ.
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
    return 'ray';
  }

  const threshold = rng() * totalWeight;
  let cumulative = 0;
  for (let i = 0; i < ids.length; i += 1) {
    cumulative += weights[i];
    if (threshold < cumulative) {
      return ids[i];
    }
  }

  // Floating-point edge: return the last id.
  return ids[ids.length - 1];
}
