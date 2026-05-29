import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobileBackground } from '../components/layout/MobileBackground';
import { MobileAppShell } from '../components/layout/MobileAppShell';
import { MobileSafeLayout } from '../components/layout/MobileSafeLayout';
import { MobileChatTimeline } from '../components/chat/MobileChatTimeline';
import { MobileEmptyState } from '../components/chat/MobileEmptyState';
import { MobileIntroScreen } from '../components/intro/MobileIntroScreen';
import { MobileOnboardingScreen } from '../components/onboarding/MobileOnboardingScreen';
import { MobileComposer } from '../components/composer/MobileComposer';
import { MobileAgentControlBar } from '../components/composer/MobileAgentControlBar';
import { MobileFloatingAgentBar } from '../components/composer/MobileFloatingAgentBar';
import { MobileSessionHeader } from '../components/session/MobileSessionHeader';
import { MobileSessionDrawer } from '../components/session/MobileSessionDrawer';
import { MobileModeSelector } from '../components/modes/MobileModeSelector';
import { MobileConfigNotice } from '../components/status/MobileConfigNotice';
import { MobileErrorNotice } from '../components/status/MobileErrorNotice';
import { MobileLoadingOverlay } from '../components/status/MobileLoadingOverlay';
import { MobileStatusStrip } from '../components/status/MobileStatusStrip';
import { MobileOthersTrigger } from '../components/others/MobileOthersTrigger';
import { MobileMemberSheet } from '../components/members/MobileMemberSheet';
import { MobileUserNameSheet } from '../components/user/MobileUserNameSheet';
import { useUniversalConversation } from '../state/useUniversalConversation';
import { useUniversalOnboarding } from '../state/useUniversalOnboarding';
import { DEFAULT_USER_NAME } from '@jibunkaigi/shared';
import { colors, spacing, mobileLayout, shadow } from '../theme/tokens';

