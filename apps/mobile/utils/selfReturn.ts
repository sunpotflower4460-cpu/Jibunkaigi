import type { ConferenceRecord } from '../services/reflectionShelfRepository';

export function createSelfReturnSeed(record: ConferenceRecord): string {
  const sections = [
    `残った一文: ${record.selfLine}`,
    `戻る問い: ${record.returnQuestion}`,
  ];

  if (record.keywords.length > 0) {
    sections.push(`重要語: ${record.keywords.slice(0, 3).join(' / ')}`);
  }

  return sections.join('\n');
}
