/**
 * Lightweight unique-id generator.
 *
 * Avoids a `uuid` dependency (and its crypto polyfill needs under Expo).
 * Collision-resistant enough for a single-device, local-first app: combines
 * a timestamp with random entropy.
 */
export function newId(prefix = 'id'): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${time}${rand}`;
}
