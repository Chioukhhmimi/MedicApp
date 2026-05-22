/**
 * Add / Edit Medication (Feature 1).
 *
 * Medication fields are validated with react-hook-form + zod
 * (medicationFormSchema). The schedule is edited via ScheduleEditor and
 * validated with scheduleFormSchema on submit. Saving delegates to the med
 * store, which writes the rule and regenerates occurrences.
 */
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { ScheduleEditor } from '@/components/ScheduleEditor';
import { dismiss } from '@/lib/navigation';
import { useMedStore, type ScheduleDraft } from '@/store/useMedStore';
import {
  medicationFormSchema,
  scheduleFormSchema,
  type MedicationFormValues,
} from '@/lib/validation';
import { getMedication, getRulesForMed } from '@/services/database';
import { colors, fontSize, radius, spacing } from '@/theme';

const today = (): string => new Date().toISOString().slice(0, 10);

export default function EditMedication(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const saveMedication = useMedStore((s) => s.saveMedication);

  const [schedule, setSchedule] = useState<ScheduleDraft>({
    type: 'daily',
    times: ['08:00'],
  });
  const [scheduleErrors, setScheduleErrors] = useState<
    Partial<Record<keyof ScheduleDraft, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: {
      name: '',
      strength: '',
      doseQuantity: 1,
      unit: 'pill',
      notes: '',
      startDate: today(),
    },
  });

  // Editing: hydrate the form + schedule from the database.
  useEffect(() => {
    if (!id) return;
    void (async () => {
      const med = await getMedication(id);
      const rules = await getRulesForMed(id);
      if (med) {
        reset({
          name: med.name,
          strength: med.strength ?? '',
          doseQuantity: med.doseQuantity,
          unit: med.unit,
          notes: med.notes ?? '',
          startDate: med.startDate,
          endDate: med.endDate,
          pillColor: med.pillColor,
        });
      }
      if (rules[0]) {
        setSchedule({
          type: rules[0].type,
          times: rules[0].times,
          weekdays: rules[0].weekdays,
          intervalDays: rules[0].intervalDays,
          pattern: rules[0].pattern,
        });
      }
    })();
  }, [id, reset]);

  const onSubmit = async (values: MedicationFormValues): Promise<void> => {
    const parsed = scheduleFormSchema.safeParse(schedule);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof ScheduleDraft, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ScheduleDraft;
        fieldErrors[key] = issue.message;
      }
      setScheduleErrors(fieldErrors);
      return;
    }
    setScheduleErrors({});
    setSubmitting(true);
    try {
      await saveMedication(
        {
          name: values.name,
          strength: values.strength || undefined,
          doseQuantity: values.doseQuantity,
          unit: values.unit,
          notes: values.notes || undefined,
          startDate: values.startDate,
          endDate: values.endDate,
          pillColor: values.pillColor,
        },
        schedule,
        id,
      );
      dismiss(router);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Field label="Name *" error={errors.name?.message}>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextInput
                style={styles.input}
                value={field.value}
                onChangeText={field.onChange}
                placeholder="e.g. Metformin"
                accessibilityLabel="Medication name"
              />
            )}
          />
        </Field>

        <View style={styles.rowFields}>
          <Field
            label="Dose quantity"
            error={errors.doseQuantity?.message}
            style={styles.half}
          >
            <Controller
              control={control}
              name="doseQuantity"
              render={({ field }) => (
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={String(field.value ?? '')}
                  onChangeText={(t) => field.onChange(t)}
                  accessibilityLabel="Dose quantity"
                />
              )}
            />
          </Field>
          <Field label="Unit" error={errors.unit?.message} style={styles.half}>
            <Controller
              control={control}
              name="unit"
              render={({ field }) => (
                <TextInput
                  style={styles.input}
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="pill / ml / puff"
                  accessibilityLabel="Dose unit"
                />
              )}
            />
          </Field>
        </View>

        <Field label="Strength (optional)" error={errors.strength?.message}>
          <Controller
            control={control}
            name="strength"
            render={({ field }) => (
              <TextInput
                style={styles.input}
                value={field.value ?? ''}
                onChangeText={field.onChange}
                placeholder="e.g. 500 mg"
                accessibilityLabel="Strength"
              />
            )}
          />
        </Field>

        <View style={styles.rowFields}>
          <Field
            label="Start date"
            error={errors.startDate?.message}
            style={styles.half}
          >
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <TextInput
                  style={styles.input}
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="YYYY-MM-DD"
                  accessibilityLabel="Start date"
                />
              )}
            />
          </Field>
          <Field
            label="End date (optional)"
            error={errors.endDate?.message}
            style={styles.half}
          >
            <Controller
              control={control}
              name="endDate"
              render={({ field }) => (
                <TextInput
                  style={styles.input}
                  value={field.value ?? ''}
                  onChangeText={(t) => field.onChange(t || undefined)}
                  placeholder="YYYY-MM-DD"
                  accessibilityLabel="End date"
                />
              )}
            />
          </Field>
        </View>

        <Field label="Notes (optional)" error={errors.notes?.message}>
          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <TextInput
                style={[styles.input, styles.multiline]}
                value={field.value ?? ''}
                onChangeText={field.onChange}
                multiline
                placeholder="e.g. take with food"
                accessibilityLabel="Notes"
              />
            )}
          />
        </Field>

        <ScheduleEditor
          value={schedule}
          onChange={setSchedule}
          errors={scheduleErrors}
        />

        <Button
          label={id ? 'Save changes' : 'Add medication'}
          onPress={handleSubmit(onSubmit)}
          loading={submitting}
          style={styles.submit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  error,
  style,
  children,
}: {
  label: string;
  error?: string;
  style?: object;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm },
  field: { gap: spacing.xs },
  rowFields: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  label: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: fontSize.body,
    color: colors.text,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  error: { color: colors.danger, fontSize: fontSize.sm },
  submit: { marginTop: spacing.lg, marginBottom: spacing.xl },
});
