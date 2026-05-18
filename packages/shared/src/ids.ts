function createSecureIdSegment(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID().replace(/-/g, '');
  }

  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const values = new Uint8Array(16);
    globalThis.crypto.getRandomValues(values);
    return Array.from(values, (value) => value.toString(16).padStart(2, '0')).join('');
  }

  throw new Error('Secure ID generation is unavailable in this environment.');
}

export function createUniversalId(prefix: string): string {
  return `${prefix}_${Date.now()}_${createSecureIdSegment().slice(0, 12)}`;
}

export function createSessionTitleFromText(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '新しい問い';
  return trimmed.length > 18 ? `${trimmed.slice(0, 18)}…` : trimmed;
}
