// TODO: Consider migrating to FlatList for large conversation histories.
import React, { useRef, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MobileMessageBubble, type MessageRole } from './MobileMessageBubble';
import { MobileThinkingIndicator } from './MobileThinkingIndicator';
import type { MobileAgentId } from '../../state/mobileTypes';
import { spacing } from '../../theme/tokens';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  agentId?: MobileAgentId;
  agentLabel?: string;
}

interface MobileChatTimelineProps {
  messages: ChatMessage[];
  isThinking?: boolean;
  thinkingAgentId?: MobileAgentId;
}

export function MobileChatTimeline({
  messages,
  isThinking = false,
  thinkingAgentId = 'ray',
}: MobileChatTimelineProps) {
  const scrollRef = useRef<ScrollView>(null);

  // Scroll to bottom whenever messages change or thinking state changes.
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, isThinking]);

  return (
    // TODO: FlatList candidate when message count grows large.
    <ScrollView
      ref={scrollRef}
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
      {isThinking && <MobileThinkingIndicator agentId={thinkingAgentId} />}
      {/* Bottom padding so last message is not hidden by the composer */}
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
