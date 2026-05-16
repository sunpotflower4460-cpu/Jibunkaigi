export function createUniversalId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createSessionTitleFromText(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '新しい問い';
  return trimmed.length > 18 ? `${trimmed.slice(0, 18)}…` : trimmed;
}
