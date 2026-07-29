import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, X } from 'lucide-react-native';
import { UNIVERSAL_COMPOSER_LABELS } from '@jibunkaigi/shared';
import {
  colors,
  gradients,
  mobileLineHeights,
  mobileMotion,
  mobileTouchTarget,
  radius,
  spacing,
  shadow,
  type as typeScale,
} from '../../theme/tokens';

interface MobileComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  isThinking?: boolean;
  placeholder?: string;
  visible: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  // Phase 2.5: lets the caller frame the send action as "委ねる" (entrust)
  // rather than a plain chat send, without restructuring the input.
  sendAccessibilityLabel?: string;
  // Phase 2.5: a small status line shown above the input (e.g. when the entry
  // point is '委ねる', "場にまかせる" so the user senses this is not a normal send).
  composerStatusLabel?: string;
}

export function MobileComposer({
  onSend,
  disabled = false,
  isThinking = false,
  placeholder = UNIVERSAL_COMPOSER_LABELS.placeholder,
  visible,
  onOpen,
  onClose,
  sendAccessibilityLabel = 'メッセージを送信',
  composerStatusLabel,
}: MobileComposerProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const canSend = text.trim().length > 0 && !disabled && !isThinking;

  useEffect(() => {
    if (!visible) return undefined;
    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, mobileMotion.focusDelay);
    return () => clearTimeout(timeoutId);
  }, [visible]);

  function handleSend() {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
    onClose?.();
  }

  if (!visible) {
    return (
      <View style={styles.wrapper}>
        <TouchableOpacity
          style={styles.collapsedButton}
          onPress={onOpen}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={UNIVERSAL_COMPOSER_LABELS.open}
        >
          <Text style={styles.collapsedLabel}>{UNIVERSAL_COMPOSER_LABELS.open}</Text>
          <Text style={styles.collapsedHint}>{UNIVERSAL_COMPOSER_LABELS.collapsedHint}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="入力欄を閉じる"
        >
          <X size={16} color={colors.inkMuted} />
          <Text style={styles.closeLabel}>{UNIVERSAL_COMPOSER_LABELS.close}</Text>
        </TouchableOpacity>
      </View>
      {composerStatusLabel ? (
        <Text style={styles.statusLabel} accessibilityRole="text">
          {composerStatusLabel}
        </Text>
      ) : null}
      <View style={styles.row}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={isThinking ? '応答を待っています…' : placeholder}
          placeholderTextColor={colors.inkFaint}
          multiline
          returnKeyType="default"
          blurOnSubmit={false}
          editable={!disabled && !isThinking}
          textAlignVertical="top"
        />
        <TouchableOpacity
          onPress={handleSend}
          activeOpacity={0.85}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={sendAccessibilityLabel}
          accessibilityState={{ disabled: !canSend }}
          style={[styles.sendButtonWrap, !canSend && styles.sendButtonDisabled]}
        >
          {/* Web版 Composer.jsx の送信ボタンは .cta-primary-surface（紺グラデ・rounded-xl） */}
          <LinearGradient colors={gradients.cta} style={styles.sendButton}>
            <Send size={17} color={colors.textOnAccent} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: spacing.sm,
  },
  closeButton: {
    minHeight: mobileTouchTarget.minimum,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceFaint,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  closeLabel: {
    fontSize: typeScale.small,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  statusLabel: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
    fontSize: typeScale.tiny,
    color: colors.inkMuted,
    letterSpacing: 0.4,
  },
  // Web版 .agent-chip（「綴る」）に揃える
  collapsedButton: {
    minHeight: mobileTouchTarget.comfortable,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(252,253,255,0.78)',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    justifyContent: 'center',
    ...shadow.soft,
  },
  collapsedLabel: {
    fontSize: typeScale.small,
    fontWeight: '900',
    color: colors.inkSoft,
  },
  collapsedHint: {
    marginTop: 2,
    fontSize: typeScale.tiny,
    color: colors.inkMuted,
    lineHeight: mobileLineHeights.tiny,
  },
  // Web版 .composer-shell — 白い霧ガラスの入力面
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.82)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadow.soft,
    minHeight: 64,
  },
  input: {
    flex: 1,
    fontSize: typeScale.body,
    color: colors.inkMain,
    lineHeight: mobileLineHeights.compactBody,
    maxHeight: 120,
    paddingTop: Platform.OS === 'android' ? spacing.sm : spacing.xs,
    paddingBottom: spacing.xs,
    marginRight: spacing.sm,
  },
  sendButtonWrap: {
    alignSelf: 'flex-end',
    borderRadius: radius.xs,
    ...shadow.ctaGlow,
  },
  sendButton: {
    width: mobileTouchTarget.minimum,
    height: mobileTouchTarget.minimum,
    // Web版は rounded-xl（丸ではなく角丸の四角）
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.28)',
  },
  sendButtonDisabled: {
    opacity: 0.3,
  },
});
