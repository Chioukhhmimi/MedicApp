/**
 * Navigation helpers.
 *
 * `dismiss()` is a safe replacement for a bare `router.back()`. A screen that
 * was reached via `router.replace()` or a cold-start deep link can have no
 * screen beneath it — calling `back()` then makes expo-router emit
 * "The action 'GO_BACK' was not handled by any navigator". Falling back to the
 * home tabs keeps navigation correct from every entry path.
 */
import type { Router } from 'expo-router';

export function dismiss(router: Router): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)');
  }
}
