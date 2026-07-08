/**
 * Confirmation screen — thin wrapper that opens ConfirmSheet in a bottom sheet.
 *
 * Reached by tapping a notification (deep link) or the Confirm button.
 * The Sheet renders at 70% height with drag-to-dismiss disabled.
 */
import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Sheet, type SheetRef } from '@/components/primitives/Sheet';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { Text } from '@/components/primitives/Text';
import { dismiss } from '@/lib/navigation';
import { useTheme } from '@/hooks/useTheme';

export default function Confirm(): React.JSX.Element {
  const router = useRouter();
  const theme = useTheme();
  const { occurrenceId } = useLocalSearchParams<{ occurrenceId: string }>();
  const sheetRef = useRef<SheetRef>(null);

  const handleDone = useCallback(() => {
    dismiss(router);
  }, [router]);

  // Present sheet on mount
  useEffect(() => {
    sheetRef.current?.present();
  }, []);

  if (!occurrenceId) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text variant="body" color={theme.inkMuted} center>
          This dose could not be found — it may have been removed.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Sheet
        ref={sheetRef}
        snapPoints={['70%']}
        enablePanDownToClose={false}
        closeIcon={false}
        onDismiss={() => dismiss(router)}
      >
        <ConfirmSheet occurrenceId={occurrenceId} onDone={handleDone} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
});
