export type CrisisSafetyKind = 'self-harm' | 'harm-to-others';

export interface CrisisSafetyMatch {
  isCrisis: boolean;
  kind: CrisisSafetyKind | null;
  matchedPhrase: string | null;
}

const SELF_HARM_PHRASES = [
  '死にたい',
  '自殺したい',
  '自分を殺したい',
  '今から死ぬ',
  'もう死ぬ',
  '消えたい',
  '生きていたくない',
  '生きるのをやめたい',
  '首を吊りたい',
  '首をつりたい',
  '飛び降りたい',
  '線路に飛び込みたい',
  '大量に薬を飲みたい',
] as const;

const HARM_TO_OTHERS_PHRASES = [
  '人を殺したい',
  '誰かを殺したい',
  'あいつを殺したい',
  '他人を傷つけたい',
  '誰かを傷つけたい',
] as const;

function normalizeSafetyText(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000、。,.!！?？「」『』（）()]/g, '');
}

/**
 * Detects direct statements that indicate an immediate safety concern.
 *
 * This intentionally stays conservative: broad distress words such as
 * "つらい" or "もう無理" are not enough on their own. The detector is a
 * routing guard, not a diagnosis or a substitute for professional assessment.
 */
export function detectCrisisSafety(text: string): CrisisSafetyMatch {
  const normalized = normalizeSafetyText(text);
  if (!normalized) {
    return { isCrisis: false, kind: null, matchedPhrase: null };
  }

  for (const phrase of SELF_HARM_PHRASES) {
    const normalizedPhrase = normalizeSafetyText(phrase);
    if (normalized.includes(normalizedPhrase)) {
      return { isCrisis: true, kind: 'self-harm', matchedPhrase: phrase };
    }
  }

  for (const phrase of HARM_TO_OTHERS_PHRASES) {
    const normalizedPhrase = normalizeSafetyText(phrase);
    if (normalized.includes(normalizedPhrase)) {
      return { isCrisis: true, kind: 'harm-to-others', matchedPhrase: phrase };
    }
  }

  return { isCrisis: false, kind: null, matchedPhrase: null };
}

export function isCrisisSafetyText(text: string): boolean {
  return detectCrisisSafety(text).isCrisis;
}

/**
 * Static safety response used before any persona prompt, delegate selection,
 * OTHERS fan-out, or development trace. It avoids presenting the app as an
 * emergency service and gives concrete, low-friction next steps.
 */
export function buildCrisisSafetyResponse(): string {
  return [
    '今の言葉から、あなた自身または誰かの安全が心配です。ここでは内省を続けるより、今すぐ人につながることを優先してください。',
    '',
    '差し迫った危険がある、すでに手段を用意している、または一人で安全を保てない場合は、地域の緊急通報へ連絡してください。',
    '可能なら、信頼できる人に「今ひとりにしないで。助けが必要」とそのまま伝え、危険な物や場所から離れてください。',
    '',
    'このアプリは緊急支援、医療、心理療法の代わりにはなれません。',
  ].join('\n');
}
