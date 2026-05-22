/**
 * Root layout — app bootstrap and navigation shell.
 *
 * On mount it:
 *  1. initialises monitoring, the SQLite DB, and the notification handler;
 *  2. loads settings + medications and refreshes the occurrence horizon
 *     (Feature 2: recompute schedules on every launch);
 *  3. wires the notification-response listener so a tap deep-links to the
 *     Confirmation screen, and handles the cold-start case (Feature 11).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initMonitoring, reportError } from '@/services/monitoring';
import {
  configureNotifications,
  getColdStartReminder,
  isReminderPayload,
} from '@/services/notifications';
import { getDb } from '@/services/database';
import { useMedStore } from '@/store/useMedStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { colors } from '@/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout(): React.JSX.Element | null {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const coldStartHandled = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function boot(): Promise<void> {
      try {
        initMonitoring();
        await configureNotifications();
        await getDb(); // open + migrate
        await useSettingsStore.getState().load();
        await useMedStore.getState().bootstrap();

        // Cold start: app was launched by tapping a reminder.
        const cold = await getColdStartReminder();
        if (cold && !coldStartHandled.current) {
          coldStartHandled.current = true;
          router.push({
            pathname: '/confirm',
            params: { occurrenceId: cold.occurrenceId },
          });
        }
      } catch (err) {
        reportError(err, 'boot');
      } finally {
        if (mounted) {
          setReady(true);
          await SplashScreen.hideAsync();
        }
      }
    }

    void boot();
    return () => {
      mounted = false;
    };
  }, [router]);

  // Warm-start / background tap: deep-link into the confirmation screen.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (isReminderPayload(data)) {
          router.push({
            pathname: '/confirm',
            params: { occurrenceId: data.occurrenceId },
          });
        }
      },
    );
    return () => sub.remove();
  }, [router]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="medication/edit"
          options={{ presentation: 'modal', title: 'Medication' }}
        />
        <Stack.Screen name="medication/[id]" options={{ title: 'Details' }} />
        <Stack.Screen
          name="confirm"
          options={{ presentation: 'modal', title: 'Confirm dose' }}
        />
        <Stack.Screen name="export" options={{ title: 'Export history' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
