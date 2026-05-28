import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { MemberDisplayProfile } from '@jibunkaigi/shared/members/memberDisplayTypes';
import { colors, mobileLineHeights, radius, spacing, type as typeScale } from '../../theme/tokens';

interface MobileMemberCardProps {
  profile: MemberDisplayProfile;
}

export function MobileMemberCard({ profile }: MobileMemberCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${profile.label}の詳細を${expanded ? '閉じる' : '開く'}`}
    >
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.emoji}>{profile.emoji}</Text>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{profile.label}</Text>
          <Text style={styles.oneLine}>{profile.oneLine}</Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {/* Expanded detail */}
      {expanded && (
        <View style={styles.detail}>
          <DetailRow label="何を見るか" value={profile.sees} />
          <DetailRow label="核心" value={profile.core} />
          <DetailRow label="声の温度" value={profile.tone} />
          <DetailRow label="しないこと" value={profile.avoids} />
          <View style={styles.hintBlock}>
            <Text style={styles.hintText}>{profile.userFacingHint}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  emoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontSize: typeScale.body,
    fontWeight: '700',
    color: colors.inkStrong,
    letterSpacing: -0.3,
  },
  oneLine: {
    fontSize: typeScale.small,
    color: colors.inkMuted,
    lineHeight: mobileLineHeights.small,
  },
  chevron: {
    fontSize: typeScale.tiny,
    color: colors.inkFaint,
  },
  detail: {
    marginTop: spacing.md,
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  row: {
    gap: spacing.xs,
  },
  rowLabel: {
    fontSize: typeScale.tiny,
    fontWeight: '600',
    color: colors.inkFaint,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  rowValue: {
    fontSize: typeScale.small,
    color: colors.inkSoft,
    lineHeight: mobileLineHeights.small,
  },
  hintBlock: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accentSurface,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.accentIndigoSoft,
  },
  hintText: {
    fontSize: typeScale.small,
    color: colors.accentIndigo,
    lineHeight: 19,
  },
});
