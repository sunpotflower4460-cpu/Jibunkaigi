export const FORMAL_SIGNAL_PATTERNS = {
  punctuation: [
    { id: 'assertion-exclamation', signal: 'assertion', pattern: /[！!]+/g, weight: 0.45 },
    { id: 'hesitation-question', signal: 'hesitation', pattern: /[？?]+/g, weight: 0.3 },
    { id: 'hesitation-ellipsis', signal: 'hesitation', pattern: /(?:…|\.{3,})(?=[^。！？!?」』\s])/g, weight: 0.22 },
    { id: 'trail-ellipsis', signal: 'trailOff', pattern: /(?:…|\.{3,})\s*$/g, weight: 0.38 },
    { id: 'trail-open-end', signal: 'trailOff', pattern: /[、,\-―〜]\s*$/g, weight: 0.2 },
  ],
  fillers: [
    { id: 'filler-etto', pattern: /え(?:っ|え)?と+/g, weight: 0.34 },
    { id: 'filler-maa', pattern: /まあ/g, weight: 0.22 },
    { id: 'filler-nanteiu', pattern: /なんていうか/g, weight: 0.44 },
    { id: 'filler-un', pattern: /うん/g, weight: 0.18 },
  ],
  negationPrefix: [
    { id: 'neg-betsuni', pattern: /別に/g, weight: 0.4 },
    { id: 'neg-sonnani-nai', pattern: /そんなに[^。！？!?\n]{0,18}(?:ない|なく|なかった|なくて)/g, weight: 0.48 },
    { id: 'neg-maa-kana', pattern: /まあ[^。！？!?\n]{0,12}かな/g, weight: 0.34 },
    { id: 'neg-soft-kana', pattern: /(?:無理|できない|違う|ない)[^。！？!?\n]{0,6}かな/g, weight: 0.28 },
  ],
  selfHedging: [
    { id: 'hedge-kamo', pattern: /(?:かも|かもしれない)/g, weight: 0.42 },
    { id: 'hedge-kigasuru', pattern: /気がする/g, weight: 0.36 },
    { id: 'hedge-tabun', pattern: /(?:たぶん|多分)/g, weight: 0.32 },
  ],
  quotation: [
    { id: 'quote-kagi', pattern: /「[^」]+」/g, weight: 0.42 },
    { id: 'quote-double-kagi', pattern: /『[^』]+』/g, weight: 0.48 },
  ],
};

// Placeholder for P-4 semantic/somatic patterns so D-1 and P-4 can share one asset module.
export const SOMATIC_PATTERNS = [];

export const JAPANESE_PATTERN_GROUPS = {
  formal: FORMAL_SIGNAL_PATTERNS,
  semantic: {
    somatic: SOMATIC_PATTERNS,
  },
};
