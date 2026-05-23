/**
 * i18n bootstrap for Dosely.
 *
 * - Three supported languages: French (default), English, Arabic.
 * - Arabic switches the whole app to RTL via `I18nManager.forceRTL`; because
 *   that flag only takes effect after a native restart, `applyLanguage` calls
 *   `Updates.reloadAsync()` when the RTL state flips.
 * - The language is persisted in the existing Settings store (SQLite), so the
 *   chosen locale survives across launches.
 */
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';

export type Language = 'fr' | 'en' | 'ar';
export const SUPPORTED_LANGUAGES: Language[] = ['fr', 'en', 'ar'];
export const DEFAULT_LANGUAGE: Language = 'fr';

export function isRtl(lang: Language): boolean {
  return lang === 'ar';
}

let initialised = false;

/**
 * Initialise i18next with the given language. Safe to call multiple times.
 */
export async function initI18n(language: Language): Promise<void> {
  if (initialised) {
    if (i18n.language !== language) await i18n.changeLanguage(language);
    return;
  }
  await i18n.use(initReactI18next).init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: { escapeValue: false },
    returnNull: false,
    compatibilityJSON: 'v4',
  });
  initialised = true;
}

/**
 * Ensure the native RTL flag matches the requested language. Returns true if
 * the layout direction *would change* — callers should reload the app in that
 * case so the new direction takes effect everywhere (RN can't flip layouts
 * mid-session).
 */
export function ensureRtl(language: Language): boolean {
  const wantsRtl = isRtl(language);
  if (I18nManager.isRTL === wantsRtl) return false;
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(wantsRtl);
  return true;
}

/**
 * Apply a new language: update i18next, persist via the provided saver, and
 * reload the app if the RTL flag flipped. The saver lets us avoid a direct
 * dependency on the settings store from here.
 */
export async function applyLanguage(
  language: Language,
  save: (lang: Language) => Promise<void>,
): Promise<void> {
  const needsReload = ensureRtl(language);
  await save(language);
  await i18n.changeLanguage(language);
  if (needsReload) {
    try {
      await Updates.reloadAsync();
    } catch {
      // Falls through silently in Expo Go where reloadAsync isn't supported;
      // the new direction will apply on the next manual launch.
    }
  }
}

/** Maps an app language to a BCP-47 tag suitable for Luxon / Intl. */
export function localeTag(language: Language): string {
  switch (language) {
    case 'fr':
      return 'fr-FR';
    case 'en':
      return 'en-US';
    case 'ar':
      return 'ar';
  }
}

export default i18n;
