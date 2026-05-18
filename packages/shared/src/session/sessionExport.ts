export interface UniversalExportMessageLike {
  role: 'user' | 'agent';
  text: string;
  agentLabel?: string;
  createdAt?: number;
  origin?: 'direct' | 'others';
}

export interface UniversalExportSessionLike {
  title: string;
  messages: UniversalExportMessageLike[];
}

export function formatMessageForCopy(message: UniversalExportMessageLike): string {
  const speaker = message.role === 'user' ? 'あなた' : message.agentLabel || 'AI';
  const prefix = message.origin === 'others' ? `${speaker} / OTHERS` : speaker;
  return `${prefix}:\n${message.text.trim()}`;
}

export function formatSessionForCopy(session: UniversalExportSessionLike): string {
  const lines = [
    `# ${session.title || 'じぶん会議'}`,
    '',
    ...session.messages.map((message) => formatMessageForCopy(message)),
  ];
  return lines.join('\n\n---\n\n');
}
