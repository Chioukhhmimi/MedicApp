/**
 * Home dashboard — the upcoming reminders for the next two days.
 * Each row deep-links to the Confirmation screen for a quick Taken/Skip/Later.
 */
import React, { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTime } from 'luxon';
import { PlusSignIcon, SparklesIcon } from '@hugeicons/core-free-icons';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { useUpcoming, type UpcomingItem } from '@/hooks/useUpcoming';
import { formatTimestamp } from '@/lib/dates';
import { colors, fontSize, radius, spacing } from '@/theme';

export default function Home(): React.JSX.Element {
  const router = useRouter();
  const { items, loading, reload } = useUpcoming(2);

  // Refresh whenever the tab regains focus (e.g. after confirming a dose).
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const renderItem = ({ item }: { item: UpcomingItem }): React.JSX.Element => {
    const { occurrence, medication } = item;
    const due = DateTime.fromISO(occurrence.scheduledTime);
    const isOverdue = due < DateTime.now();
    return (
      <View
        style={[styles.row, isOverdue && styles.overdue]}
        accessibilityLabel={`${medication.name} due ${formatTimestamp(
          occurrence.scheduledTime,
        )}`}
      >
        <View style={styles.rowBody}>
          <Text style={styles.medName}>{medication.name}</Text>
          <Text style={styles.dose}>
            {medication.doseQuantity} {medication.unit}
          </Text>
          <Text style={[styles.time, isOverdue && styles.overdueText]}>
            {isOverdue ? 'Overdue · ' : ''}
            {formatTimestamp(occurrence.scheduledTime)}
          </Text>
        </View>
        <Button
          label="Confirm"
          onPress={() =>
            router.push({
              pathname: '/confirm',
              params: { occurrenceId: occurrence.id },
            })
          }
          style={styles.confirmBtn}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.occurrence.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} />
        }
        ListHeaderComponent={
          items.length > 0 ? (
            <Text style={styles.header}>Next reminders</Text>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
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
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  header: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  overdue: { borderWidth: 1, borderColor: colors.danger },
  rowBody: { flex: 1, gap: 2 },
  medName: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  dose: { fontSize: fontSize.sm, color: colors.textMuted },
  time: { fontSize: fontSize.sm, color: colors.primary },
  overdueText: { color: colors.danger, fontWeight: '700' },
  confirmBtn: { paddingHorizontal: spacing.md },
  empty: { flex: 1, justifyContent: 'center', gap: spacing.md },
});
