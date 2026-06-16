import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  type LayoutAnimationConfig,
} from 'react-native';
import { mobileMotion } from '../../theme/tokens';

// LayoutAnimation needs to be explicitly enabled on (old-architecture) Android.
// This is a no-op on iOS and harmless when called more than once.
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LAYOUT_ANIMATION: LayoutAnimationConfig = {
  duration: mobileMotion.duration.base,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
  },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
};

interface MobileCollapsibleProps {
  expanded: boolean;
  children: React.ReactNode;
}

/**
 * Phase 2 (4): smoothly expands / collapses the demoted manual controls.
 *
 * - The surrounding height change is animated with LayoutAnimation so the
 *   bottom dock grows / shrinks fluidly (it also drives the onLayout-based
 *   dock-height measurement in index.tsx, which then settles).
 * - The content itself fades in / out via an Animated opacity so it does not
 *   pop in abruptly.
 * - Children are kept mounted until the fade-out finishes, then unmounted so
 *   collapsed state takes up no space.
 */
export function MobileCollapsible({ expanded, children }: MobileCollapsibleProps) {
  const opacity = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const [mounted, setMounted] = useState(expanded);
  // Skip animating the very first render so the initial (collapsed) state does
  // not flash a layout animation on screen mount.
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    LayoutAnimation.configureNext(LAYOUT_ANIMATION);

    if (expanded) {
      setMounted(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: mobileMotion.duration.base,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: mobileMotion.duration.quick,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setMounted(false);
        }
      });
    }
  }, [expanded, opacity]);

  if (!mounted) {
    return null;
  }

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}
