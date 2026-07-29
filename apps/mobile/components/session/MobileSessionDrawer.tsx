import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  SafeAreaView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Feather, Plus, Users, X } from 'lucide-react-native';
import type { UniversalSession } from '../../state/mobileTypes';
import {
  sortUniversalSessions,
  type UniversalRuntimeStatus,
} from '@jibunkaigi/shared';
import {
  colors,
  mobileLayout,
  radius,
  shadow,
  spacing,
  type as typeScale,
} from '../../theme/tokens';
import { IconTile, PanelSurface, PrimaryButton } from '../ui/MobileSurfaces';
import { MobileSessionEditSheet } from './MobileSessionEditSheet';
import { MobileSessionListItem } from './MobileSessionListItem';
import { MobileLegalLinks } from '../settings/MobileLegalLinks';
import { MobileLegalSheet } from '../settings/MobileLegalSheet';
import { MobileStorageSheet } from '../settings/MobileStorageSheet';

interface MobileSessionDrawerProps {
  visible: boolean;
  sessions: UniversalSession[];
  activeSessionId: string;
  runtimeStatus: UniversalRuntimeStatus;
  onClose: () => void;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onNewSession: () => void;
  onRenameSession: (sessionId: string, title: string) => Promise<void>;
  onTogglePinSession: (sessionId: string) => Promise<void>;
  onCopyCurrentSession?: () => Promise<void>;
  onShareCurrentSession?: () => Promise<void>;
}

export function MobileSessionDrawer({
  visible,
  sessions,
  activeSessionId,
  runtimeStatus,
  onClose,
  onSelect,
  onDelete,
  onNewSession,
  onRenameSession,
  onTogglePinSession,
  onCopyCurrentSession,
  onShareCurrentSession,
}: MobileSessionDrawerProps) {
  const [editingSession, setEditingSession] = useState<UniversalSession | null>(null);
  const [legalSheetOpen, setLegalSheetOpen] = useState(false);
  const [storageSheetOpen, setStorageSheetOpen] = useState(false);
  const { width } = useWindowDimensions();
  const orderedSessions = useMemo(() => sortUniversalSessions(sessions), [sessions]);

  function handleSelect(id: string) {
    onSelect(id);
    onClose();
  }

  function handleNewSession() {
    onNewSession();
    onClose();
  }

  async function handleSaveTitle(title: string) {
    if (!editingSession) return;
    await onRenameSession(editingSession.id, title);
    setEditingSession(null);
  }

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <SafeAreaView
            style={[
              styles.drawer,
              Platform.OS === 'android' && styles.drawerAndroid,
              width < 420 && styles.drawerCompact,
            ]}
          >
            {/* Web版 Sidebar.jsx のロゴ帯（内なる会議 / じぶん会議） */}
            <View style={styles.drawerHeader}>
              <View style={styles.brandRow}>
                <IconTile size={40}>
                  <Users size={19} strokeWidth={1.75} color={colors.inkSoft} />
                </IconTile>
                <View style={styles.brandTexts}>
                  <Text style={styles.brandEyebrow}>内なる会議</Text>
                  <Text style={styles.brandTitle}>じぶん会議</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="セッション一覧を閉じる"
              >
                <X size={18} color={colors.inkMuted} />
              </TouchableOpacity>
            </View>

            <PrimaryButton
              label="新しい問い"
              onPress={handleNewSession}
              accessibilityLabel="新しい問いを始める"
              icon={<Plus size={16} color={colors.textOnAccent} />}
              style={styles.newBtn}
            />

            <View style={styles.exportRow}>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => {
                  void onCopyCurrentSession?.();
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="会話全体をコピー"
              >
                <Text style={styles.exportButtonText}>会話全体をコピー</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => {
                  void onShareCurrentSession?.();
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="会話全体を共有"
              >
                <Text style={styles.exportButtonText}>会話全体を共有</Text>
              </TouchableOpacity>
            </View>

            <MobileLegalLinks onOpenLegal={() => setLegalSheetOpen(true)} />
            <TouchableOpacity
              style={styles.storageButton}
              onPress={() => setStorageSheetOpen(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="保存状態とデータ削除の案内を開く"
            >
              <Text style={styles.storageButtonText}>保存状態 / データ削除</Text>
            </TouchableOpacity>

            <FlatList
              data={orderedSessions}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <MobileSessionListItem
                  session={item}
                  isActive={item.id === activeSessionId}
                  onOpen={() => handleSelect(item.id)}
                  onEdit={() => setEditingSession(item)}
                  onTogglePin={() => {
                    void onTogglePinSession(item.id);
                  }}
                  onDelete={() => onDelete(item.id)}
                />
              )}
              ListEmptyComponent={
                <PanelSurface style={styles.emptyPanel}>
                  <IconTile size={44} rounded style={styles.emptyIcon}>
                    <Feather size={18} strokeWidth={1.75} color={colors.inkFaint} />
                  </IconTile>
                  <Text style={styles.emptyTitle}>まだ保存された問いはありません。</Text>
                  <Text style={styles.emptySubtitle}>最初の問いが、ここに残ります。</Text>
                </PanelSurface>
              }
            />
          </SafeAreaView>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        </View>
      </Modal>

      <MobileSessionEditSheet
        visible={Boolean(editingSession)}
        title={editingSession?.title ?? ''}
        onClose={() => setEditingSession(null)}
        onSave={handleSaveTitle}
      />
      <MobileLegalSheet
        visible={legalSheetOpen}
        onClose={() => setLegalSheetOpen(false)}
      />
      <MobileStorageSheet
        visible={storageSheetOpen}
        status={runtimeStatus}
        onClose={() => setStorageSheetOpen(false)}
        onDataDeleted={() => {
          // Reset UI to a clean state after all data is wiped.
          onNewSession();
          onClose();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // Web版 Sidebar は左から出る（left-0 / -translate-x-full）
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  drawer: {
    width: '84%',
    maxWidth: mobileLayout.drawerMaxWidth,
    // Web版 .sidebar-shell の白〜淡青のグラデーション相当
    backgroundColor: 'rgba(246,250,255,0.98)',
    ...shadow.soft,
  },
  drawerCompact: {
    width: '92%',
    maxWidth: mobileLayout.drawerMaxWidth,
  },
  drawerAndroid: {
    paddingTop: spacing.xl,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  brandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 0,
  },
  brandTexts: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  brandEyebrow: {
    fontSize: typeScale.tiny,
    fontWeight: '900',
    color: colors.inkFaint,
    letterSpacing: 1.3,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.inkStrong,
    letterSpacing: -0.6,
  },
  closeBtn: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBtn: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  emptyPanel: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    borderRadius: radius.lg,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typeScale.small,
    fontWeight: '600',
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptySubtitle: {
    fontSize: typeScale.tiny,
    fontWeight: '500',
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  exportRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  exportButton: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceFaint,
    justifyContent: 'center',
  },
  exportButtonText: {
    fontSize: typeScale.tiny,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  storageButton: {
    minHeight: 44,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceFaint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storageButtonText: {
    fontSize: typeScale.tiny,
    fontWeight: '700',
    color: colors.inkMuted,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xs,
  },
});
