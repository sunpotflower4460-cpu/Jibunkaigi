import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MobileMessageBubble, type MessageRole } from './MobileMessageBubble';
import { spacing } from '../../theme/tokens';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  agentLabel?: string;
}

interface MobileChatTimelineProps {
  messages: ChatMessage[];
}

export function MobileChatTimeline({ messages }: MobileChatTimelineProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {messages.map((msg) => (
        <MobileMessageBubble
          key={msg.id}
          role={msg.role}
          text={msg.text}
          agentLabel={msg.agentLabel}
        />
      ))}
      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.lg,
  },
  bottomPad: {
    height: spacing.xxl,
  },
});
