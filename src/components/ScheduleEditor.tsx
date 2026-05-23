/**
 * ScheduleEditor — edits a ScheduleDraft (type + per-type params + times).
 * Used by the Add/Edit Medication screen.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
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

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

export function ScheduleEditor({
  value,
  onChange,
  errors,
}: Props): React.JSX.Element {
  const { t } = useTranslation();
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
      <Text style={styles.label}>{t('schedule.type_label')}</Text>
      <SegmentedControl<ScheduleType>
        options={[
          { value: 'daily', label: t('schedule.type_daily') },
          { value: 'weekly', label: t('schedule.type_weekly') },
          { value: 'interval', label: t('schedule.type_interval') },
          { value: 'pattern', label: t('schedule.type_pattern') },
        ]}
        value={value.type}
        onChange={(type) => set({ type })}
      />

      {value.type === 'weekly' && (
        <View>
          <Text style={styles.label}>{t('schedule.weekdays')}</Text>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((d) => {
              const active = (value.weekdays ?? []).includes(d);
              const label = t(`schedule.weekday_short.${d}`);
              return (
                <Pressable
                  key={d}
                  onPress={() => toggleWeekday(d)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={label}
                  style={[styles.day, active && styles.dayActive]}
                >
                  <Text
                    style={[styles.dayText, active && styles.dayTextActive]}
                  >
                    {label}
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
          <Text style={styles.label}>{t('schedule.interval_label')}</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={String(value.intervalDays ?? '')}
            onChangeText={(text) =>
              set({ intervalDays: text ? Math.max(1, Number(text)) : undefined })
            }
            accessibilityLabel={t('schedule.interval_label')}
            placeholder={t('schedule.interval_placeholder')}
          />
          {errors?.intervalDays ? (
            <Text style={styles.error}>{errors.intervalDays}</Text>
          ) : null}
        </View>
      )}

      {value.type === 'pattern' && (
        <View>
          <Text style={styles.label}>{t('schedule.pattern_label')}</Text>
          <Text style={styles.hint}>{t('schedule.pattern_hint')}</Text>
          <View style={styles.presetRow}>
            {PATTERN_PRESETS.map((p) => (
              <Pressable
                key={p.key}
                onPress={() => set({ pattern: p.pattern })}
                accessibilityRole="button"
                accessibilityLabel={t(`schedule.pattern_presets.${p.key}`)}
                style={styles.preset}
              >
                <Text style={styles.presetText}>
                  {t(`schedule.pattern_presets.${p.key}`)}
                </Text>
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

      <Text style={styles.label}>{t('schedule.times')}</Text>
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
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  weekRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  day: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  dayActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textMuted,
  },
  dayTextActive: { color: colors.white },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.body,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  preset: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  presetText: {
    fontSize: fontSize.sm,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  error: { color: colors.danger, fontSize: fontSize.sm },
});
