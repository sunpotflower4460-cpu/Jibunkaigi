import React from 'react';
import { StyleSheet, View } from 'react-native';

const MIN_BOTTOM_SPACER = {
  collapsed: 176,
  open: 244,
  floatingExtra: 72,
} as const;

export interface MobileBottomSpacerProps {
  composerOpen: boolean;
  floatingBarVisible: boolean;
  height?: number;
}

export function getMinimumBottomSpacerHeight({
  composerOpen,
  floatingBarVisible,
}: Omit<MobileBottomSpacerProps, 'height'>) {
  const baseHeight = composerOpen ? MIN_BOTTOM_SPACER.open : MIN_BOTTOM_SPACER.collapsed;
  return baseHeight + (floatingBarVisible ? MIN_BOTTOM_SPACER.floatingExtra : 0);
}

export function MobileBottomSpacer({
  composerOpen,
  floatingBarVisible,
  height,
}: MobileBottomSpacerProps) {
  const minHeight = getMinimumBottomSpacerHeight({
    composerOpen,
    floatingBarVisible,
  });

  return <View style={[styles.spacer, { height: Math.max(height ?? 0, minHeight) }]} />;
}

const styles = StyleSheet.create({
  spacer: {
    width: '100%',
    flexShrink: 0,
  },
});
