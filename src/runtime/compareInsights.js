// src/runtime/compareInsights.js
// Compare Mode の観察結果を、開発用の改善材料へ整形する。

export const COMPARE_QUALITY_DIMENSIONS = [
  {
    key: 'naturalness',
    label: '自然さ',
    aliases: ['naturalness', '自然さ', '自然'],
  },
  {
    key: 'specificity',
    label: '具体性',
    aliases: ['specificity', '具体性', '具体'],
  },
  {
    key: 'characterPresence',
    label: 'キャラの輪郭',
    aliases: ['character presence', 'characterPresence', 'キャラの輪郭', 'キャラの立ち方', '輪郭'],
  },
  {
    key: 'pressure',
    label: '押しつけの少なさ',
    aliases: ['pressure', '押しつけの少なさ', '圧の少なさ', '押しつけ', '圧'],
  },
  {
    key: 'spaciousness',
    label: '余白',
    aliases: ['spaciousness', '余白'],
  },
  {
    key: 'receivability',
    label: '受け取りやすさ',
    aliases: ['receivability', '受け取りやすさ', '受け取り'],
  },
  {
    key: 'joeNess',
    label: 'ジョーらしさ',
    aliases: ['joe-ness', 'joeness', 'joe ness', 'ジョーらしさ'],
  },
]

export const COMPARE_REVISION_LABELS = [
  'keep',
  'soften',
  'too-thin',
  'too-explanatory',
  'too-generic',
  'good-joe',
  'good-character',
  'good-specificity',
  'too-flat',
]

export const COMPARE_JOE_REVIEW_FIELDS = [
  { key: 'joeFocus', label: 'Joe focus' },
  { key: 'joeGroundingLevel', label: 'Joe grounding' },
  { key: 'joeLivingThread', label: 'Joe living thread' },
  { key: 'joeCharacterDensity', label: 'Joe density' },
  { key: 'joeDrift', label: 'Joe drift' },
]

const COMPARE_LABEL_STORAGE_KEY = 'jibunkaigi:compareLabels'
const OUTER_GUIDE_SECTION_PREFIXES = {
  gained: ['得たもの', 'current gained', 'gained'],
  lost: ['失ったもの', 'current lost', 'lost'],
  hint: ['改善提案', '提案', 'guide hint', 'hint'],
}
const STOPWORDS = new Set([
  'それ',
  'こと',
  'もの',
  'よう',
  'ため',
  'ここ',
  'そこ',
  'これ',
  'あれ',
  'です',
  'ます',
  'したい',
  'いる',
  'ある',
  'する',
  'して',
  'ない',
  'けど',
  'から',
  'ので',
  'でも',
  'いう',
  '一緒',
])
const SOFTENING_MARKERS = ['大丈夫', '無理に', '一緒に', 'ゆっくり', '少しずつ', 'きっと', '安心', 'やさしく', '焦らなくて']
const EXPLANATORY_MARKERS = ['つまり', 'というのは', 'なぜなら', 'なので', 'だから', '整理すると', '要するに', '言い換えると']
const JAPANESE_PARTICLE_PATTERN = /(けれど|けど|から|ので|のに|です|ます|したい|している|してる|だった|では|より|まで|そして|でも|ただ|を|が|は|に|へ|で|と|も|の|や|ね|よ)/gu
const JOE_FOCUS_MAX_OPENING_LENGTH = 42
const JOE_MEDIUM_OPENING_LENGTH = 70
const JOE_SOFTENING_HIT_THRESHOLD = 2
const JOE_EXPLANATION_MARKER_THRESHOLD = 2
const JOE_EXPLANATION_LENGTH_DELTA = 60
const JOE_EXPLANATION_SENTENCE_THRESHOLD = 3

const normalize = (text = '') => (text == null ? '' : text.toString().trim())

const splitList = (value = '') => normalize(value)
  .split(/[、,，/・\n]/)
  .map((item) => item.trim())
  .filter(Boolean)

