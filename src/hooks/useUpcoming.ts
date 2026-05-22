/**
 * useUpcoming — loads the next N days of pending occurrences joined with
 * their medication, for the Home dashboard.
 */
import { useCallback, useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { getOccurrencesBetween } from '@/services/database';
import { useMedStore } from '@/store/useMedStore';
import type { Medication, Occurrence } from '@/lib/types';

export interface UpcomingItem {
  occurrence: Occurrence;
  medication: Medication;
}

export function useUpcoming(daysAhead = 2): {
  items: UpcomingItem[];
  loading: boolean;
  reload: () => Promise<void>;
} {
  const medications = useMedStore((s) => s.medications);
  const [items, setItems] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const fromIso = DateTime.utc().minus({ hours: 2 }).toISO()!;
      const toIso = DateTime.utc().plus({ days: daysAhead }).toISO()!;
      const occ = await getOccurrencesBetween(fromIso, toIso);
      const byId = new Map(medications.map((m) => [m.id, m]));
      const next = occ
        .filter((o) => !o.canceled && o.status === 'pending')
        .map((o) => {
          const medication = byId.get(o.medId);
          return medication ? { occurrence: o, medication } : null;
        })
        .filter((x): x is UpcomingItem => x !== null);
      setItems(next);
    } finally {
      setLoading(false);
    }
  }, [daysAhead, medications]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, reload };
}
