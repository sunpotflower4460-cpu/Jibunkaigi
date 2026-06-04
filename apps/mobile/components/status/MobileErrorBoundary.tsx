import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing, type as typeScale } from '../../theme/tokens';

interface MobileErrorBoundaryProps {
  children: React.ReactNode;
}

interface MobileErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches unhandled render-time errors so the whole app doesn't drop to a
 * blank (or red, in dev) screen. Wraps the root navigator in app/_layout.tsx.
 * Recovery resets the boundary state to re-mount the subtree — there is no
 * page reload on native, so retrying re-renders the children in place.
 */
export class MobileErrorBoundary extends React.Component<
  MobileErrorBoundaryProps,
  MobileErrorBoundaryState
> {
  constructor(props: MobileErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): MobileErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Preserved error log — surfaces the crash + component stack for diagnosis.
    console.error('[MobileErrorBoundary] Uncaught render error', error, info?.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.root}>
        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">
            予期せぬエラーが発生しました
          </Text>
          <Text style={styles.body}>
            アプリの表示中に問題が起きました。{'\n'}
            もう一度ひらくと、ほとんどの場合は元に戻ります。
          </Text>
          {this.state.error?.message ? (
            <Text style={styles.detail} numberOfLines={4}>
              {this.state.error.message}
            </Text>
          ) : null}
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={this.handleRetry}
            accessibilityRole="button"
            accessibilityLabel="もう一度ひらく"
          >
            <Text style={styles.buttonLabel}>もう一度ひらく</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgBase,
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.md,
    ...shadow.soft,
  },
  title: {
    fontSize: typeScale.body,
    fontWeight: '800',
    color: colors.inkStrong,
  },
  body: {
    fontSize: typeScale.small,
    lineHeight: 20,
    color: colors.inkSoft,
  },
  detail: {
    fontSize: typeScale.tiny,
    lineHeight: 16,
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  button: {
    marginTop: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.accentIndigo,
  },
  buttonPressed: {
    backgroundColor: colors.accentViolet,
  },
  buttonLabel: {
    fontSize: typeScale.small,
    fontWeight: '700',
    color: colors.textOnAccent,
  },
});

export default MobileErrorBoundary;
