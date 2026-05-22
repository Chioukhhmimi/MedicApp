/**
 * Medication list — grouped into Active and Paused sections (Feature 1).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { SectionList, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlusSignIcon } from '@hugeicons/core-free-icons';
import { MedicationCard } from '@/components/MedicationCard';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { useMedStore } from '@/store/useMedStore';
import { describeRule } from '@/lib/scheduler';
import { colors, fontSize, spacing } from '@/theme';
import type { Medication } from '@/lib/types';

export default function Medications(): React.JSX.Element {
  const router = useRouter();
  const medications = useMedStore((s) => s.medications);
  const refresh = useMedStore((s) => s.refresh);
  const getRules = useMedStore((s) => s.getRules);
  const [summaries, setSummaries] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  // Load a one-line schedule summary per medication.
  useEffect(() => {
    let active = true;
    void (async () => {
      const entries: Record<string, string> = {};
      for (const med of medications) {
        const rules = await getRules(med.id);
        entries[med.id] = rules[0] ? describeRule(rules[0]) : 'No schedule set';
      }
      if (active) setSummaries(entries);
    })();
    return () => {
      active = false;
    };
  }, [medications, getRules]);

  const active = medications.filter((m) => !m.paused);
  const paused = medications.filter((m) => m.paused);
  const sections = [
    { title: 'Active', data: active },
    { title: 'Paused', data: paused },
  ].filter((s) => s.data.length > 0);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <SectionList
        sections={sections}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          <Text style={styles.section}>{section.title}</Text>
        )}
        renderItem={({ item }: { item: Medication }) => (
          <MedicationCard
            medication={item}
            scheduleSummary={summaries[item.id]}
            onPress={() =>
              router.push({
                pathname: '/medication/[id]',
                params: { id: item.id },
              })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No medications yet"
            message="Tap the button below to add your first medication and reminder."
          />
        }
        ListFooterComponent={
          <Button
            label="Add medication"
            icon={PlusSignIcon}
            onPress={() => router.push('/medication/edit')}
            style={styles.addBtn}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  section: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  addBtn: { marginTop: spacing.lg },
});
