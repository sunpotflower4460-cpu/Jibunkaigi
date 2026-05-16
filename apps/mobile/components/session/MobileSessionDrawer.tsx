import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import type { UniversalSession } from '../../state/mobileTypes';
import { colors, spacing, type as typeScale, radius, shadow } from '../../theme/tokens';

interface MobileSessionDrawerProps {
  visible: boolean;
  sessions: UniversalSession[];
  activeSessionId: string;
  onClose: () => void;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onNewSession: () => void;
}

export function MobileSessionDrawer({
  visible,
  sessions,
  activeSessionId,
  onClose,
  onSelect,
  onDelete,
  onNewSession,
}: MobileSessionDrawerProps) {
  function handleSelect(id: string) {
    onSelect(id);
    onClose();
  }

  function handleNewSession() {
    onNewSession();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <SafeAreaView style={[styles.drawer, Platform.OS === 'android' && styles.drawerAndroid]}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>会議の記録</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* New session button */}
          <TouchableOpacity
            style={styles.newBtn}
            onPress={handleNewSession}
            activeOpacity={0.75}
          >
            <Text style={styles.newBtnText}>＋ 新しい問いを始める</Text>
          </TouchableOpacity>

          {/* Session list */}
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const isActive = item.id === activeSessionId;
              return (
                <View style={[styles.row, isActive && styles.rowActive]}>
                  <TouchableOpacity
                    style={styles.rowContent}
                    onPress={() => handleSelect(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.rowTitle, isActive && styles.rowTitleActive]}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.rowDate}>
                      {new Date(item.updatedAt).toLocaleDateString('ja-JP')}
                    </Text>
                  </TouchableOpacity>
                  {!isActive && (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => onDelete(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.deleteBtnText}>削除</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>まだ会議がありません</Text>
            }
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
  },
  drawer: {
    width: '78%',
    maxWidth: 320,
    backgroundColor: colors.bgBase,
    ...shadow.soft,
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
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  drawerTitle: {
    fontSize: typeScale.heading,
    fontWeight: '700',
    color: colors.inkStrong,
    letterSpacing: -0.4,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeBtnText: {
    fontSize: typeScale.body,
    color: colors.inkMuted,
  },
  newBtn: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.accentIndigoSoft,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.accentIndigo,
    alignItems: 'center',
  },
  newBtnText: {
    fontSize: typeScale.small,
    fontWeight: '600',
    color: colors.accentIndigo,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  rowActive: {
    borderColor: colors.accentIndigo,
    backgroundColor: colors.accentIndigoSoft,
  },
  rowContent: {
    flex: 1,
    gap: spacing.xs,
  },
  rowTitle: {
    fontSize: typeScale.small,
    fontWeight: '500',
    color: colors.inkMain,
    lineHeight: 18,
  },
  rowTitleActive: {
    color: colors.accentIndigo,
    fontWeight: '600',
  },
  rowDate: {
    fontSize: typeScale.tiny,
    color: colors.inkFaint,
  },
  deleteBtn: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  deleteBtnText: {
    fontSize: typeScale.tiny,
    color: colors.inkFaint,
  },
  emptyText: {
    fontSize: typeScale.small,
    color: colors.inkFaint,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
