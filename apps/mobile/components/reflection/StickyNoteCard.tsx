import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { StickyNote } from '../../services/reflectionShelfRepository';
import { colors, mobileLineHeights, radius, spacing, type as typeScale } from '../../theme/tokens';

interface StickyNoteCardProps {
  note: StickyNote;
  onDelete: (noteId: string) => void;
}

export function StickyNoteCard({ note, onDelete }: StickyNoteCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>{note.label}</Text>
        <TouchableOpacity
          onPress={() => onDelete(note.id)}
          accessibilityRole="button"
          accessibilityLabel="付箋を削除"
        >
          <Text style={styles.deleteText}>削除</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.content}>{note.content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceStrong,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: typeScale.small,
    color: colors.inkMuted,
    fontWeight: '600',
  },
  deleteText: {
    fontSize: typeScale.small,
    color: colors.danger,
    fontWeight: '600',
  },
  content: {
    fontSize: typeScale.body,
    color: colors.inkStrong,
    lineHeight: mobileLineHeights.body,
  },
});
