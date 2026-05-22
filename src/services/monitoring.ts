/**
 * Error monitoring (Sentry).
 *
 * Sentry is initialised only when a DSN is supplied via app config
 * (`extra.sentryDsn`) or the EXPO_PUBLIC_SENTRY_DSN env var. With no DSN it is
 * a safe no-op, so local-only / offline builds carry zero network dependency
 * (Feature 10: support a fully local mode).
 */
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';

let initialised = false;

export function initMonitoring(): void {
  if (initialised) return;
  const dsn =
    (Constants.expoConfig?.extra as { sentryDsn?: string } | undefined)
      ?.sentryDsn ?? process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return; // local-only mode — no monitoring, no network.

  Sentry.init({
    dsn,
    tracesSampleRate: 0.2,
    // Never attach PII: medication data must not leave the device.
    sendDefaultPii: false,
  });
  initialised = true;
}

/** Reports a non-fatal error without leaking medication content. */
export function reportError(error: unknown, context?: string): void {
  if (initialised) {
    Sentry.captureException(error, { tags: context ? { context } : undefined });
  } else {
    console.error(`[MediTrack${context ? `:${context}` : ''}]`, error);
  }
}