export default function IndexScreen() {
  const insets = useSafeAreaInsets();
  const {
    hasCompletedOnboarding,
    userName,
    setUserName,
    completeOnboarding,
    isLoadingProfile,
  } = useUniversalOnboarding();
  const {
    session,
    sessions,
    messages,
    composerVisibility,
    isComposerOpen,
    selectedAgent,
    selectedMode,
    isThinking,
    isLoadingOthers,
    isLoadingSessions,
    runtimeStatus,
    openComposer,
    closeComposer,
    selectAgent,
    selectMode,
    sendMessage,
    requestOthers,
    deleteMessage,
    startFromHint,
    clearConversation,
    createNewSession,
    switchSession,
    deleteSession,
    renameSession,
    togglePinSession,
    copyMessage,
    shareMessage,
    copyCurrentSession,
    shareCurrentSession,
  } = useUniversalConversation({ userName });

  const [showIntro, setShowIntro] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [memberSheetOpen, setMemberSheetOpen] = useState(false);
  const [userNameSheetOpen, setUserNameSheetOpen] = useState(false);
  const [userNameDraft, setUserNameDraft] = useState('');
  const [onboardingUserName, setOnboardingUserName] = useState('');
  const [bottomDockHeight, setBottomDockHeight] = useState(0);
  const [floatingBarHeight, setFloatingBarHeight] = useState(0);

  const hasUserMessages = messages.some((message) => message.role === 'user');
  const floatingBarVisible = hasUserMessages;
  const timelineBottomOffset = bottomDockHeight + floatingBarHeight + spacing.lg;

  useEffect(() => {
    const nextDraft = userName === DEFAULT_USER_NAME ? '' : userName;
    setUserNameDraft(nextDraft);
    setOnboardingUserName(nextDraft);
  }, [userName]);

  useEffect(() => {
    if (messages.length > 0) {
      setShowIntro(false);
    }
  }, [messages.length]);

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

  async function handleCompleteOnboarding() {
    await setUserName(onboardingUserName);
    await completeOnboarding();
  }

  async function handleSaveUserName() {
    await setUserName(userNameDraft);
    setUserNameSheetOpen(false);
  }

  if (isLoadingProfile) {
    return (
      <MobileAppShell>
        <MobileBackground>
          <MobileSafeLayout>
            <View style={styles.loadingScreen}>
              <MobileLoadingOverlay visible />
            </View>
          </MobileSafeLayout>
        </MobileBackground>
      </MobileAppShell>
    );
  }

  if (!hasCompletedOnboarding) {
    return (
      <MobileAppShell>
        <MobileBackground>
          <MobileSafeLayout>
            <MobileOnboardingScreen
              userName={onboardingUserName}
              onChangeUserName={setOnboardingUserName}
              onComplete={handleCompleteOnboarding}
            />
          </MobileSafeLayout>
        </MobileBackground>
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell>
      <MobileBackground>
        <MobileSafeLayout>
          <View style={styles.flex}>
            <MobileSessionHeader
              session={session}
              onNewSession={handleNewSession}
              onClear={handleClear}
              onOpenDrawer={() => setDrawerOpen(true)}
              onOpenMembers={() => setMemberSheetOpen(true)}
              userName={userName}
              onOpenUserName={() => setUserNameSheetOpen(true)}
            />

            <MobileConfigNotice status={runtimeStatus} />
            <MobileErrorNotice status={runtimeStatus} />
            <MobileStatusStrip status={runtimeStatus} />

            <View style={styles.content}>
              {showIntro ? (
                <MobileIntroScreen onHintSelect={handleHintSelect} />
              ) : messages.length === 0 ? (
                <MobileEmptyState />
              ) : (
                <MobileChatTimeline
                  messages={messages}
                  isThinking={isThinking}
                  thinkingAgentId={selectedAgent}
                  onCopyMessage={(messageId) => {
                    void copyMessage(messageId);
                  }}
                  onShareMessage={(messageId) => {
                    void shareMessage(messageId);
                  }}
                  onDeleteMessage={(messageId) => {
                    void deleteMessage(messageId);
                  }}
                    onRequestOthers={(messageId) => {
                      void requestOthers(messageId);
                    }}
                    composerOpen={isComposerOpen}
                    floatingBarVisible={floatingBarVisible}
                    bottomOffset={timelineBottomOffset}
                  />
                )}
              <MobileFloatingAgentBar
                selectedAgent={selectedAgent}
                onSelectAgent={selectAgent}
                hasMessages={hasUserMessages}
                composerVisibility={composerVisibility}
                bottomDockHeight={bottomDockHeight}
                onHeightChange={setFloatingBarHeight}
              />
              <MobileLoadingOverlay visible={isLoadingSessions} />
            </View>

            <View
              style={[
                styles.bottomDock,
                { paddingBottom: Math.max(insets.bottom, spacing.sm) },
              ]}
              onLayout={(event) => {
                setBottomDockHeight(event.nativeEvent.layout.height);
              }}
            >
              <View style={styles.bottomPanel}>
                <MobileModeSelector
                  selected={selectedMode}
                  onSelect={selectMode}
                />
                <MobileAgentControlBar
                  selected={selectedAgent}
                  onSelect={selectAgent}
                />
                <MobileOthersTrigger
                  disabled={!hasUserMessages || isThinking}
                  isLoading={isLoadingOthers}
                  onPress={() => {
                    void requestOthers();
                  }}
                />
                <MobileComposer
                  visible={isComposerOpen}
                  onOpen={openComposer}
                  onClose={closeComposer}
                  onSend={handleSend}
                  isThinking={isThinking}
                />
              </View>
            </View>
          </View>
        </MobileSafeLayout>
      </MobileBackground>

      <MobileSessionDrawer
        visible={drawerOpen}
        sessions={sessions}
        activeSessionId={session.id}
        onClose={() => setDrawerOpen(false)}
        onSelect={handleSwitchSession}
        onDelete={handleDeleteSession}
        onNewSession={handleNewSession}
        onRenameSession={renameSession}
        onTogglePinSession={togglePinSession}
        onCopyCurrentSession={copyCurrentSession}
        onShareCurrentSession={shareCurrentSession}
      />

      <MobileMemberSheet
        visible={memberSheetOpen}
        onClose={() => setMemberSheetOpen(false)}
      />
      <MobileUserNameSheet
        visible={userNameSheetOpen}
        userName={userNameDraft}
        onChange={setUserNameDraft}
        onClose={() => setUserNameSheetOpen(false)}
        onSave={handleSaveUserName}
      />
    </MobileAppShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  bottomDock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    alignItems: 'center',
  },
  bottomPanel: {
    width: '100%',
    maxWidth: mobileLayout.panelMaxWidth,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surfaceSoft,
    ...shadow.soft,
  },
  loadingScreen: {
    flex: 1,
  },
});