const stripBullet = (line = '') => line.replace(/^[-•*]\s*/, '').trim()

const findSectionType = (line = '') => {
  const lowered = line.toLowerCase()
  for (const [type, prefixes] of Object.entries(OUTER_GUIDE_SECTION_PREFIXES)) {
    const matchedPrefix = prefixes.find((prefix) => lowered.startsWith(prefix.toLowerCase()))
    if (matchedPrefix) {
      return {
        type,
        value: line.slice(matchedPrefix.length).replace(/^[：:]\s*/, '').trim(),
      }
    }
  }
  return null
}

const findMatchedTerms = (text = '', aliases = []) => {
  const haystack = normalize(text).toLowerCase()
  if (!haystack) return []
  return aliases.filter((alias) => haystack.includes(alias.toLowerCase()))
}

const tokenizeForOverlap = (text = '') => {
  const prepared = normalize(text)
    .replace(/[「」『』（）()、。!?！？]/g, ' ')
    .replace(JAPANESE_PARTICLE_PATTERN, ' ')
  const matches = prepared.match(/[\p{Letter}\p{Number}\u3040-\u30ff\u3400-\u9fffー]{2,}/gu) || []
  return [...new Set(matches.filter((token) => !STOPWORDS.has(token)))]
}

const countSentences = (text = '') => {
  const pieces = normalize(text).split(/[。.!！?？\n]+/).map((item) => item.trim()).filter(Boolean)
  return pieces.length
}

const firstSentence = (text = '') => normalize(text).split(/[。.!！?？\n]/)[0]?.trim() || ''

const buildEmptyQualityObservation = ({ key, label, applicable = true }) => ({
  key,
  label,
  applicable,
  mentioned: false,
  gained: false,
  lost: false,
  matchedTerms: [],
})

const getQualityStatus = (observation = {}) => {
  if (!observation.applicable) return 'n/a'
  if (observation.gained && observation.lost) return 'mixed'
  if (observation.gained) return 'gained'
  if (observation.lost) return 'lost'
  if (observation.mentioned) return 'watch'
  return 'unmentioned'
}

const buildJoeDrift = ({ joeOverSoftened, joeTooExplanatory }) => {
  if (joeOverSoftened && joeTooExplanatory) return 'mixed'
  if (joeOverSoftened) return 'too-soft'
  if (joeTooExplanatory) return 'too-explanatory'
  return 'okay'
}

const getJoeDriftEmphasis = (drift = 'n/a') => {
  if (drift === 'okay') return 'positive'
  if (drift === 'mixed' || drift.includes('too-')) return 'warning'
  return 'watch'
}

export const parseOuterGuideSections = (outerGuide = '') => {
  const guide = normalize(outerGuide)
  const lines = guide.split('\n').map(stripBullet).filter(Boolean)
  const sections = {
    gained: [],
    lost: [],
    hint: '',
  }

  for (const line of lines) {
    const parsed = findSectionType(line)
    if (!parsed) continue

    if (parsed.type === 'hint') {
      sections.hint = parsed.value || sections.hint
      continue
    }

    sections[parsed.type].push(...splitList(parsed.value))
  }

  if (!sections.hint && lines.length > 0) {
    sections.hint = lines.at(-1)
  }

  return {
    gained: [...new Set(sections.gained)],
    lost: [...new Set(sections.lost)],
    hint: sections.hint,
  }
}

export const buildQualityObservations = ({
  agentId = '',
  outerGuide = '',
  compareSummary = {},
} = {}) => {
  const guide = normalize(outerGuide)
  const gainedText = compareSummary.gained.join(' ')
  const lostText = compareSummary.lost.join(' ')

  return COMPARE_QUALITY_DIMENSIONS.reduce((acc, dimension) => {
    const applicable = dimension.key !== 'joeNess' || agentId === 'creative'
    const gainedTerms = findMatchedTerms(gainedText, dimension.aliases)
    const lostTerms = findMatchedTerms(lostText, dimension.aliases)
    const guideTerms = findMatchedTerms(guide, dimension.aliases)
    acc[dimension.key] = {
      ...buildEmptyQualityObservation({ key: dimension.key, label: dimension.label, applicable }),
      mentioned: applicable && guideTerms.length > 0,
      gained: applicable && gainedTerms.length > 0,
      lost: applicable && lostTerms.length > 0,
      matchedTerms: [...new Set([...gainedTerms, ...lostTerms, ...guideTerms])],
    }
    return acc
  }, {})
}

