// TODO: Consider migrating to FlatList for large conversation histories.
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { MobileMessageBubble, type MessageRole } from './MobileMessageBubble';
import { MobileEntrustConvergence } from './MobileEntrustConvergence';
import { MobileDeleteMessageSheet } from './MobileDeleteMessageSheet';
import { MobileBottomSpacer } from '../layout/MobileBottomSpacer';
import type { MobileAgentId, OthersPosition } from '../../state/mobileTypes';
import { spacing } from '../../theme/tokens';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  agentId?: MobileAgentId;
  agentLabel?: string;
  origin?: 'direct' | 'others';
  position?: OthersPosition;
}

interface MobileChatTimelineProps {
  messages: ChatMessage[];
  isThinking?: boolean;
  /** Phase 3A: OTHERS 読み込み中フラグ。各 bubble に渡して導線を disabled / loading 表示にする */
  isLoadingOthers?: boolean;
  thinkingAgentId?: MobileAgentId;
  onCopyMessage?: (messageId: string) => void;
  onShareMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void | Promise<void>;
  onRequestOthers?: (messageId?: string) => void | Promise<void>;
  composerOpen: boolean;
  floatingBarVisible: boolean;
  bottomOffset?: number;
}

export function MobileChatTimeline({
  messages,
  isThinking = false,
  isLoadingOthers = false,
  thinkingAgentId = 'ray',
  onCopyMessage,
  onShareMessage,
  onDeleteMessage,
  onRequestOthers,
  composerOpen,
  floatingBarVisible,
  bottomOffset,
}: MobileChatTimelineProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, isThinking]);

  return (
    <>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <MobileMessageBubble
            key={msg.id}
            messageId={msg.id}
            role={msg.role}
            text={msg.text}
            agentId={msg.agentId}
            agentLabel={msg.agentLabel}
            origin={msg.origin}
            position={msg.position}
            isThinking={isThinking}
            isLoadingOthers={isLoadingOthers}
            onCopy={onCopyMessage}
            onShare={onShareMessage}
            onDelete={onDeleteMessage ? (messageId) => setPendingDeleteId(messageId) : undefined}
            onRequestOthers={onRequestOthers
              ? (messageId) => {
                  void onRequestOthers(messageId);
                }
              : undefined}
          />
        ))}
        {isThinking && <MobileEntrustConvergence agentId={thinkingAgentId} />}
        <MobileBottomSpacer
          composerOpen={composerOpen}
          floatingBarVisible={floatingBarVisible}
          height={bottomOffset}
        />
      </ScrollView>
      <MobileDeleteMessageSheet
        visible={pendingDeleteId !== null}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) {
            void onDeleteMessage?.(pendingDeleteId);
          }
          setPendingDeleteId(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
});
