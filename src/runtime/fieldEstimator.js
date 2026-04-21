const clamp01 = (value) => Math.max(0, Math.min(1, value));

const countMatches = (text, keywords) => keywords.reduce((count, keyword) => count + (text.includes(keyword) ? 1 : 0), 0);

export function estimateField(input, options = {}) {
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
  const depthHitsExtra = countMatches(text, ['何のため', '意味', '目的', '分からなくなる', 'わからなくなる', '以前は', '昔は', '前は', '変わった', '失った']);
  const urgencyHits = countMatches(text, ['今すぐ', '早く', 'もう', '限界', '無理', '急ぎ', 'すぐ']);
  const fragilityHits = countMatches(text, ['自信ない', '怖い', 'しんどい', '無理', '諦め', 'つらい', '不安']);
  const fragilityHitsExtra = countMatches(text, ['困って', '悩んで', '迷って', '湧かない', '出ない', '分からない', 'わからない']);
  const playfulnessHits = countMatches(text, ['笑', 'w', '冗談', '遊び', 'ふざけ', 'おもしろ']);
  const softnessHitsExtra = countMatches(text, ['アドバイス', '教えて', 'いただけ', 'もらえ', 'ですか']);

  const ellipsisBonus = text.includes('...') || text.includes('…') ? 0.08 : 0;
  const softnessBase = clamp01(
    0.2 +
    softnessHits * 0.12 +
    softnessHitsExtra * 0.06 -
    urgencyHits * 0.04 +
    ellipsisBonus
  );
  const depthBase = clamp01(0.15 + depthHits * 0.15 + depthHitsExtra * 0.1 + Math.min(text.length / 120, 0.2));
  const urgency = clamp01(urgencyHits * 0.22 + (text.includes('!') || text.includes('！') ? 0.08 : 0));
  const fragilityBase = clamp01(0.1 + fragilityHits * 0.16 + fragilityHitsExtra * 0.08 + (text.includes('ない') ? 0.06 : 0));
  const playfulness = clamp01(playfulnessHits * 0.28 - fragilityHits * 0.05);
  const microSignals = options.microSignals || {};
  const hesitation = microSignals?.punctuation?.hesitation ?? 0;
  const trailOff = microSignals?.punctuation?.trailOff ?? 0;
  const epistemicLowering = microSignals?.selfHedging?.epistemicLowering ?? 0;
  const burstiness = microSignals?.sentenceLength?.burstiness ?? 0;
  const softness = clamp01(softnessBase + hesitation * 0.08 + trailOff * 0.06 + epistemicLowering * 0.05);
  const fragility = clamp01(fragilityBase + hesitation * 0.06 + epistemicLowering * 0.05);
  const depth = clamp01(depthBase + trailOff * 0.04 + burstiness * 0.03);

  return {
    softness,
    depth,
    urgency,
    fragility,
    playfulness,
  };
}
