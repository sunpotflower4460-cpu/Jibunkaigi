import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Send, X } from 'lucide-react-native';
import { UNIVERSAL_COMPOSER_LABELS } from '@jibunkaigi/shared';
import { useT } from '../../i18n';
import {
  colors,
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
}

export function MobileComposer({
  onSend,
  disabled = false,
  isThinking = false,
  placeholder = UNIVERSAL_COMPOSER_LABELS.placeholder,
  visible,
  onOpen,
  onClose,
}: MobileComposerProps) {
  const t = useT();
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
          accessibilityLabel={t('composer.close.aria')}
        >
          <X size={16} color={colors.inkMuted} />
          <Text style={styles.closeLabel}>{UNIVERSAL_COMPOSER_LABELS.close}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={isThinking ? t('composer.waiting') : placeholder}
          placeholderTextColor={colors.inkFaint}
          multiline
          returnKeyType="default"
          blurOnSubmit={false}
          editable={!disabled && !isThinking}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={handleSend}
          activeOpacity={0.75}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={t('composer.send.aria')}
        >
          <Send size={18} color={colors.textOnAccent} />
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
    borderColor: colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  closeLabel: {
    fontSize: typeScale.small,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  collapsedButton: {
    minHeight: mobileTouchTarget.comfortable,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    justifyContent: 'center',
    ...shadow.soft,
  },
  collapsedLabel: {
    fontSize: typeScale.small,
    fontWeight: '600',
    color: colors.accentIndigo,
  },
  collapsedHint: {
    marginTop: 2,
    fontSize: typeScale.tiny,
    color: colors.inkMuted,
    lineHeight: mobileLineHeights.tiny,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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
  sendButton: {
    width: mobileTouchTarget.minimum,
    height: mobileTouchTarget.minimum,
    borderRadius: radius.full,
    backgroundColor: colors.accentIndigo,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  sendButtonDisabled: {
    backgroundColor: colors.inkGhost,
  },
});
