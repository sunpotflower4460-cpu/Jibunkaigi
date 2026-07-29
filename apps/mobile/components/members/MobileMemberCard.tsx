import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { isConcreteAgentId, type UniversalAgentId } from '@jibunkaigi/shared';
import type { MemberDisplayProfile } from '@jibunkaigi/shared/members/memberDisplayTypes';
import {
  agentPalette,
  colors,
  getAgentIcon,
  mobileLineHeights,
  radius,
  spacing,
  type as typeScale,
} from '../../theme/tokens';

interface MobileMemberCardProps {
  profile: MemberDisplayProfile;
}

export function MobileMemberCard({ profile }: MobileMemberCardProps) {
  const [expanded, setExpanded] = useState(false);
  // Web版 BeliefsDialog はメンバーごとの淡色でカードを染める。
  const agentId = profile.id as UniversalAgentId;
  const palette = isConcreteAgentId(agentId) ? agentPalette[agentId] : null;
  const Icon = getAgentIcon(agentId);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        palette ? { backgroundColor: palette.surface, borderColor: palette.border } : null,
      ]}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${profile.label}の詳細を${expanded ? '閉じる' : '開く'}`}
    >
      {/* Header row */}
      <View style={styles.header}>
        <Icon size={16} color={palette?.label ?? colors.inkSoft} />
        <View style={styles.titleBlock}>
          <Text style={[styles.name, palette ? { color: palette.label } : null]}>
            {profile.label}
          </Text>
          <Text style={styles.oneLine}>{profile.oneLine}</Text>
        </View>
        {expanded ? (
          <ChevronUp size={14} color={colors.inkFaint} />
        ) : (
          <ChevronDown size={14} color={colors.inkFaint} />
        )}
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
  // Web版 BeliefsDialog のカード: p-5 / rounded-[1.75rem] / メンバー色
  card: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontSize: typeScale.small,
    fontWeight: '900',
    color: colors.inkStrong,
    letterSpacing: -0.1,
  },
  oneLine: {
    fontSize: typeScale.tiny,
    color: colors.inkMuted,
    lineHeight: mobileLineHeights.tiny,
  },
  detail: {
    marginTop: spacing.md,
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.6)',
  },
  row: {
    gap: spacing.xs,
  },
  rowLabel: {
    fontSize: typeScale.label,
    fontWeight: '900',
    color: colors.inkFaint,
    letterSpacing: 1.6,
  },
  rowValue: {
    // Web版の belief は italic の本文
    fontSize: typeScale.tiny,
    fontWeight: '700',
    color: colors.inkSoft,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  hintBlock: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  hintText: {
    fontSize: typeScale.tiny,
    color: colors.inkMuted,
    fontWeight: '600',
    lineHeight: 19,
  },
});
