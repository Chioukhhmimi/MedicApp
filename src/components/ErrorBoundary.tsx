/**
 * ErrorBoundary — catches render / lifecycle errors below it and shows a
 * quiet, honest fallback instead of an unhandled red-screen.
 *
 * Used on the confirmation screen so that a database miss, notification-race,
 * or malformed occurrence never leaves the user staring at a broken UI on
 * their most-used flow. Screens that already have their own recovery UI
 * (e.g. edit form) don't need this.
 *
 * Class component because React Native does not yet ship a hook API for
 * error boundaries — this is intentional, not an oversight.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { colors, fontSize, spacing, textCaps } from '@/theme';

interface Props {
  children: React.ReactNode;
  /** Called when the user taps "Close" so the parent can dismiss the screen. */
  onReset: () => void;
  /** Optional custom title / message override for non-reminder contexts. */
  title?: string;
  message?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error): void {
    // In production this would go to Sentry; keep the console log as a
    // developer signal during Phase 1 since Sentry is stubbed.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error);
  }

  override render(): React.ReactNode {
    const { error } = this.state;
    const { children, onReset, title, message } = this.props;
    if (!error) return children;
    return (
      <View style={styles.wrap}>
        <Text {...textCaps.chrome} style={styles.kicker}>
          Something went wrong
        </Text>
        <Text {...textCaps.numeric} style={styles.title}>
          {title ?? 'This screen could not load'}
        </Text>
        <Text style={styles.body}>
          {message ??
            'The reminder could not be shown. Close this screen and open the reminder again.'}
        </Text>
        <Button
          label="Close"
          onPress={() => {
            this.setState({ error: null });
            onReset();
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  kicker: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.danger,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
