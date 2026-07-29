import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../../theme/tokens';

interface MobileBackgroundProps {
  children: React.ReactNode;
}

/**
 * 湖面の背景。Web版 .lake-bg（premium-surfaces.css）に対応する。
 * 上が白く澄み、下へ向かって淡い青が差す。
 *
 * Web版はこの上に .aurora-orb を4つ重ねるが、あれは blur(78px) で
 * ほとんど気配だけの光。RN には blur フィルタがなく、同じものを置くと
 * 輪郭のある円になって湖面の静けさを壊すため、ここでは敷かない。
 */
export function MobileBackground({ children }: MobileBackgroundProps) {
  return (
    <View style={styles.bg}>
      <LinearGradient
        colors={gradients.background}
        locations={gradients.backgroundLocations}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
});
