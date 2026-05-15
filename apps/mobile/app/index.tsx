import React, { useState } from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  View,
  StyleSheet,
} from 'react-native';
import { MobileBackground } from '../components/layout/MobileBackground';
import { MobileAppShell } from '../components/layout/MobileAppShell';
import { MobileChatTimeline } from '../components/chat/MobileChatTimeline';
import { MobileEmptyState } from '../components/chat/MobileEmptyState';
import { MobileIntroScreen } from '../components/intro/MobileIntroScreen';
import { MobileComposer } from '../components/composer/MobileComposer';
import { MobileAgentControlBar } from '../components/composer/MobileAgentControlBar';
import { MobileSessionHeader } from '../components/session/MobileSessionHeader';
import { useMobileConversation } from '../state/useMobileConversation';

export default function IndexScreen() {
  const {
    session,
    messages,
    selectedAgent,
    isThinking,
    selectAgent,
    sendMessage,
    startFromHint,
    clearConversation,
    createNewSession,
  } = useMobileConversation();

  const [showIntro, setShowIntro] = useState(true);

  function handleSend(text: string) {
    if (showIntro) setShowIntro(false);
    sendMessage(text);
  }

  function handleHintSelect(hint: string) {
    setShowIntro(false);
    startFromHint(hint);
  }

  function handleNewSession() {
    setShowIntro(true);
    createNewSession();
  }

  function handleClear() {
    setShowIntro(false);
    clearConversation();
  }

  return (
    <MobileAppShell>
      <MobileBackground>
        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            {/* Session header with new/clear actions */}
            <MobileSessionHeader
              session={session}
              onNewSession={handleNewSession}
              onClear={handleClear}
            />

            {/* Timeline or Intro */}
            <View style={styles.flex}>
              {showIntro ? (
                <MobileIntroScreen onHintSelect={handleHintSelect} />
              ) : messages.length === 0 ? (
                <MobileEmptyState />
              ) : (
                <MobileChatTimeline
                  messages={messages}
                  isThinking={isThinking}
                  thinkingAgentId={selectedAgent}
                />
              )}
            </View>

            {/* Bottom controls */}
            <View style={styles.bottom}>
              <MobileAgentControlBar
                selected={selectedAgent}
                onSelect={selectAgent}
              />
              <MobileComposer
                onSend={handleSend}
                isThinking={isThinking}
              />
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
  bottom: {
    gap: 0,
  },
});
