import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  colors,
  gradients,
  radius,
  shadow,
  spacing,
  type as typeScale,
} from '../../theme/tokens';

/**
 * Web版 premium-surfaces.css の面を RN に移した共通パーツ。
 * 画面ごとに背景色や影を書かず、必ずここを経由させることで見た目を揃える。
 */

interface ChildrenProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** .icon-tile — 白い霧ガラスのアイコン台座 */
export function IconTile({
  size = 72,
  rounded = false,
  children,
  style,
}: ChildrenProps & { size?: number; rounded?: boolean }) {
  return (
    <LinearGradient
      colors={gradients.iconTile}
      start={{ x: 0.28, y: 0.18 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.iconTile,
        {
          width: size,
          height: size,
          borderRadius: rounded ? size / 2 : radius.lg,
        },
        shadow.iconTile,
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}

/** .panel-surface / .soft-panel — ガラスのパネル */
export function PanelSurface({ children, style }: ChildrenProps) {
  return <View style={[styles.panelSurface, shadow.soft, style]}>{children}</View>;
}

/** .keyline-card — キャッチコピーを囲む霧ガラス枠 */
export function KeylineCard({ children, style }: ChildrenProps) {
  return <View style={[styles.keylineCard, shadow.soft, style]}>{children}</View>;
}

/** .header-shell — 上部ヘッダーのガラス帯 */
export function HeaderShell({ children, style }: ChildrenProps) {
  return <View style={[styles.headerShell, shadow.header, style]}>{children}</View>;
}

/** .neu-concave — モード選択などのくぼんだ土台 */
export function NeuConcave({ children, style }: ChildrenProps) {
  return <View style={[styles.neuConcave, style]}>{children}</View>;
}

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  /** 先頭に置くアイコン（lucide 要素） */
  icon?: React.ReactNode;
  /** 末尾に置くアイコン（lucide 要素） */
  trailingIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * .action-primary / .cta-primary-surface — 主要アクション。
 * Web版の主要ボタンは単色インディゴではなく紺のグラデーションなので、それに揃える。
 */
export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
  icon,
  trailingIcon,
  style,
  textStyle,
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={[styles.primaryShadow, shadow.ctaGlow, disabled && styles.primaryDisabled, style]}
    >
      <LinearGradient colors={gradients.cta} style={styles.primaryInner}>
        {icon}
        <Text style={[styles.primaryLabel, textStyle]}>{label}</Text>
        {trailingIcon}
      </LinearGradient>
    </TouchableOpacity>
  );
}

interface PlainButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Web版のダイアログ副ボタン（枠のない、静かな取り消し） */
export function GhostButton({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
  style,
}: PlainButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={[styles.ghost, disabled && styles.primaryDisabled, style]}
    >
      <Text style={styles.ghostLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/** 枠付きの副ボタン（並列に置く選択肢用） */
export function SecondaryButton({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
  style,
}: PlainButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={[styles.secondary, disabled && styles.primaryDisabled, style]}
    >
      <Text style={styles.secondaryLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/** .modal-shell — ボトムシート / ダイアログの面 */
export function ModalShell({ children, style }: ChildrenProps) {
  return <View style={[styles.modalShell, shadow.soft, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  iconTile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    overflow: 'hidden',
  },
  panelSurface: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
  },
  keylineCard: {
    backgroundColor: 'rgba(252,253,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  headerShell: {
    backgroundColor: 'rgba(252,253,255,0.72)',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
  },
  neuConcave: {
    backgroundColor: 'rgba(232,240,250,0.66)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.44)',
    borderRadius: radius.md,
  },
  primaryShadow: {
    borderRadius: radius.lg,
  },
  primaryDisabled: {
    opacity: 0.4,
  },
  primaryInner: {
    minHeight: 52,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.28)',
  },
  primaryLabel: {
    color: colors.textOnAccent,
    fontSize: typeScale.small,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  ghost: {
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  ghostLabel: {
    color: colors.inkMuted,
    fontSize: typeScale.small,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  secondary: {
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.62)',
  },
  secondaryLabel: {
    color: colors.inkSoft,
    fontSize: typeScale.small,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  modalShell: {
    // Web版 .modal-shell
    backgroundColor: 'rgba(252,253,255,0.98)',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
  },
});
