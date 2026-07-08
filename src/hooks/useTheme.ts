import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/store/useSettingsStore';
import { light, dark, type SemanticTokens } from '@/theme/tokens';

/**
 * Returns the active semantic token set based on the user's color scheme
 * preference. Reads from useSettingsStore; re-renders only when
 * colorScheme changes (Zustand selector).
 */
export function useTheme(): SemanticTokens {
  const colorScheme = useSettingsStore((s) => s.settings.colorScheme);
  const systemScheme = useColorScheme();

  const mode =
    colorScheme === 'system' ? (systemScheme ?? 'light') : colorScheme;
  return mode === 'dark' ? dark : light;
}
