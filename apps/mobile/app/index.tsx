import React, { useEffect, useMemo, useState } from 'react';
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
import { MobileManualControlsToggle } from '../components/composer/MobileManualControlsToggle';
import { MobileCollapsible } from '../components/composer/MobileCollapsible';
import { MobileFloatingAgentBar } from '../components/composer/MobileFloatingAgentBar';
import { MobileSessionHeader } from '../components/session/MobileSessionHeader';
import { MobileSessionDrawer } from '../components/session/MobileSessionDrawer';
import { MobileModeSelector } from '../components/modes/MobileModeSelector';
import { MobileConfigNotice } from '../components/status/MobileConfigNotice';
import { MobileErrorNotice } from '../components/status/MobileErrorNotice';
import { MobileLoadingOverlay } from '../components/status/MobileLoadingOverlay';
import { MobileStatusStrip } from '../components/status/MobileStatusStrip';
import { MobileSaveStatusBadge } from '../components/status/MobileSaveStatusBadge';
import { MobileOthersTrigger } from '../components/others/MobileOthersTrigger';
import { MobileMemberSheet } from '../components/members/MobileMemberSheet';
import { MobileUserNameSheet } from '../components/user/MobileUserNameSheet';
import { ReflectionShelfTrigger } from '../components/reflection/ReflectionShelfTrigger';
import { ReflectionShelfPanel } from '../components/reflection/ReflectionShelfPanel';
import { ConferenceRecordSheet } from '../components/reflection/ConferenceRecordSheet';
import { StickyNotesSheet } from '../components/reflection/StickyNotesSheet';
import { FloatingKeywordsSheet } from '../components/reflection/FloatingKeywordsSheet';
import { ThemeArchiveSheet } from '../components/reflection/ThemeArchiveSheet';
import { useReflectionShelf } from '../state/useReflectionShelf';
import { useUniversalConversation } from '../state/useUniversalConversation';
import { useUniversalOnboarding } from '../state/useUniversalOnboarding';
import { DEFAULT_USER_NAME } from '@jibunkaigi/shared';
import { colors, spacing, mobileLayout, radius, shadow } from '../theme/tokens';
import { createSelfReturnSeed } from '../utils/selfReturn';
import { buildKeywordField } from '../services/keywordField';
import { buildThemeArchive } from '../services/themeArchive';

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
    pendingResolvedAgentId,
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

  const {
    isOpen: reflectionShelfOpen,
    activePanel: reflectionShelfPanel,
    selectedKind,
    draftContent,
    stickyNotes,
    conferenceRecords,
    themeArchiveNotes,
    themeArchiveConferenceRecords,
    isSavingStickyNote,
    isSavingConferenceRecord,
    isRefreshingFloatingKeywords,
    isRefreshingThemeArchive,
    openShelf: openReflectionShelf,
    closeShelf: closeReflectionShelf,
    backToMenu: backToReflectionShelfMenu,
    openStickyNote,
    openConferenceRecords,
    openFloatingKeywords,
    openThemeArchive,
    selectConferenceSession,
    selectFloatingKeywordSession,
    refreshFloatingKeywords,
    refreshThemeArchive,
    setSelectedKind,
    setDraftContent,
    createStickyNote,
    deleteStickyNote,
    createConferenceRecord,
    deleteConferenceRecord,
    selectedSessionId,
  } = useReflectionShelf();

  const [showIntro, setShowIntro] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [memberSheetOpen, setMemberSheetOpen] = useState(false);
  const [userNameSheetOpen, setUserNameSheetOpen] = useState(false);
  const [userNameDraft, setUserNameDraft] = useState('');
  const [onboardingUserName, setOnboardingUserName] = useState('');
  const [bottomDockHeight, setBottomDockHeight] = useState(0);
  const [floatingBarHeight, setFloatingBarHeight] = useState(0);
  // Phase 2 (4): manual controls (mode / agent / OTHERS) are demoted from
  // permanent fixtures. With '委ねる' (delegate) as the default entry point they
  // stay collapsed until the user opts in to picking a voice/mode themselves.
  const [manualControlsExpanded, setManualControlsExpanded] = useState(false);

  const hasUserMessages = messages.some((message) => message.role === 'user');
  const selectedShelfSession = sessions.find((item) => item.id === selectedSessionId) ?? session;
  const canCreateConferenceRecord = selectedShelfSession.messages
    .some((message) => message.role === 'user' && message.text.trim());
  const floatingKeywords = useMemo(() => buildKeywordField({
    messages: selectedShelfSession.messages,
    conferenceRecords,
    stickyNotes,
  }), [conferenceRecords, selectedShelfSession.messages, stickyNotes]);
  const themeArchive = useMemo(() => buildThemeArchive({
    sessions,
    conferenceRecords: themeArchiveConferenceRecords,
    stickyNotes: themeArchiveNotes,
  }), [sessions, themeArchiveConferenceRecords, themeArchiveNotes]);
  const floatingKeywordSeed = floatingKeywords.slice(0, 6).map((item) => item.text).join(' / ');
  const themeArchiveSeed = themeArchive.themes.slice(0, 6).map((item) => item.keyword).join(' / ');
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
    // Phase 2.5: a new question returns the screen to the quiet '委ねる' entry,
    // so collapse the manual controls if the user had opened them.
    setManualControlsExpanded(false);
    createNewSession();
  }

  function handleClear() {
    setShowIntro(false);
    // Phase 2.5: same as new session — go back to the calm default surface.
    setManualControlsExpanded(false);
    clearConversation();
  }

  async function handleSwitchSession(sessionId: string) {
    // Phase 2.5: opening another session also returns to the collapsed default.
    setManualControlsExpanded(false);
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
            <MobileSaveStatusBadge status={runtimeStatus} />

            <View style={styles.content}>
              {showIntro ? (
                <MobileIntroScreen onHintSelect={handleHintSelect} />
              ) : messages.length === 0 ? (
                <MobileEmptyState />
              ) : (
                <MobileChatTimeline
                  messages={messages}
                  isThinking={isThinking}
                  // Phase 3A: OTHERS 読み込み中フラグを各 bubble に伝える。
                  isLoadingOthers={isLoadingOthers}
                  // Phase 2.5: prefer the concrete voice resolved at send time so
                  // the Thinking UI shows the actual speaker, not 'delegate'.
                  thinkingAgentId={pendingResolvedAgentId ?? selectedAgent}
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
                {/* Phase 2 (4): the manual controls are no longer permanent.
                    They live behind an opt-in toggle so the default surface
                    stays focused on '委ねる' (delegate) + composer. */}
                <MobileManualControlsToggle
                  expanded={manualControlsExpanded}
                  onToggle={() => setManualControlsExpanded((prev) => !prev)}
                />
                <MobileCollapsible expanded={manualControlsExpanded}>
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
                </MobileCollapsible>
                <MobileComposer
                  visible={isComposerOpen}
                  onOpen={openComposer}
                  onClose={closeComposer}
                  onSend={handleSend}
                  isThinking={isThinking}
                  // Phase 2.5: when the entry point is '委ねる', frame the send as
                  // entrusting the question to the room rather than a plain send.
                  sendAccessibilityLabel={
                    selectedAgent === 'delegate'
                      ? '問いを置いて委ねる'
                      : 'メッセージを送信'
                  }
                  composerStatusLabel={
                    selectedAgent === 'delegate'
                      ? '場にまかせる ― 問いを置くと、場に合う視点が応えます'
                      : undefined
                  }
                />
                <ReflectionShelfTrigger onPress={openReflectionShelf} />
              </View>
            </View>
          </View>
        </MobileSafeLayout>
      </MobileBackground>

      <MobileSessionDrawer
        visible={drawerOpen}
        sessions={sessions}
        activeSessionId={session.id}
        runtimeStatus={runtimeStatus}
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
      <ReflectionShelfPanel
        visible={reflectionShelfOpen && reflectionShelfPanel === 'menu'}
        onClose={closeReflectionShelf}
        onOpenStickyNotes={() => {
          void openStickyNote({ sessionId: session.id, kind: 'question' });
        }}
        onOpenConferenceRecords={() => {
          void openConferenceRecords({ sessionId: session.id });
        }}
        onOpenFloatingKeywords={() => {
          void openFloatingKeywords({ sessionId: session.id });
        }}
        onOpenThemeArchive={() => {
          void openThemeArchive({ sessionId: session.id });
        }}
      />
      <ConferenceRecordSheet
        visible={reflectionShelfOpen && reflectionShelfPanel === 'conferenceRecords'}
        onClose={closeReflectionShelf}
        onBack={backToReflectionShelfMenu}
        sessions={sessions}
        selectedSessionId={selectedSessionId}
        onSelectSession={(sessionId) => {
          void selectConferenceSession(sessionId);
        }}
        onCreate={async () => createConferenceRecord({
          sessionTitle: selectedShelfSession.title,
          messages: selectedShelfSession.messages,
        })}
        records={conferenceRecords}
        onDelete={deleteConferenceRecord}
        onOpenStickyNote={(record) => {
          void openStickyNote({
            sessionId: record.sessionId,
            kind: 'question',
            seedText: createSelfReturnSeed(record),
          });
        }}
        canCreate={canCreateConferenceRecord}
        isSaving={isSavingConferenceRecord}
      />
      <FloatingKeywordsSheet
        visible={reflectionShelfOpen && reflectionShelfPanel === 'floatingKeywords'}
        onClose={closeReflectionShelf}
        onBack={backToReflectionShelfMenu}
        sessions={sessions}
        selectedSessionId={selectedSessionId}
        onSelectSession={(sessionId) => {
          void selectFloatingKeywordSession(sessionId);
        }}
        keywords={floatingKeywords}
        onRefresh={() => {
          void refreshFloatingKeywords();
        }}
        isRefreshing={isRefreshingFloatingKeywords}
        onOpenStickyNote={() => {
          const seedText = floatingKeywordSeed
            ? `この言葉の水面を見て、私はどう思う？\n\n浮かんだ言葉: ${floatingKeywordSeed}`
            : 'この言葉の水面を見て、私はどう思う？';
          void openStickyNote({
            sessionId: selectedShelfSession.id,
            kind: 'question',
            seedText,
          });
        }}
      />
      <StickyNotesSheet
        visible={reflectionShelfOpen && reflectionShelfPanel === 'stickyNotes'}
        sessionTitle={selectedShelfSession.title}
        selectedKind={selectedKind}
        draftContent={draftContent}
        stickyNotes={stickyNotes}
        isSaving={isSavingStickyNote}
        onBack={backToReflectionShelfMenu}
        onClose={closeReflectionShelf}
        onSelectKind={setSelectedKind}
        onChangeDraft={setDraftContent}
        onCreate={() => {
          void createStickyNote();
        }}
        onDelete={(noteId) => {
          void deleteStickyNote(noteId);
        }}
      />
      <ThemeArchiveSheet
        visible={reflectionShelfOpen && reflectionShelfPanel === 'themeArchive'}
        onClose={closeReflectionShelf}
        onBack={backToReflectionShelfMenu}
        archive={themeArchive}
        onRefresh={() => {
          void refreshThemeArchive();
        }}
        isRefreshing={isRefreshingThemeArchive}
        onOpenStickyNote={() => {
          const seedText = themeArchiveSeed
            ? `この輪郭を見て、私はどう思う？\n\n浮かんでいるテーマ: ${themeArchiveSeed}`
            : 'この輪郭を見て、私はどう思う？';
          void openStickyNote({
            sessionId: selectedShelfSession.id,
            kind: 'question',
            seedText,
          });
        }}
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    alignItems: 'center',
  },
  // Web版の下部は面を張らず、入力欄と操作バーが湖面に浮かぶ。
  // モバイルはキーボード回避のためドックにするが、面は最小限の霧ガラスに留める。
  bottomPanel: {
    width: '100%',
    maxWidth: mobileLayout.panelMaxWidth,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: 'rgba(252,253,255,0.72)',
    ...shadow.soft,
  },
  loadingScreen: {
    flex: 1,
  },
});
