import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/tokens';

interface MobileAppShellProps {
  children: React.ReactNode;
}

export function MobileAppShell({ children }: MobileAppShellProps) {
  return (
    <View style={styles.shell}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    // 湖面グラデーションの一番上の色。MobileBackground が描画されるまでの下敷き。
    backgroundColor: colors.bgSurfaceTop,
  },
});
