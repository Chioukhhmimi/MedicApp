/**
 * Error monitoring (Sentry).
 *
 * Sentry is initialised only when a DSN is supplied via app config
 * (`extra.sentryDsn`) or the EXPO_PUBLIC_SENTRY_DSN env var. With no DSN it is
 * a safe no-op, so local-only / offline builds carry zero network dependency
 * (Feature 10: support a fully local mode).
 *
 * The Sentry import is dynamic to avoid crashing in Expo Go where the native
 * module may not be available.
 */
import Constants from 'expo-constants';

let initialised = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Sentry: any = null;

export function initMonitoring(): void {
  if (initialised) return;
  const dsn =
    (Constants.expoConfig?.extra as { sentryDsn?: string } | undefined)
      ?.sentryDsn ?? process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return; // local-only mode — no monitoring, no network.

  // Dynamic import — fails gracefully in Expo Go where native module is absent.
  void import('@sentry/react-native')
    .then((mod) => {
      Sentry = mod;
      Sentry.init({
        dsn,
        tracesSampleRate: 0.2,
        // Never attach PII: medication data must not leave the device.
        sendDefaultPii: false,
      });
      initialised = true;
    })
    .catch(() => {
      // Sentry native module unavailable (e.g. Expo Go) — degrade to console.
      console.warn('[MediTrack] Sentry unavailable in this environment');
    });
}

/** Reports a non-fatal error without leaking medication content. */
export function reportError(error: unknown, context?: string): void {
  if (initialised && Sentry) {
    Sentry.captureException(error, { tags: context ? { context } : undefined });
  } else {
    console.error(`[MediTrack${context ? `:${context}` : ''}]`, error);
  }
}
