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

// P-4 semantic/somatic patterns for radial condensation
// Based on next-gen design doc v2 Chapter 5, Section 5-3
export const SOMATIC_PATTERNS = [
  // Fear-related (怖い系)
  { id: 'fear-kowai', signal: 'fear-tremor', pattern: /怖[いくて]/g, intensity: 0.7 },
  { id: 'fear-osoroshi', signal: 'fear-tremor', pattern: /恐ろし[いくて]/g, intensity: 0.8 },
  { id: 'fear-kowagaru', signal: 'fear-tremor', pattern: /怖がる/g, intensity: 0.65 },
  { id: 'fear-biku', signal: 'fear-tremor', pattern: /びくびく/g, intensity: 0.6 },

  // Contradiction/tension (矛盾・対立系)
  { id: 'contra-dakedo', signal: 'contradiction-pull', pattern: /だけど/g, intensity: 0.55 },
  { id: 'contra-demo', signal: 'contradiction-pull', pattern: /でも/g, intensity: 0.5 },
  { id: 'contra-kedo', signal: 'contradiction-pull', pattern: /けど/g, intensity: 0.5 },
  { id: 'contra-shikashi', signal: 'contradiction-pull', pattern: /しかし/g, intensity: 0.6 },
  { id: 'contra-noni', signal: 'contradiction-pull', pattern: /のに/g, intensity: 0.65 },

  // Pain/discomfort (辛い・痛い系)
  { id: 'pain-tsurai', signal: 'pain-somatic', pattern: /辛[いくて]/g, intensity: 0.75 },
  { id: 'pain-kurushii', signal: 'pain-somatic', pattern: /苦し[いくて]/g, intensity: 0.8 },
  { id: 'pain-itai', signal: 'pain-somatic', pattern: /痛[いくて]/g, intensity: 0.7 },
  { id: 'pain-setsu', signal: 'pain-somatic', pattern: /せつな[いくて]/g, intensity: 0.75 },

  // Joy/happiness (嬉しい系)
  { id: 'joy-ureshii', signal: 'joy-spark', pattern: /嬉し[いくて]/g, intensity: 0.7 },
  { id: 'joy-tanoshii', signal: 'joy-spark', pattern: /楽し[いくて]/g, intensity: 0.65 },
  { id: 'joy-yorokobi', signal: 'joy-spark', pattern: /喜[びぶ]/g, intensity: 0.6 },

  // Body sensations (身体感覚)
  { id: 'body-iki', signal: 'breath-shallow', pattern: /息が(?:浅[いく]|詰まる|できない)/g, intensity: 0.7 },
  { id: 'body-kowabaru', signal: 'tension-rigid', pattern: /こわばる/g, intensity: 0.65 },
  { id: 'body-kata', signal: 'tension-rigid', pattern: /肩が(?:張る|凝る|重[いく])/g, intensity: 0.6 },
  { id: 'body-mune', signal: 'chest-tight', pattern: /胸が(?:苦し[いく]|詰まる|ざわざわ)/g, intensity: 0.7 },
  { id: 'body-zawazawa', signal: 'visceral-unease', pattern: /ざわざわ/g, intensity: 0.65 },
  { id: 'body-moya', signal: 'visceral-unease', pattern: /もやもや/g, intensity: 0.6 },

  // Resignation/giving up (諦め系)
  { id: 'resign-akirame', signal: 'resignation-drop', pattern: /諦め[るた]/g, intensity: 0.7 },
  { id: 'resign-muri', signal: 'resignation-drop', pattern: /(?:もう)?無理/g, intensity: 0.75 },
  { id: 'resign-dame', signal: 'resignation-drop', pattern: /だめ(?:だ)?/g, intensity: 0.6 },
  { id: 'resign-shikata', signal: 'resignation-drop', pattern: /仕方(?:ない|ない)/g, intensity: 0.65 },

  // Hidden truth (本当は系)
  { id: 'truth-honto', signal: 'hidden-truth', pattern: /本当は/g, intensity: 0.7 },
  { id: 'truth-jitsuwa', signal: 'hidden-truth', pattern: /実は/g, intensity: 0.65 },
  { id: 'truth-honki', signal: 'hidden-truth', pattern: /本気(?:で)?/g, intensity: 0.6 },

  // Desire/want (やりたい系)
  { id: 'desire-yaritai', signal: 'desire-pull', pattern: /やりたい/g, intensity: 0.7 },
  { id: 'desire-shitai', signal: 'desire-pull', pattern: /したい/g, intensity: 0.65 },
  { id: 'desire-hoshii', signal: 'desire-pull', pattern: /欲し[いくて]/g, intensity: 0.7 },
  { id: 'desire-nozomi', signal: 'desire-pull', pattern: /望[むみ]/g, intensity: 0.6 },

  // Confusion/disorientation (混乱系)
  { id: 'confuse-wakaranai', signal: 'confusion-fog', pattern: /(?:よく)?わからない/g, intensity: 0.6 },
  { id: 'confuse-mayou', signal: 'confusion-fog', pattern: /迷[うって]/g, intensity: 0.65 },
  { id: 'confuse-donoyou', signal: 'confusion-fog', pattern: /どうよう/g, intensity: 0.7 },

  // Hesitation markers (ためらい系)
  { id: 'hesit-tamau', signal: 'hesitation-pull', pattern: /ためら[うって]/g, intensity: 0.65 },
  { id: 'hesit-chotto', signal: 'hesitation-pull', pattern: /ちょっと/g, intensity: 0.4 },
  { id: 'hesit-sukoshi', signal: 'hesitation-pull', pattern: /少し/g, intensity: 0.35 },

  // Anger/irritation (怒り系)
  { id: 'anger-ikaru', signal: 'anger-heat', pattern: /怒[りる]/g, intensity: 0.75 },
  { id: 'anger-hara', signal: 'anger-heat', pattern: /腹(?:が)?立つ/g, intensity: 0.8 },
  { id: 'anger-mukatuku', signal: 'anger-heat', pattern: /むかつく/g, intensity: 0.7 },
  { id: 'anger-ira', signal: 'anger-heat', pattern: /いらいら/g, intensity: 0.65 },

  // Loneliness/isolation (孤独系)
  { id: 'lonely-sabishii', signal: 'lonely-ache', pattern: /寂し[いくて]/g, intensity: 0.7 },
  { id: 'lonely-hitori', signal: 'lonely-ache', pattern: /一人(?:ぼっち)?/g, intensity: 0.6 },
  { id: 'lonely-kodoku', signal: 'lonely-ache', pattern: /孤独/g, intensity: 0.75 },

  // Shame/embarrassment (恥ずかしい系)
  { id: 'shame-hazukashi', signal: 'shame-curl', pattern: /恥ずかし[いくて]/g, intensity: 0.7 },
  { id: 'shame-haji', signal: 'shame-curl', pattern: /恥(?:じる)?/g, intensity: 0.65 },

  // Relief/safety (安心系)
  { id: 'relief-anshin', signal: 'relief-exhale', pattern: /安心/g, intensity: 0.6 },
  { id: 'relief-hotokko', signal: 'relief-exhale', pattern: /ほっと/g, intensity: 0.55 },
];

export const JAPANESE_PATTERN_GROUPS = {
  formal: FORMAL_SIGNAL_PATTERNS,
  semantic: {
    somatic: SOMATIC_PATTERNS,
  },
};
