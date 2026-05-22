/**
 * Global Jest setup.
 *
 * The scheduling-engine tests (src/tests/scheduler.test.ts) are pure and need
 * no mocks. The notification tests mock `expo-notifications` and `expo-sqlite`
 * inline so the suite runs without a device or native modules.
 */

// Silence the Expo winter runtime warning under Node.
jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: {} } },
}));
