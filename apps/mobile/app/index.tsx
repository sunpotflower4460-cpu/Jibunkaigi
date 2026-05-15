import React, { useState } from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { MobileBackground } from '../components/layout/MobileBackground';
import { MobileAppShell } from '../components/layout/MobileAppShell';
import { MobileChatTimeline, type ChatMessage } from '../components/chat/MobileChatTimeline';
import { MobileEmptyState } from '../components/chat/MobileEmptyState';
import { MobileIntroScreen } from '../components/intro/MobileIntroScreen';
import { MobileComposer } from '../components/composer/MobileComposer';
import { MobileAgentControlBar, type AgentKey } from '../components/composer/MobileAgentControlBar';
import { colors, spacing, type as typeScale } from '../theme/tokens';

const AGENT_LABELS: Record<AgentKey, string> = {
  mirror: '心の鏡',
  delegate: '委ねる',
  ray: 'レイ',
  joe: 'ジョー',
  ken: 'ケン',
  mina: 'ミナ',
  satou: 'サトウ',
};

const DUMMY_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    text: '最近、なんとなく気持ちが落ち着かない気がして…',
  },
  {
    id: '2',
    role: 'agent',
    text: 'そうか。「なんとなく」という感覚、大事にしてみよう。\nそれはどんなとき、一番感じる？',
    agentLabel: 'レイ',
  },
];

export default function IndexScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentKey>('ray');
  const [showIntro, setShowIntro] = useState(true);
  const [showDummy, setShowDummy] = useState(false);

  function handleSend(text: string) {
    if (showIntro) setShowIntro(false);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
    };
    const agentMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'agent',
      text: 'ありがとう。もう少し聞かせてもらえる？',
      agentLabel: AGENT_LABELS[selectedAgent],
    };
    setMessages((prev) => [...prev, userMsg, agentMsg]);
    setShowDummy(false);
  }

  function handleHintSelect(hint: string) {
    setShowIntro(false);
    setShowDummy(true);
  }

  const displayMessages = showDummy ? DUMMY_MESSAGES : messages;

  return (
    <MobileAppShell>
      <MobileBackground>
        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>じぶん会議</Text>
              <Text style={styles.headerSub}>5つの視点で、じぶんに潜る</Text>
            </View>

            {/* Timeline or Intro */}
            <View style={styles.flex}>
              {showIntro ? (
                <MobileIntroScreen onHintSelect={handleHintSelect} />
              ) : displayMessages.length === 0 ? (
                <MobileEmptyState />
              ) : (
                <MobileChatTimeline messages={displayMessages} />
              )}
            </View>

            {/* Bottom controls */}
            <View style={styles.bottom}>
              <MobileAgentControlBar
                selected={selectedAgent}
                onSelect={setSelectedAgent}
              />
              <MobileComposer onSend={handleSend} />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </MobileBackground>
    </MobileAppShell>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typeScale.title,
    fontWeight: '700',
    color: colors.inkStrong,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: typeScale.small,
    color: colors.inkMuted,
    marginTop: spacing.xs,
    letterSpacing: 0.2,
  },
  bottom: {
    gap: 0,
  },
});
