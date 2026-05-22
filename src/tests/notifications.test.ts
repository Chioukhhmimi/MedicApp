/**
 * Notification-service tests.
 *
 * `expo-notifications` is mocked so the suite runs without native modules:
 * we assert that an occurrence produces a correctly-shaped scheduled
 * notification (with the deep-link payload) and that the tap payload is
 * recognised on cold start.
 */
import type { Medication, Occurrence } from '@/lib/types';

// Jest only allows variables prefixed with `mock` inside a jest.mock factory.
const mockSchedule = jest.fn().mockResolvedValue('notif-123');
const mockLastResponse = jest.fn();

jest.mock('expo-notifications', () => ({
  __esModule: true,
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: (...args: unknown[]) => mockSchedule(...args),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getLastNotificationResponseAsync: () => mockLastResponse(),
  SchedulableTriggerInputTypes: { DATE: 'date' },
  AndroidImportance: { HIGH: 4 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
}));

import {
  getColdStartReminder,
  isReminderPayload,
  scheduleOccurrenceNotification,
} from '@/services/notifications';

const med: Medication = {
  id: 'm1',
  name: 'Metformin',
  doseQuantity: 2,
  unit: 'pill',
  startDate: '2026-01-01',
  paused: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function occ(scheduledTime: string): Occurrence {
  return {
    id: 'o1',
    medId: 'm1',
    ruleId: 'r1',
    scheduledTime,
    status: 'pending',
    snoozeCount: 0,
    canceled: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

beforeEach(() => {
  mockSchedule.mockClear();
  mockLastResponse.mockReset();
});

describe('scheduleOccurrenceNotification', () => {
  it('schedules a notification carrying the deep-link payload', async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const id = await scheduleOccurrenceNotification(occ(future), med);

    expect(id).toBe('notif-123');
    expect(mockSchedule).toHaveBeenCalledTimes(1);

    const arg = mockSchedule.mock.calls[0][0];
    expect(arg.content.title).toContain('Metformin');
    expect(arg.content.data).toMatchObject({
      kind: 'med-reminder',
      occurrenceId: 'o1',
      medId: 'm1',
      dose: '2 pill',
    });
    expect(arg.trigger).toEqual({ type: 'date', date: new Date(future) });
  });

  it('does not schedule a notification for a past time', async () => {
    const past = new Date(Date.now() - 60 * 1000).toISOString();
    const id = await scheduleOccurrenceNotification(occ(past), med);
    expect(id).toBeNull();
    expect(mockSchedule).not.toHaveBeenCalled();
  });
});

describe('isReminderPayload', () => {
  it('accepts a valid reminder payload', () => {
    expect(
      isReminderPayload({ kind: 'med-reminder', occurrenceId: 'o1' }),
    ).toBe(true);
  });

  it('rejects unrelated payloads', () => {
    expect(isReminderPayload({ kind: 'something-else' })).toBe(false);
    expect(isReminderPayload(null)).toBe(false);
    expect(isReminderPayload('nope')).toBe(false);
  });
});

describe('getColdStartReminder (notification-tap deep link)', () => {
  it('returns the payload when the app was opened from a reminder', async () => {
    mockLastResponse.mockResolvedValue({
      notification: {
        request: {
          content: {
            data: { kind: 'med-reminder', occurrenceId: 'o9', medId: 'm1' },
          },
        },
      },
    });
    const payload = await getColdStartReminder();
    expect(payload?.occurrenceId).toBe('o9');
  });

  it('returns null on a normal launch', async () => {
    mockLastResponse.mockResolvedValue(null);
    expect(await getColdStartReminder()).toBeNull();
  });
});
