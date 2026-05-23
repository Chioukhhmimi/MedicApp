/**
 * useLocale — exposes the current BCP-47 locale tag for date/time formatting.
 * Reads from the settings store so it always reflects the user's current
 * language choice without prop-drilling.
 */
import { useSettingsStore } from '@/store/useSettingsStore';
import { localeTag, type Language } from '@/i18n';

export function useLocale(): string {
  const language = useSettingsStore((s) => s.settings.language as Language);
  return localeTag(language);
}
