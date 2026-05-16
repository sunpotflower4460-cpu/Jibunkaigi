import type { UniversalPromptMessage } from './promptTypes';

export function sanitizePromptText(text: string, maxLength = 1200): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}…`;
}

export function selectRecentPromptMessages(
  messages: UniversalPromptMessage[],
  maxMessages = 16,
): UniversalPromptMessage[] {
  return messages.slice(-maxMessages).map((message) => ({
    ...message,
    text: sanitizePromptText(message.text, 800),
  }));
}
