/**
 * Home dashboard — the upcoming reminders for the next two days, visually
 * grouped by time-of-day (Morning / Afternoon / Evening / Night) so the user
 * scans the day at a glance.
 *
 * Each row deep-links to the Confirmation screen for a quick Taken/Skip/Later.
 */
import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTime } from 'luxon';
import {
  PillIcon,
  PlusSignIcon,
  SparklesIcon,
} from '@hugeicons/core-free-icons';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { useUpcoming, type UpcomingItem } from '@/hooks/useUpcoming';
import { formatTimestamp } from '@/lib/dates';
import {
  bucketChip,
  bucketForHour,
  colors,
  fontSize,
  radius,
  shadow,
  spacing,
  type TimeBucket,
} from '@/theme';

const BUCKET_ORDER: TimeBucket[] = ['morning', 'afternoon', 'evening', 'night'];

interface BucketGroup {
  bucket: TimeBucket;
  items: UpcomingItem[];
}

export default function Home(): React.JSX.Element {
  const router = useRouter();
  const { items, loading, reload } = useUpcoming(2);

  // Refresh whenever the tab regains focus (e.g. after confirming a dose).
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const groups = useMemo<BucketGroup[]>(() => {
    const map = new Map<TimeBucket, UpcomingItem[]>();
    for (const item of items) {
      const hour = DateTime.fromISO(item.occurrence.scheduledTime).hour;
      const bucket = bucketForHour(hour);
      const arr = map.get(bucket) ?? [];
      arr.push(item);
      map.set(bucket, arr);
    }
    return BUCKET_ORDER.filter((b) => map.has(b)).map((bucket) => ({
      bucket,
      items: map.get(bucket)!,
    }));
  }, [items]);

  const greeting = useMemo(() => {
    const h = DateTime.local().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Good night';
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>{greeting}</Text>
          <Text style={styles.title}>
            Worry less.{'\n'}
            <Text style={styles.titleAccent}>Live healthier.</Text>
          </Text>
          <Text style={styles.subtitle}>
            Here are today&apos;s reminders, all in one place.
          </Text>
        </View>

        {groups.length === 0 && !loading ? (
          <View style={styles.empty}>
            <EmptyState
              title="Nothing due"
              message="No reminders in the next two days. Add a medication to get started."
              icon={SparklesIcon}
            />
            <Button
              label="Add medication"
              icon={PlusSignIcon}
              onPress={() => router.push('/medication/edit')}
            />
          </View>
        ) : (
          groups.map((group) => (
            <BucketSection
              key={group.bucket}
              group={group}
              onConfirm={(occurrenceId) =>
                router.push({
                  pathname: '/confirm',
                  params: { occurrenceId },
                })
              }
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function BucketSection({
  group,
  onConfirm,
}: {
  group: BucketGroup;
  onConfirm: (occurrenceId: string) => void;
}): React.JSX.Element {
  const chip = bucketChip[group.bucket];
  return (
    <View style={styles.section}>
      <View style={[styles.chip, { backgroundColor: chip.bg }]}>
        <Text style={[styles.chipText, { color: chip.fg }]}>{chip.label}</Text>
      </View>
      <View style={[styles.sectionCard, shadow]}>
        {group.items.map((item, idx) => (
          <ReminderRow
            key={item.occurrence.id}
            item={item}
            isLast={idx === group.items.length - 1}
            onConfirm={() => onConfirm(item.occurrence.id)}
          />
        ))}
      </View>
    </View>
  );
}

function ReminderRow({
  item,
  isLast,
  onConfirm,
}: {
  item: UpcomingItem;
  isLast: boolean;
  onConfirm: () => void;
}): React.JSX.Element {
  const { occurrence, medication } = item;
  const due = DateTime.fromISO(occurrence.scheduledTime);
  const isOverdue = due < DateTime.now();
  const accent = medication.pillColor ?? colors.primary;
  return (
    <Pressable
      onPress={onConfirm}
      accessibilityRole="button"
      accessibilityLabel={`${medication.name} due ${formatTimestamp(
        occurrence.scheduledTime,
      )}`}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowDivider,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.pill, { backgroundColor: `${accent}22` }]}>
        <Icon icon={PillIcon} size={20} color={accent} strokeWidth={1.75} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.medName}>{medication.name}</Text>
        <Text style={styles.dose}>
          {medication.doseQuantity} {medication.unit}
        </Text>
      </View>
      <View style={styles.timeWrap}>
        <Text style={[styles.time, isOverdue && styles.overdueText]}>
          {due.toFormat('h:mm a')}
        </Text>
        {isOverdue ? <Text style={styles.overdueTag}>Overdue</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    gap: spacing.lg,
    flexGrow: 1,
  },
  header: { gap: spacing.xs, marginBottom: spacing.xs },
  kicker: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: fontSize.display,
    fontWeight: '900',
    color: colors.text,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  titleAccent: { color: colors.primaryDark },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  section: { gap: spacing.sm },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sectionCard: {
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
  pill: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  medName: { fontSize: fontSize.body, fontWeight: '800', color: colors.text },
  dose: { fontSize: fontSize.sm, color: colors.textMuted },
  timeWrap: { alignItems: 'flex-end' },
  time: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  overdueText: { color: colors.danger },
  overdueTag: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '800',
    color: colors.danger,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
});