export const buildJoeObservationFlags = ({
  agentId = '',
  userText = '',
  baselineReply = '',
  currentReply = '',
  qualityObservations = {},
} = {}) => {
  if (agentId !== 'creative') {
    return {
      applicable: false,
      joeFocusStrength: false,
      joeGrounding: false,
      joeOverSoftened: false,
      joeTooExplanatory: false,
      joeFocus: 'n/a',
      joeGroundingLevel: 'n/a',
      joeLivingThread: 'n/a',
      joeCharacterDensity: 'n/a',
      joeDrift: 'n/a',
      groundedTokens: [],
    }
  }

  const normalizedCurrent = normalize(currentReply)
  const normalizedBaseline = normalize(baselineReply)
  const opening = firstSentence(normalizedCurrent)
  const userTokens = tokenizeForOverlap(userText).slice(0, 6)
  const groundedTokens = userTokens.filter((token) => normalizedCurrent.includes(token))
  const softeningHits = SOFTENING_MARKERS.filter((marker) => normalizedCurrent.includes(marker))
  const explanatoryHits = EXPLANATORY_MARKERS.filter((marker) => normalizedCurrent.includes(marker))
  const lengthDelta = normalizedCurrent.length - normalizedBaseline.length

  const specificityLost = qualityObservations.specificity?.lost
  const specificityGained = qualityObservations.specificity?.gained
  const characterLost = qualityObservations.characterPresence?.lost
  const characterGained = qualityObservations.characterPresence?.gained
  const joeNessLost = qualityObservations.joeNess?.lost
  const joeNessGained = qualityObservations.joeNess?.gained
  const pressureGained = qualityObservations.pressure?.gained
  const spaciousnessGained = qualityObservations.spaciousness?.gained
  const openingIncludesGroundedToken = groundedTokens.some((token) => opening.includes(token))

  const joeFocus =
    opening.length > 0 && opening.length <= JOE_FOCUS_MAX_OPENING_LENGTH && openingIncludesGroundedToken
      ? 'strong'
      : groundedTokens.length > 0 && opening.length > 0 && opening.length <= JOE_MEDIUM_OPENING_LENGTH
        ? 'medium'
        : 'weak'

  const joeGroundingLevel =
    groundedTokens.length >= 2
      ? 'grounded'
      : groundedTokens.length === 1
        ? 'partial'
        : 'vague'

  const joeOverSoftened =
    softeningHits.length >= JOE_SOFTENING_HIT_THRESHOLD
    // 「圧が減った / 余白が増えた」のに具体性と輪郭を同時に落としている時は、
    // 自然になったというより、芯を抜いて柔らかくしすぎた可能性として扱う。
    || ((pressureGained || spaciousnessGained) && specificityLost && characterLost)
  const joeTooExplanatory =
    explanatoryHits.length >= JOE_EXPLANATION_MARKER_THRESHOLD
    || (lengthDelta >= JOE_EXPLANATION_LENGTH_DELTA && countSentences(normalizedCurrent) >= JOE_EXPLANATION_SENTENCE_THRESHOLD)

  const joeCharacterDensity =
    characterLost && (specificityLost || joeNessLost)
      ? 'thin'
      : characterLost
        ? 'thinning'
        : (characterGained || joeNessGained || specificityGained)
          ? 'dense'
          : 'steady'

  const joeLivingThread =
    joeFocus === 'strong' || (joeGroundingLevel === 'grounded' && !joeTooExplanatory)
      ? 'picked'
      : joeGroundingLevel !== 'vague'
        ? 'unclear'
        : 'missing'

  return {
    applicable: true,
    joeFocusStrength: joeFocus === 'strong',
    joeGrounding: joeGroundingLevel !== 'vague',
    joeOverSoftened,
    joeTooExplanatory,
    joeFocus,
    joeGroundingLevel,
    joeLivingThread,
    joeCharacterDensity,
    joeDrift: buildJoeDrift({ joeOverSoftened, joeTooExplanatory }),
    groundedTokens,
  }
}

