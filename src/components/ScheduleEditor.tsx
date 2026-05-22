/**
 * ScheduleEditor — edits a ScheduleDraft (type + per-type params + times).
 * Used by the Add/Edit Medication screen.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/theme';
import { SegmentedControl } from './SegmentedControl';
import { TimePickerList } from './TimePickerList';
import { PATTERN_PRESETS } from '@/lib/scheduler';
import type { ScheduleDraft } from '@/store/useMedStore';
import type { ScheduleType } from '@/lib/types';

interface Props {
  value: ScheduleDraft;
  onChange: (next: ScheduleDraft) => void;
  errors?: Partial<Record<keyof ScheduleDraft, string>>;
}

const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

export function ScheduleEditor({
  value,
  onChange,
  errors,
}: Props): React.JSX.Element {
  const set = (patch: Partial<ScheduleDraft>): void =>
    onChange({ ...value, ...patch });

  const toggleWeekday = (day: number): void => {
    const days = value.weekdays ?? [];
    set({
      weekdays: days.includes(day)
        ? days.filter((d) => d !== day)
        : [...days, day].sort(),
    });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Schedule type</Text>
      <SegmentedControl<ScheduleType>
        options={[
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'interval', label: 'Interval' },
          { value: 'pattern', label: 'Pattern' },
        ]}
        value={value.type}
        onChange={(type) => set({ type })}
      />

      {value.type === 'weekly' && (
        <View>
          <Text style={styles.label}>Days of week</Text>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((d) => {
              const active = (value.weekdays ?? []).includes(d.value);
              return (
                <Pressable
                  key={d.value}
                  onPress={() => toggleWeekday(d.value)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={d.label}
                  style={[styles.day, active && styles.dayActive]}
                >
                  <Text
                    style={[styles.dayText, active && styles.dayTextActive]}
                  >
                    {d.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {errors?.weekdays ? (
            <Text style={styles.error}>{errors.weekdays}</Text>
          ) : null}
        </View>
      )}

      {value.type === 'interval' && (
        <View>
          <Text style={styles.label}>Repeat every (days)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={String(value.intervalDays ?? '')}
            onChangeText={(t) =>
              set({ intervalDays: t ? Math.max(1, Number(t)) : undefined })
            }
            accessibilityLabel="Interval in days"
            placeholder="e.g. 3"
          />
          {errors?.intervalDays ? (
            <Text style={styles.error}>{errors.intervalDays}</Text>
          ) : null}
        </View>
      )}

      {value.type === 'pattern' && (
        <View>
          <Text style={styles.label}>Take / skip pattern</Text>
          <Text style={styles.hint}>
            Pick a preset, or tap days to toggle take (●) / skip (○).
          </Text>
          <View style={styles.presetRow}>
            {PATTERN_PRESETS.map((p) => (
              <Pressable
                key={p.label}
                onPress={() => set({ pattern: p.pattern })}
                accessibilityRole="button"
                accessibilityLabel={p.label}
                style={styles.preset}
              >
                <Text style={styles.presetText}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.weekRow}>
            {(value.pattern ?? [1, 0]).map((bit, idx) => (
              <Pressable
                key={idx}
                onPress={() => {
                  const next = [...(value.pattern ?? [1, 0])];
                  next[idx] = next[idx] === 1 ? 0 : 1;
                  set({ pattern: next });
                }}
                accessibilityRole="button"
                accessibilityLabel={`Day ${idx + 1} ${
                  bit === 1 ? 'take' : 'skip'
                }`}
                style={[styles.day, bit === 1 && styles.dayActive]}
              >
                <Text
                  style={[styles.dayText, bit === 1 && styles.dayTextActive]}
                >
                  {bit === 1 ? '●' : '○'}
                </Text>
              </Pressable>
            ))}
          </View>
          {errors?.pattern ? (
            <Text style={styles.error}>{errors.pattern}</Text>
          ) : null}
        </View>
      )}

      <Text style={styles.label}>Reminder times</Text>
      <TimePickerList
        times={value.times}
        onChange={(times) => set({ times })}
      />
      {errors?.times ? <Text style={styles.error}>{errors.times}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
  },
  hint: { fontSize: fontSize.sm, color: colors.textMuted },
  weekRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  day: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  dayActive: { backgroundColor: colors.primary },
  dayText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  dayTextActive: { color: colors.white },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: fontSize.body,
    color: colors.text,
  },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  preset: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  presetText: { fontSize: fontSize.sm, color: colors.primary },
  error: { color: colors.danger, fontSize: fontSize.sm },
});
