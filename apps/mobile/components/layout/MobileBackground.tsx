import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/tokens';

interface MobileBackgroundProps {
  children: React.ReactNode;
}

export function MobileBackground({ children }: MobileBackgroundProps) {
  return (
    <View style={styles.bg}>
      <View style={styles.gradientTop} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: colors.bgDeep,
    opacity: 0.5,
  },
});
