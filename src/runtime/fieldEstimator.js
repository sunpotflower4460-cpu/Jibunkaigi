const clamp01 = (value) => Math.max(0, Math.min(1, value));

const countMatches = (text, keywords) => keywords.reduce((count, keyword) => count + (text.includes(keyword) ? 1 : 0), 0);

export function estimateField(input) {
  const text = typeof input === 'string' ? input.trim().toLowerCase() : '';

  if (!text) {
    return {
      softness: 0,
      depth: 0,
      urgency: 0,
      fragility: 0,
      playfulness: 0,
    };
  }

  const softnessHits = countMatches(text, ['たい', 'たいけど', 'ちょっと', '最近', 'かな', 'かも', 'できたら', 'やさしく']);
  const depthHits = countMatches(text, ['自信', '怖い', '諦め', '無理', '不安', '作品', '言えない', 'しんどい']);
  const urgencyHits = countMatches(text, ['今すぐ', '早く', 'もう', '限界', '無理', '急ぎ', 'すぐ']);
  const fragilityHits = countMatches(text, ['自信ない', '怖い', 'しんどい', '無理', '諦め', 'つらい', '不安']);
  const playfulnessHits = countMatches(text, ['笑', 'w', '冗談', '遊び', 'ふざけ', 'おもしろ']);

  const softness = clamp01(0.2 + softnessHits * 0.12 - urgencyHits * 0.04 + (text.includes('...') || text.includes('…') ? 0.08 : 0));
  const depth = clamp01(0.15 + depthHits * 0.15 + Math.min(text.length / 120, 0.2));
  const urgency = clamp01(urgencyHits * 0.22 + (text.includes('!') || text.includes('！') ? 0.08 : 0));
  const fragility = clamp01(0.1 + fragilityHits * 0.16 + (text.includes('ない') ? 0.06 : 0));
  const playfulness = clamp01(playfulnessHits * 0.28 - fragilityHits * 0.05);

  return {
    softness,
    depth,
    urgency,
    fragility,
    playfulness,
  };
}
