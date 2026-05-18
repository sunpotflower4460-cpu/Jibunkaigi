import type { UniversalUserProfile } from './userProfileTypes';

export const DEFAULT_USER_NAME = 'あなた';
export const MAX_USER_NAME_LENGTH = 24;

export function normalizeUserName(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return DEFAULT_USER_NAME;
  return trimmed.length > MAX_USER_NAME_LENGTH
    ? trimmed.slice(0, MAX_USER_NAME_LENGTH)
    : trimmed;
}

export function createDefaultUserProfile(): UniversalUserProfile {
  return {
    userName: DEFAULT_USER_NAME,
    updatedAt: 0,
  };
}
