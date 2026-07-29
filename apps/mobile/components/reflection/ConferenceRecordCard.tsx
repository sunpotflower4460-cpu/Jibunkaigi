import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { ConferenceRecord } from '../../services/reflectionShelfRepository';
import { colors, mobileLineHeights, spacing, type as typeScale } from '../../theme/tokens';

interface ConferenceRecordCardProps {
  record: ConferenceRecord;
  onDelete: (recordId: string) => Promise<void>;
  onOpenStickyNote: (record: ConferenceRecord) => void;
}

function formatTimestamp(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function ConferenceRecordCard({
  record,
  onDelete,
  onOpenStickyNote,
}: ConferenceRecordCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{record.title}</Text>
        <TouchableOpacity
          onPress={() => {
            void onDelete(record.id);
          }}
          accessibilityRole="button"
          accessibilityLabel="会議録を削除"
        >
          <Text style={styles.deleteText}>削除</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.timestamp}>作成: {formatTimestamp(record.createdAt)}</Text>
      <Text style={styles.timestamp}>更新: {formatTimestamp(record.updatedAt)}</Text>
      <Text style={styles.row}><Text style={styles.label}>トピック:</Text> {record.topic}</Text>
      <Text style={styles.row}>
        <Text style={styles.label}>重要語:</Text> {record.keywords.join(' / ') || '（なし）'}
      </Text>
      <Text style={styles.row}><Text style={styles.label}>心の鏡:</Text> {record.mirrorSummary}</Text>
      <Text style={styles.row}><Text style={styles.label}>残った一文:</Text> {record.selfLine}</Text>
      <Text style={styles.row}><Text style={styles.label}>戻る問い:</Text> {record.returnQuestion}</Text>
      <TouchableOpacity
        style={styles.stickyButton}
        onPress={() => onOpenStickyNote(record)}
        accessibilityRole="button"
        accessibilityLabel="この会議録にどう思う付箋を貼る"
      >
        <Text style={styles.stickyButtonText}>この会議録に「どう思う？」を貼る</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typeScale.body,
    lineHeight: mobileLineHeights.heading,
    fontWeight: '700',
    color: colors.inkStrong,
  },
  deleteText: {
    fontSize: typeScale.tiny,
    lineHeight: mobileLineHeights.tiny,
    color: colors.danger,
    fontWeight: '700',
  },
  timestamp: {
    fontSize: typeScale.tiny,
    lineHeight: mobileLineHeights.tiny,
    color: colors.inkSoft,
  },
  row: {
    fontSize: typeScale.small,
    lineHeight: mobileLineHeights.body,
    color: colors.inkStrong,
  },
  label: {
    fontWeight: '700',
    color: colors.inkMuted,
  },
  stickyButton: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accentIndigo,
    backgroundColor: colors.accentIndigoSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  stickyButtonText: {
    fontSize: typeScale.small,
    lineHeight: mobileLineHeights.small,
    color: colors.accentIndigo,
    fontWeight: '700',
  },
});
