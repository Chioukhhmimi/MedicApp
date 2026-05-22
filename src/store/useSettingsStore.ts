/**
 * Settings store (Zustand) — wraps the singleton settings row.
 */
import { create } from 'zustand';
import { getSettings, saveSettings } from '@/services/database';
import { setBiometricEnabled } from '@/services/secureStore';
import { DEFAULT_SETTINGS, type Settings } from '@/lib/types';

interface SettingsState {
  settings: Settings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  load: async () => {
    set({ settings: await getSettings(), loaded: true });
  },

  update: async (patch) => {
    const next = { ...get().settings, ...patch };
    await saveSettings(next);
    // Biometric preference is mirrored into secure storage.
    if (patch.biometricLock !== undefined) {
      await setBiometricEnabled(patch.biometricLock);
    }
    set({ settings: next });
  },
}));