export const buildQualityDimensionList = ({
  qualityObservations = {},
} = {}) => COMPARE_QUALITY_DIMENSIONS.map((dimension) => {
  const observation = qualityObservations[dimension.key] || buildEmptyQualityObservation(dimension)
  return {
    key: dimension.key,
    label: dimension.label,
    applicable: observation.applicable,
    mentioned: observation.mentioned,
    gained: observation.gained,
    lost: observation.lost,
    matchedTerms: observation.matchedTerms || [],
    status: getQualityStatus(observation),
  }
})

export const buildJoeReview = ({
  agentId = '',
  joeObservationFlags = {},
} = {}) => {
  if (agentId !== 'creative' || !joeObservationFlags.applicable) {
    return {
      applicable: false,
      focus: 'n/a',
      grounding: 'n/a',
      livingThread: 'n/a',
      characterDensity: 'n/a',
      drift: 'n/a',
      priorities: [],
    }
  }

  const priorities = [
    {
      key: 'joeFocus',
      label: 'Joe focus',
      value: joeObservationFlags.joeFocus,
      emphasis: joeObservationFlags.joeFocus === 'weak' ? 'warning' : joeObservationFlags.joeFocus === 'strong' ? 'positive' : 'watch',
    },
    {
      key: 'joeGroundingLevel',
      label: 'Joe grounding',
      value: joeObservationFlags.joeGroundingLevel,
      emphasis: joeObservationFlags.joeGroundingLevel === 'grounded' ? 'positive' : joeObservationFlags.joeGroundingLevel === 'vague' ? 'warning' : 'watch',
    },
    {
      key: 'joeLivingThread',
      label: 'Joe living thread',
      value: joeObservationFlags.joeLivingThread,
      emphasis: joeObservationFlags.joeLivingThread === 'picked' ? 'positive' : joeObservationFlags.joeLivingThread === 'missing' ? 'warning' : 'watch',
    },
    {
      key: 'joeCharacterDensity',
      label: 'Joe density',
      value: joeObservationFlags.joeCharacterDensity,
      emphasis: joeObservationFlags.joeCharacterDensity === 'dense' ? 'positive' : joeObservationFlags.joeCharacterDensity === 'thin' ? 'warning' : 'watch',
    },
    {
      key: 'joeDrift',
      label: 'Joe drift',
      value: joeObservationFlags.joeDrift,
      emphasis: getJoeDriftEmphasis(joeObservationFlags.joeDrift),
    },
  ]

  return {
    applicable: true,
    focus: joeObservationFlags.joeFocus,
    grounding: joeObservationFlags.joeGroundingLevel,
    livingThread: joeObservationFlags.joeLivingThread,
    characterDensity: joeObservationFlags.joeCharacterDensity,
    drift: joeObservationFlags.joeDrift,
    priorities,
  }
}

