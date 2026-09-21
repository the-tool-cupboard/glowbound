import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import {
  LANTERN_REMINDER_BODY,
  LANTERN_REMINDER_CHANNEL_ID,
  LANTERN_REMINDER_IDENTIFIER_PREFIX,
  LANTERN_REMINDER_TITLE,
} from "../lib/lanternReminder";
import {
  applyLanternReminderSchedule,
  requestLanternReminderPermission,
} from "../lib/lanternReminderNotifications";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock("expo-notifications", () => ({
  AndroidImportance: { DEFAULT: 3 },
  IosAuthorizationStatus: { AUTHORIZED: 2, PROVISIONAL: 3 },
  SchedulableTriggerInputTypes: { DATE: "date" },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getExpoPushTokenAsync: jest.fn(),
  getDevicePushTokenAsync: jest.fn(),
}));

const mockedNotifications = Notifications as jest.Mocked<typeof Notifications>;

describe("lantern reminder notifications", () => {
  beforeEach(() => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "ios" });
    mockedNotifications.getPermissionsAsync.mockReset();
    mockedNotifications.requestPermissionsAsync.mockReset();
    mockedNotifications.getAllScheduledNotificationsAsync.mockReset();
    mockedNotifications.cancelScheduledNotificationAsync.mockReset();
    mockedNotifications.scheduleNotificationAsync.mockReset();
    mockedNotifications.getExpoPushTokenAsync.mockReset();
    mockedNotifications.getAllScheduledNotificationsAsync.mockResolvedValue([]);
    mockedNotifications.getPermissionsAsync.mockResolvedValue({
      granted: true,
      status: "granted",
    } as Notifications.NotificationPermissionsStatus);
  });

  it("does not schedule until opted in, and never asks for a remote push token", async () => {
    await applyLanternReminderSchedule({
      now: new Date("2026-09-21T16:00:00.000Z"),
      optedIn: false,
      lastPlayDate: null,
    });

    expect(mockedNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(mockedNotifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(mockedNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it("schedules one DATE trigger per unlit evening when permission is already granted", async () => {
    await applyLanternReminderSchedule({
      now: new Date("2026-09-21T16:00:00.000Z"),
      optedIn: true,
      lastPlayDate: null,
    });

    expect(mockedNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(mockedNotifications.scheduleNotificationAsync).toHaveBeenCalled();
    const first = mockedNotifications.scheduleNotificationAsync.mock.calls[0]?.[0];
    expect(first?.identifier).toBe(`${LANTERN_REMINDER_IDENTIFIER_PREFIX}2026-09-21`);
    expect(first?.content).toMatchObject({
      title: LANTERN_REMINDER_TITLE,
      body: LANTERN_REMINDER_BODY,
      data: { glowbound: "lantern-reminder" },
    });
    expect(first?.trigger).toMatchObject({
      type: "date",
      channelId: LANTERN_REMINDER_CHANNEL_ID,
    });
    expect(mockedNotifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it("cancels tonight after the lantern has been lit", async () => {
    mockedNotifications.getAllScheduledNotificationsAsync.mockResolvedValue([
      { identifier: `${LANTERN_REMINDER_IDENTIFIER_PREFIX}2026-09-21` },
    ] as Notifications.NotificationRequest[]);

    await applyLanternReminderSchedule({
      now: new Date("2026-09-21T16:00:00.000Z"),
      optedIn: true,
      lastPlayDate: "2026-09-21",
    });

    expect(mockedNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      `${LANTERN_REMINDER_IDENTIFIER_PREFIX}2026-09-21`
    );
    const scheduledIds = mockedNotifications.scheduleNotificationAsync.mock.calls.map(
      (call) => call[0]?.identifier
    );
    expect(scheduledIds).not.toContain(`${LANTERN_REMINDER_IDENTIFIER_PREFIX}2026-09-21`);
  });

  it("asks for local permission only when the player opts in", async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
      status: "undetermined",
    } as Notifications.NotificationPermissionsStatus);
    mockedNotifications.requestPermissionsAsync.mockResolvedValue({
      granted: true,
      status: "granted",
    } as Notifications.NotificationPermissionsStatus);

    await expect(requestLanternReminderPermission()).resolves.toBe(true);
    expect(mockedNotifications.requestPermissionsAsync).toHaveBeenCalledWith({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    expect(mockedNotifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });
});
