/**
 * Secure storage wrapper (expo-secure-store).
 *
 * Feature 10: sensitive data goes to the OS keystore/keychain, never to the
 * plain SQLite file. Today MediTrack only keeps a biometric-lock flag and an
 * optional future API token here, but routing it through one module keeps the
 * security surface auditable.
 */
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  biometricEnabled: 'meditrack.biometricEnabled',
  syncToken: 'meditrack.syncToken', // reserved for optional future backend
} as const;

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(KEYS.biometricEnabled, enabled ? '1' : '0');
}

export async function isBiometricEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(KEYS.biometricEnabled)) === '1';
}

export async function setSyncToken(token: string | null): Promise<void> {
  if (token === null) {
    await SecureStore.deleteItemAsync(KEYS.syncToken);
  } else {
    await SecureStore.setItemAsync(KEYS.syncToken, token);
  }
}

export async function getSyncToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.syncToken);
}
