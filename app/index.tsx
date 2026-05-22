/**
 * Entry route — decides between the onboarding flow and the main tabs based
 * on whether first-run onboarding has been completed (Feature 8).
 */
import React from 'react';
import { Redirect } from 'expo-router';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function Index(): React.JSX.Element {
  const onboardingComplete = useSettingsStore(
    (s) => s.settings.onboardingComplete,
  );
  return <Redirect href={onboardingComplete ? '/(tabs)' : '/onboarding'} />;
}
