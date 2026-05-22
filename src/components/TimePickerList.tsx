/**
 * TimePickerList — manages the set of reminder times for a medication.
 * Each "HH:mm" entry becomes its own scheduled notification (Feature 3).
 */
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Cancel01Icon, PlusSignIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/Icon';
import { colors, fontSize, radius, spacing } from '@/theme';
import { parseTime } from '@/lib/dates';

interface Props {
  times: string[];
  onChange: (times: string[]) => void;
}

function toHHmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`;
}

export function TimePickerList({ times, onChange }: Props): React.JSX.Element {
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState(new Date());

  const addTime = (hhmm: string): void => {
    if (times.includes(hhmm)) return;
    const sorted = [...times, hhmm].sort();
    onChange(sorted);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.chips}>
        {times.map((t) => (
          <View key={t} style={styles.chip}>
            <Text style={styles.chipText}>{t}</Text>
            <Pressable
              onPress={() => onChange(times.filter((x) => x !== t))}
              accessibilityRole="button"
              accessibilityLabel={`Remove reminder time ${t}`}
              hitSlop={8}
            >
              <Icon
                icon={Cancel01Icon}
                size={16}
                color={colors.primaryDark}
                strokeWidth={2}
              />
            </Pressable>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => setPicking(true)}
        accessibilityRole="button"
        accessibilityLabel="Add a reminder time"
        style={styles.addBtn}
      >
        <Icon
          icon={PlusSignIcon}
          size={16}
          color={colors.primary}
          strokeWidth={2}
        />
        <Text style={styles.addText}>Add time</Text>
      </Pressable>

      {picking && (
        <DateTimePicker
          value={draft}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_event, date) => {
            setPicking(false);
            if (date) {
              setDraft(date);
              const hhmm = toHHmm(date);
              try {
                parseTime(hhmm); // guard against odd platform values
                addTime(hhmm);
              } catch {
                /* ignore invalid */
              }
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chipText: { fontSize: fontSize.body, color: colors.primaryDark },
  addBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  addText: { color: colors.primary, fontWeight: '600' },
});
