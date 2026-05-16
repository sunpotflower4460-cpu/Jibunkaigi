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
import { MobileSessionDrawer } from '../components/session/MobileSessionDrawer';
import { MobileModeSelector } from '../components/modes/MobileModeSelector';
import { MobileAiStatusBadge } from '../components/status/MobileAiStatusBadge';
import { MobileOthersTrigger } from '../components/others/MobileOthersTrigger';
import { MobileMemberSheet } from '../components/members/MobileMemberSheet';
import { useUniversalConversation } from '../state/useUniversalConversation';

export default function IndexScreen() {
  const {
    session,
    sessions,
    messages,
    selectedAgent,
    selectedMode,
    isThinking,
    isLoadingOthers,
    aiSource,
    selectAgent,
    selectMode,
    sendMessage,
    requestOthers,
    startFromHint,
    clearConversation,
    createNewSession,
    switchSession,
    deleteSession,
  } = useUniversalConversation();

  const [showIntro, setShowIntro] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [memberSheetOpen, setMemberSheetOpen] = useState(false);

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

  async function handleSwitchSession(sessionId: string) {
    await switchSession(sessionId);
    setShowIntro(false);
  }

  async function handleDeleteSession(sessionId: string) {
    await deleteSession(sessionId);
    setShowIntro(true);
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
            {/* Session header with new/clear/member actions and drawer toggle */}
            <MobileSessionHeader
              session={session}
              onNewSession={handleNewSession}
              onClear={handleClear}
              onOpenDrawer={() => setDrawerOpen(true)}
              onOpenMembers={() => setMemberSheetOpen(true)}
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

            {/* AI source indicator (dev only) */}
            <MobileAiStatusBadge source={aiSource} />

            {/* Bottom controls */}
            <View style={styles.bottom}>
              <MobileModeSelector
                selected={selectedMode}
                onSelect={selectMode}
              />
              <MobileAgentControlBar
                selected={selectedAgent}
                onSelect={selectAgent}
              />
              <MobileOthersTrigger
                disabled={messages.length === 0 || isThinking}
                isLoading={isLoadingOthers}
                onPress={requestOthers}
              />
              <MobileComposer
                onSend={handleSend}
                isThinking={isThinking}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </MobileBackground>

      {/* Session history drawer */}
      <MobileSessionDrawer
        visible={drawerOpen}
        sessions={sessions}
        activeSessionId={session.id}
        onClose={() => setDrawerOpen(false)}
        onSelect={handleSwitchSession}
        onDelete={handleDeleteSession}
        onNewSession={handleNewSession}
      />

      {/* Member explanation sheet */}
      <MobileMemberSheet
        visible={memberSheetOpen}
        onClose={() => setMemberSheetOpen(false)}
      />
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
