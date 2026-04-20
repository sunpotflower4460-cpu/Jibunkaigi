import { FORMAL_SIGNAL_PATTERNS } from './linguistics/japanesePatterns.js';

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));
const TRAILING_SOFT_END_WEIGHT = 0.18;
const MISSING_TERMINAL_PUNCTUATION_WEIGHT = 0.12;
const FILLER_DENSITY_MULTIPLIER = 1.5;
const SHORT_SENTENCE_THRESHOLD = 8;
const ABRUPT_CHANGE_THRESHOLD = 10;

export const zeroMicroSignals = () => ({
  punctuation: {
    assertion: 0,
    hesitation: 0,
    trailOff: 0,
  },
  fillers: {
    fillerDensity: 0,
  },
  negationPrefix: {
    softNegation: 0,
  },
  sentenceLength: {
    burstiness: 0,
    shortnessPressure: 0,
  },
  selfHedging: {
    epistemicLowering: 0,
  },
  quotation: {
    distancing: 0,
  },
});

const countMatches = (text, pattern) => {
  if (!text || !(pattern instanceof RegExp)) return 0;
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  return [...text.matchAll(new RegExp(pattern.source, flags))].length;
};

const splitSentences = (text) => (
  text
    .split(/[。！？!?\n]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
);

const countWeightedMatches = (text, patterns) => (
  patterns.reduce((total, { pattern, weight = 0 }) => total + (countMatches(text, pattern) * weight), 0)
);

const detectPunctuation = (text, sentences) => {
  const sentenceCount = Math.max(sentences.length, 1);
  const trimmedText = text.trim();
  const exclamations = countMatches(text, /[！!]/g);
  const questions = countMatches(text, /[？?]/g);
  const ellipses = countMatches(text, /(?:…|\.{3,})/g);
  const punctuationWeight = countWeightedMatches(text, FORMAL_SIGNAL_PATTERNS.punctuation);
  const trailingSoftEnd = /(?:…|\.{3,}|[、,\-―〜])\s*$/.test(trimmedText) ? TRAILING_SOFT_END_WEIGHT : 0;
  const missingSentenceStop = trimmedText && !/[。！？!?」』]$/.test(trimmedText)
    ? MISSING_TERMINAL_PUNCTUATION_WEIGHT
    : 0;

  return {
    assertion: clamp01((exclamations * 0.5) / Math.max(1, sentenceCount * 0.75)),
    hesitation: clamp01(((questions * 0.35) + (ellipses * 0.28) + (punctuationWeight * 0.14)) / sentenceCount),
    trailOff: clamp01(((ellipses * 0.52) / sentenceCount) + trailingSoftEnd + missingSentenceStop),
  };
};

const detectFillers = (text, sentences) => {
  const weightedHits = countWeightedMatches(text, FORMAL_SIGNAL_PATTERNS.fillers);
  const clauseCount = Math.max(
    sentences.length,
    text.split(/[、,\s]+/).map((part) => part.trim()).filter(Boolean).length / 4,
    1,
  );

  return {
    fillerDensity: clamp01((weightedHits * FILLER_DENSITY_MULTIPLIER) / clauseCount),
  };
};

const detectNegationPrefix = (text, sentences) => ({
  softNegation: clamp01(
    countWeightedMatches(text, FORMAL_SIGNAL_PATTERNS.negationPrefix) / Math.max(sentences.length, 1),
  ),
});

const detectSentenceLength = (text, sentences) => {
  if (!sentences.length) {
    return {
      burstiness: 0,
      shortnessPressure: 0,
    };
  }

  const lengths = sentences.map((sentence) => sentence.replace(/\s+/g, '').length);
  const average = lengths.reduce((sum, value) => sum + value, 0) / lengths.length;
  const variance = lengths.reduce((sum, value) => sum + ((value - average) ** 2), 0) / lengths.length;
  const shortSegments = lengths.filter((length) => length <= SHORT_SENTENCE_THRESHOLD).length;
  const consecutiveShortPairs = lengths.slice(1).reduce(
    (count, length, index) => count + (
      (length <= SHORT_SENTENCE_THRESHOLD && lengths[index] <= SHORT_SENTENCE_THRESHOLD) ? 1 : 0
    ),
    0,
  );
  const abruptChanges = lengths.slice(1).reduce(
    (count, length, index) => count + (Math.abs(length - lengths[index]) >= ABRUPT_CHANGE_THRESHOLD ? 1 : 0),
    0,
  );
  const trailingFragment = /(?:[、,\-―〜]|…|\.\.\.)\s*$/.test(text) ? 0.12 : 0;

  return {
    burstiness: clamp01(
      (Math.sqrt(variance) / Math.max(average, 1)) * 0.7 + (abruptChanges / Math.max(lengths.length - 1, 1)) * 0.35,
    ),
    shortnessPressure: clamp01(
      ((shortSegments / lengths.length) * 0.6) +
      ((consecutiveShortPairs / Math.max(lengths.length - 1, 1)) * 0.35) +
      (average <= ABRUPT_CHANGE_THRESHOLD ? 0.15 : 0) +
      trailingFragment,
    ),
  };
};

const detectSelfHedging = (text, sentences) => ({
  epistemicLowering: clamp01(
    countWeightedMatches(text, FORMAL_SIGNAL_PATTERNS.selfHedging) / Math.max(sentences.length, 1),
  ),
});

const detectQuotation = (text, sentences) => {
  const quoteWeight = countWeightedMatches(text, FORMAL_SIGNAL_PATTERNS.quotation);
  const distanceMarkerCount = countMatches(text, /(?:って|とか|みたいに)/g);

  return {
    distancing: clamp01((quoteWeight + (distanceMarkerCount * 0.08)) / Math.max(sentences.length, 1)),
  };
};

export const estimateMicroSignals = (text) => {
  if (!text || typeof text !== 'string') {
    return zeroMicroSignals();
  }

  const normalizedText = text.trim();
  if (!normalizedText) {
    return zeroMicroSignals();
  }

  const sentences = splitSentences(normalizedText);

  return {
    punctuation: detectPunctuation(normalizedText, sentences),
    fillers: detectFillers(normalizedText, sentences),
    negationPrefix: detectNegationPrefix(normalizedText, sentences),
    sentenceLength: detectSentenceLength(normalizedText, sentences),
    selfHedging: detectSelfHedging(normalizedText, sentences),
    quotation: detectQuotation(normalizedText, sentences),
  };
};
