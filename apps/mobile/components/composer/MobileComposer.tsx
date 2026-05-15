import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Send } from 'lucide-react-native';
import { colors, radius, spacing, shadow, type as typeScale } from '../../theme/tokens';

interface MobileComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  isThinking?: boolean;
  placeholder?: string;
}

export function MobileComposer({
  onSend,
  disabled = false,
  isThinking = false,
  placeholder = 'ここに置いてみる…',
}: MobileComposerProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const canSend = text.trim().length > 0 && !disabled && !isThinking;

  function handleSend() {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
    inputRef.current?.focus();
  }

  return (
    <View style={styles.wrapper}>
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
        {canSend && (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Send size={18} color="#ffffff" />
          </TouchableOpacity>
        )}
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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadow.soft,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: typeScale.body,
    color: colors.inkMain,
    lineHeight: 22,
    maxHeight: 120,
    paddingTop: Platform.OS === 'android' ? spacing.sm : 0,
    paddingBottom: 0,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.accentIndigo,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: 0,
  },
});
