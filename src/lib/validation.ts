/**
 * Zod schemas — single source of truth for form validation.
 *
 * Used with react-hook-form via @hookform/resolvers/zod on the Add/Edit
 * Medication screen. The inferred types feed the UI; the persisted domain
 * models live in types.ts.
 */
import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

const hhmm = z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:mm');

/** Medication add/edit form. `name` is the only hard requirement. */
export const medicationFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(80),
    strength: z.string().trim().max(40).optional(),
    doseQuantity: z.coerce.number().positive('Must be > 0').max(99),
    unit: z.string().trim().min(1).max(20),
    notes: z.string().trim().max(500).optional(),
    startDate: isoDate,
    endDate: isoDate.optional(),
    pillColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex color')
      .optional(),
  })
  .refine((v) => !v.endDate || v.endDate >= v.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

export type MedicationFormValues = z.infer<typeof medicationFormSchema>;

/** Schedule editor form. Per-type fields are validated by `superRefine`. */
export const scheduleFormSchema = z
  .object({
    type: z.enum(['daily', 'weekly', 'interval', 'pattern']),
    times: z.array(hhmm).min(1, 'Add at least one reminder time'),
    weekdays: z.array(z.number().int().min(1).max(7)).optional(),
    intervalDays: z.coerce.number().int().min(1).max(365).optional(),
    pattern: z.array(z.union([z.literal(0), z.literal(1)])).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.type === 'weekly' && (!v.weekdays || v.weekdays.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pick at least one weekday',
        path: ['weekdays'],
      });
    }
    if (v.type === 'interval' && !v.intervalDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Set the interval in days',
        path: ['intervalDays'],
      });
    }
    if (
      v.type === 'pattern' &&
      (!v.pattern || v.pattern.length === 0 || !v.pattern.includes(1))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pattern must contain at least one "take" day',
        path: ['pattern'],
      });
    }
  });

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;