export const buildSuggestedRevisionLabels = ({
  qualityObservations = {},
  joeObservationFlags = {},
} = {}) => {
  const labels = []
  const specificity = qualityObservations.specificity || {}
  const characterPresence = qualityObservations.characterPresence || {}
  const pressure = qualityObservations.pressure || {}
  const naturalness = qualityObservations.naturalness || {}
  const joeNess = qualityObservations.joeNess || {}

  if ((naturalness.gained || qualityObservations.receivability?.gained) && !joeObservationFlags.joeTooExplanatory && !joeObservationFlags.joeOverSoftened) {
    labels.push('keep')
  }
  if (pressure.lost) {
    labels.push('soften')
  }
  if (specificity.lost && characterPresence.lost) {
    labels.push('too-thin')
  }
  if (joeObservationFlags.joeTooExplanatory) {
    labels.push('too-explanatory')
  }
  if (specificity.lost && !characterPresence.gained) {
    labels.push('too-generic')
  }
  if (characterPresence.lost && (qualityObservations.spaciousness?.gained || naturalness.gained)) {
    labels.push('too-flat')
  }
  if (joeNess.gained && !joeObservationFlags.joeOverSoftened && !joeObservationFlags.joeTooExplanatory) {
    labels.push('good-joe')
  }
  if (characterPresence.gained) {
    labels.push('good-character')
  }
  if (specificity.gained) {
    labels.push('good-specificity')
  }

  return [...new Set(labels)].filter((label) => COMPARE_REVISION_LABELS.includes(label))
}

export const normalizeRevisionLabels = (labels = []) => {
  if (!Array.isArray(labels)) return []
  return [...new Set(labels.filter((label) => COMPARE_REVISION_LABELS.includes(label)))]
}

export const readCompareLabelStore = ({
  storageGetter = () => {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem(COMPARE_LABEL_STORAGE_KEY)
  },
} = {}) => {
  try {
    const raw = storageGetter()
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return Object.entries(parsed).reduce((acc, [compareKey, labels]) => {
      acc[compareKey] = normalizeRevisionLabels(labels)
      return acc
    }, {})
  } catch {
    return {}
  }
}

export const writeCompareLabelStore = (store, {
  storageSetter = (value) => {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(COMPARE_LABEL_STORAGE_KEY, value)
  },
} = {}) => {
  storageSetter(JSON.stringify(store))
}

export const toggleCompareRevisionLabel = (store = {}, compareKey, label) => {
  if (!compareKey || !COMPARE_REVISION_LABELS.includes(label)) return store
  const current = new Set(normalizeRevisionLabels(store[compareKey]))
  if (current.has(label)) {
    current.delete(label)
  } else {
    current.add(label)
  }

  return {
    ...store,
    [compareKey]: [...current],
  }
}

const formatQualityDimensionLine = (dimension = {}) => `${dimension.label}: ${dimension.status || 'unmentioned'}`
const formatJoePriorityLine = (priority = {}) => `${priority.label}: ${priority.value || 'n/a'}`

export const formatCompareCopyBundle = (entry = {}) => {
  const compareSummary = entry.compareSummary || {}
  const revisionLabels = normalizeRevisionLabels(entry.revisionLabels || entry.labels?.selected)
  const qualityDimensions = Array.isArray(entry.qualityDimensions)
    ? entry.qualityDimensions.filter((dimension) => dimension.applicable)
    : []
  const joePriorities = Array.isArray(entry.joeReview?.priorities)
    ? entry.joeReview.priorities
    : []

  return [
    '[User]',
    normalize(entry.userText) || '(空)',
    '',
    '[Baseline]',
    normalize(entry.baselineReply) || '(未生成)',
    '',
    '[Current]',
    normalize(entry.currentReply) || '(未生成)',
    '',
    '[Outer Guide]',
    normalize(entry.outerGuide) || '(未生成)',
    '',
    '[Summary]',
    `gained: ${compareSummary.gained?.join(', ') || '-'}`,
    `lost: ${compareSummary.lost?.join(', ') || '-'}`,
    `hint: ${compareSummary.hint || '-'}`,
    ...(qualityDimensions.length > 0
      ? [
          '',
          '[Quality Dimensions]',
          ...qualityDimensions.map(formatQualityDimensionLine),
        ]
      : []),
    ...(joePriorities.length > 0
      ? [
          '',
          '[Joe Review]',
          ...joePriorities.map(formatJoePriorityLine),
        ]
      : []),
    '',
    '[Labels]',
    revisionLabels.join(', ') || '-',
  ].join('\n')
}
