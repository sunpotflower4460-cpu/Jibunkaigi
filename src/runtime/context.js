const DEFAULT_CONTEXT_MESSAGES = 6;
const DEFAULT_CONTEXT_CHARS = 180;

const AGENT_FALLBACK_NAME = 'AI';

export const truncatePromptText = (text, maxChars = DEFAULT_CONTEXT_CHARS) => {
  const normalized = String(text ?? '').replace(/\s+/g, ' ').trim();

  if (!normalized) return '';
  if (normalized.length <= maxChars) return normalized;

  return `${normalized.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
};

export const buildPromptContext = ({
  messages = [],
  userName = 'あなた',
  agents = [],
  maxMessages = DEFAULT_CONTEXT_MESSAGES,
  maxCharsPerMessage = DEFAULT_CONTEXT_CHARS,
}) => {
  if (!Array.isArray(messages) || messages.length === 0) return '';

  return messages
    .slice(-maxMessages)
    .map((message) => {
      if (!message) return '';

      const name = message.role === 'user'
        ? userName
        : message.agentId === 'master'
          ? '心の鏡'
          : agents.find((agent) => agent.id === message.agentId)?.name || AGENT_FALLBACK_NAME;

      const content = truncatePromptText(message.content || '', maxCharsPerMessage);
      return content ? `${name}: ${content}` : '';
    })
    .filter(Boolean)
    .join('\n');
};
