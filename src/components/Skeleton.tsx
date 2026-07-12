/**
 * Skeleton — subtle pulsing placeholder shown while data is loading.
 *
 * Uses the built-in Animated API (no reanimated dependency) so it's cheap
 * to install now and easy to swap once react-native-reanimated lands in
 * Phase 3. Respects reduced-motion by pinning opacity when the user has
 * requested less motion.
 */
import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing } from '@/theme';

interface BlockProps {
  width?: number | `${number}%`;
  height?: number;
  br?: number;
  style?: ViewStyle;
}

/** Single pulsing rectangle. Compose several to build a screen skeleton. */
export function SkeletonBlock({
  width = '100%',
  height = 16,
  br = radius.sm,
  style,
}: BlockProps): React.JSX.Element {
  const opacity = useRef(new Animated.Value(0.6)).current;
  const reducedMotion = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((rm) => {
      if (cancelled) return;
      reducedMotion.current = rm;
      if (rm) {
        opacity.setValue(0.75);
        return;
      }
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.5,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });
    return () => {
      cancelled = true;
      opacity.stopAnimation();
    };
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.block,
        { width, height, borderRadius: br, opacity },
        style,
      ]}
    />
  );
}

/** Home skeleton — hero heading + two grouped rows. */
export function TodaySkeleton(): React.JSX.Element {
  return (
    <View
      accessibilityLabel="Loading today's reminders"
      accessibilityRole="progressbar"
      style={styles.container}
    >
      <View style={styles.headerGroup}>
        <SkeletonBlock width={90} height={12} />
        <SkeletonBlock width={220} height={30} br={radius.md} />
        <SkeletonBlock width={180} height={16} />
      </View>
      <SkeletonRowGroup rows={2} />
      <SkeletonRowGroup rows={1} />
    </View>
  );
}

/** Medications skeleton — 4 stacked cards. */
export function MedicationsSkeleton(): React.JSX.Element {
  return (
    <View
      accessibilityLabel="Loading medications"
      accessibilityRole="progressbar"
      style={styles.container}
    >
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

/** History skeleton — segmented control + adherence card + log rows. */
export function HistorySkeleton(): React.JSX.Element {
  return (
    <View
      accessibilityLabel="Loading history"
      accessibilityRole="progressbar"
      style={styles.container}
    >
      <SkeletonBlock width="100%" height={44} br={radius.pill} />
      <View style={styles.adherenceCard}>
        <SkeletonBlock width={110} height={12} />
        <SkeletonBlock width={140} height={48} br={radius.md} />
        <View style={styles.statsRow}>
          <SkeletonBlock width={56} height={38} br={radius.sm} />
          <SkeletonBlock width={56} height={38} br={radius.sm} />
          <SkeletonBlock width={56} height={38} br={radius.sm} />
        </View>
      </View>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.logRow}>
          <SkeletonBlock width={10} height={10} br={999} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <SkeletonBlock width="40%" height={12} />
            <SkeletonBlock width="70%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

function SkeletonRowGroup({ rows }: { rows: number }): React.JSX.Element {
  return (
    <View style={styles.section}>
      <SkeletonBlock width={90} height={22} br={radius.pill} />
      <View style={styles.card}>
        {Array.from({ length: rows }).map((_, idx) => (
          <View
            key={idx}
            style={[styles.row, idx < rows - 1 && styles.rowDivider]}
          >
            <SkeletonBlock width={40} height={40} br={radius.md} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <SkeletonBlock width="60%" height={14} />
              <SkeletonBlock width="40%" height={12} />
            </View>
            <SkeletonBlock width={44} height={18} />
          </View>
        ))}
      </View>
    </View>
  );
}

function SkeletonCard(): React.JSX.Element {
  return (
    <View style={styles.medCard}>
      <SkeletonBlock width={44} height={44} br={radius.md} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <SkeletonBlock width="55%" height={16} />
        <SkeletonBlock width="35%" height={12} />
        <SkeletonBlock width="70%" height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.mist,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  headerGroup: { gap: spacing.sm },
  section: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  adherenceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
});
