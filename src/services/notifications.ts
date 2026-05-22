/**
 * Local notification service (expo-notifications).
 *
 * Responsibilities:
 *  - request & report OS notification permission (Feature 10: clear consent)
 *  - schedule one local notification per Occurrence
 *  - carry a deep-link payload so a tap opens the Confirmation screen
 *    pre-filled with med name / dose / time / occurrenceId (Feature 4)
 *  - map notification identifiers back to occurrences for cancellation
 *
 * Expo-managed limitation: there is no exact-alarm guarantee on aggressive
 * Android OEMs and a hard ceiling (~64 pending notifications on iOS). MediTrack
 * works around both by pre-generating occurrences in SQLite and only keeping a
 * rolling window of OS notifications scheduled (see scheduleService).
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Medication, Occurrence } from '@/lib/types';

const ANDROID_CHANNEL_ID = 'meditrack-reminders';

/** Payload embedded in every reminder; read on tap to deep-link. */
export interface ReminderPayload {
  kind: 'med-reminder';
  occurrenceId: string;
  medId: string;
  medName: string;
  dose: string;
  scheduledTime: string;
}

/** Installs the foreground handler and Android channel. Call once at boot. */
export async function configureNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      // `shouldShowAlert` is the legacy field; the banner/list pair is its
      // modern replacement. Both are sent so the types stay satisfied.
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Medication reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

/**
 * Requests notification permission. Callers should show an in-app rationale
 * *before* invoking this so the user understands why (Feature 10).
 */
export async function requestPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return req.granted;
}

/**
 * Schedules a single local notification for an occurrence.
 * @returns the OS notification identifier (store it on the occurrence), or
 *          null if the time is already in the past.
 */
export async function scheduleOccurrenceNotification(
  occ: Occurrence,
  med: Medication,
): Promise<string | null> {
  const fireDate = new Date(occ.scheduledTime);
  if (fireDate.getTime() <= Date.now()) return null;

  const dose = `${med.doseQuantity} ${med.unit}`;
  const payload: ReminderPayload = {
    kind: 'med-reminder',
    occurrenceId: occ.id,
    medId: med.id,
    medName: med.name,
    dose,
    scheduledTime: occ.scheduledTime,
  };

  return Notifications.scheduleNotificationAsync({
    content: {
      title: `Time for ${med.name}`,
      body: `Take ${dose}. Tap to confirm.`,
      data: payload as unknown as Record<string, unknown>,
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
    },
  });
}

/** Cancels a scheduled notification by id (no-op if already fired/missing). */
export async function cancelNotification(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Already delivered or unknown id — safe to ignore.
  }
}

/** Cancels every pending notification. Used before a full reschedule. */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Type guard for the reminder payload on an incoming notification. */
export function isReminderPayload(data: unknown): data is ReminderPayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { kind?: string }).kind === 'med-reminder'
  );
}

/**
 * If the app was cold-started by tapping a reminder, returns its payload so
 * the root layout can deep-link to /confirm (Feature 11: cold start).
 */
export async function getColdStartReminder(): Promise<ReminderPayload | null> {
  const response = await Notifications.getLastNotificationResponseAsync();
  const data = response?.notification.request.content.data;
  return isReminderPayload(data) ? data : null;
}
