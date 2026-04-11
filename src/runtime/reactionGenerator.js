const clamp01 = (value) => Math.max(0, Math.min(1, value));

const countMatches = (text, keywords) => keywords.reduce((count, keyword) => count + (text.includes(keyword) ? 1 : 0), 0);

export function generateReaction(input, field = {}) {
  const text = typeof input === 'string' ? input.trim().toLowerCase() : '';
  const softness = field.softness ?? 0;
  const depth = field.depth ?? 0;
  const urgency = field.urgency ?? 0;
  const fragility = field.fragility ?? 0;
  const playfulness = field.playfulness ?? 0;

  const hesitationHits = countMatches(text, ['けど', 'でも', 'のに', 'まだ', 'ちょっと']);
  const questionHits = countMatches(text, ['?', '？', 'どう', 'なぜ', 'なんで']);
  const vulnerabilityHits = countMatches(text, ['怖い', '無理', '自信ない', '諦め', 'しんどい', '動けない']);

  const touched = clamp01(0.15 + depth * 0.35 + softness * 0.15 + vulnerabilityHits * 0.12);
  const protect = clamp01(0.1 + fragility * 0.45 + urgency * 0.15 + vulnerabilityHits * 0.12);
  const clarify = clamp01(0.08 + urgency * 0.22 + questionHits * 0.2 + hesitationHits * 0.08);
  const curiosity = clamp01(0.12 + depth * 0.18 + playfulness * 0.22 + questionHits * 0.18);
  const holdBackJudgment = clamp01(0.18 + fragility * 0.3 + softness * 0.15 + hesitationHits * 0.1);

  return {
    touched,
    protect,
    clarify,
    curiosity,
    holdBackJudgment,
  };
}
