/**
 * Backend sync client — STUB ONLY.
 *
 * MediTrack v1 is intentionally offline-first: nothing here is wired into the
 * app. This module documents the future shape of an optional sync feature and
 * matches api/openapi.yaml. Implementing it later means filling in `request()`
 * and calling these from a background sync task — the local data model
 * (src/lib/types.ts) was designed so no migration is needed.
 */
import type { LogEntry, Medication } from '@/lib/types';

/** Resolved at build time from app config when/if sync is enabled. */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export class SyncDisabledError extends Error {
  constructor() {
    super('Backend sync is not configured — MediTrack is running locally.');
    this.name = 'SyncDisabledError';
  }
}

async function request<T>(_path: string, _init?: RequestInit): Promise<T> {
  if (!BASE_URL) throw new SyncDisabledError();
  // Future implementation:
  //   const res = await fetch(`${BASE_URL}${_path}`, { ..._init,
  //     headers: { Authorization: `Bearer ${await getSyncToken()}` } });
  //   if (!res.ok) throw new Error(`API ${res.status}`);
  //   return res.json() as Promise<T>;
  throw new SyncDisabledError();
}

export const syncApi = {
  listMedications: () => request<Medication[]>('/medications'),
  createMedication: (m: Omit<Medication, 'id'>) =>
    request<Medication>('/medications', {
      method: 'POST',
      body: JSON.stringify(m),
    }),
  updateMedication: (id: string, m: Partial<Medication>) =>
    request<Medication>(`/medications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(m),
    }),
  deleteMedication: (id: string) =>
    request<void>(`/medications/${id}`, { method: 'DELETE' }),
  getHistory: (q: { medId?: string; from?: string; to?: string }) => {
    const params = new URLSearchParams(
      Object.entries(q).filter(([, v]) => v) as [string, string][],
    );
    return request<LogEntry[]>(`/history?${params.toString()}`);
  },
};
