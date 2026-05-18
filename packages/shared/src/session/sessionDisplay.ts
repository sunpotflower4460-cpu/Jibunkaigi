export interface UniversalSessionListLike {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

export function sortUniversalSessions<T extends UniversalSessionListLike>(sessions: T[]): T[] {
  return [...sessions].sort((a, b) => {
    const pinnedDiff = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
    if (pinnedDiff !== 0) return pinnedDiff;
    return b.updatedAt - a.updatedAt;
  });
}

export function normalizeSessionTitle(title: string): string {
  const trimmed = title.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '新しい問い';
  return trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed;
}
