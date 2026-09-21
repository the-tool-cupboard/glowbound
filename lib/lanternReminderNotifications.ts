import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import {
  LANTERN_REMINDER_BODY,
  LANTERN_REMINDER_CHANNEL_DESCRIPTION,
  LANTERN_REMINDER_CHANNEL_ID,
  LANTERN_REMINDER_CHANNEL_NAME,
  LANTERN_REMINDER_TITLE,
  isLanternReminderIdentifier,
  lanternReminderReconcileActions,
  planLanternReminders,
  type LanternReminderPlanInput,
} from "./lanternReminder";
import { getLanternReminderEnabled, getNightLanternState } from "./storage";

const PERMISSION_IOS = {
  allowAlert: true,
  allowBadge: false,
  allowSound: true,
} as const;

let handlerInstalled = false;
let syncChain: Promise<void> = Promise.resolve();

function notificationsSupported(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

function permissionGranted(status: Notifications.NotificationPermissionsStatus): boolean {
  if (status.granted) {
    return true;
  }
  return status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

async function ensureLanternReminderChannel(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(LANTERN_REMINDER_CHANNEL_ID, {
    name: LANTERN_REMINDER_CHANNEL_NAME,
    description: LANTERN_REMINDER_CHANNEL_DESCRIPTION,
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function listLanternReminderIdentifiers(): Promise<string[]> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.map((request) => request.identifier).filter(isLanternReminderIdentifier);
}

export function installLanternReminderRuntime(): void {
  if (handlerInstalled) {
    return;
  }
  handlerInstalled = true;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // Web and some test runtimes do not implement a notification handler.
  }
}

export function subscribeLanternReminderTaps(onOpenCamp: () => void): () => void {
  if (!notificationsSupported()) {
    return () => undefined;
  }

  try {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data != null && data.glowbound === "lantern-reminder") {
        onOpenCamp();
      }
    });
    return () => {
      subscription.remove();
    };
  } catch {
    return () => undefined;
  }
}

export async function lanternReminderPermissionGranted(): Promise<boolean> {
  if (!notificationsSupported()) {
    return false;
  }

  try {
    const status = await Notifications.getPermissionsAsync();
    return permissionGranted(status);
  } catch {
    return false;
  }
}

export async function requestLanternReminderPermission(): Promise<boolean> {
  if (!notificationsSupported()) {
    return true;
  }

  try {
    await ensureLanternReminderChannel();
    const existing = await Notifications.getPermissionsAsync();
    if (permissionGranted(existing)) {
      return true;
    }
    const next = await Notifications.requestPermissionsAsync({
      ios: PERMISSION_IOS,
    });
    return permissionGranted(next);
  } catch {
    return false;
  }
}

export async function applyLanternReminderSchedule(
  input: LanternReminderPlanInput
): Promise<void> {
  if (!notificationsSupported()) {
    return;
  }

  try {
    installLanternReminderRuntime();
    const existing = await listLanternReminderIdentifiers();
    const canSchedule = input.optedIn && (await lanternReminderPermissionGranted());
    const plan = canSchedule ? planLanternReminders(input) : [];
    const actions = lanternReminderReconcileActions(plan, existing);

    for (const identifier of actions.cancel) {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    }

    if (plan.length === 0) {
      return;
    }

    await ensureLanternReminderChannel();
    for (const slot of actions.schedule) {
      await Notifications.scheduleNotificationAsync({
        identifier: slot.identifier,
        content: {
          title: LANTERN_REMINDER_TITLE,
          body: LANTERN_REMINDER_BODY,
          sound: true,
          data: { glowbound: "lantern-reminder" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: slot.fireAt,
          channelId: LANTERN_REMINDER_CHANNEL_ID,
        },
      });
    }
  } catch {
    // Local notifications can be unavailable; keep Camp and lantern play working.
  }
}

export async function syncLanternReminders(options?: {
  optedIn?: boolean;
  lastPlayDate?: string | null;
  now?: Date;
}): Promise<void> {
  const run = async () => {
    const optedIn = options?.optedIn ?? (await getLanternReminderEnabled());
    const lastPlayDate =
      options?.lastPlayDate !== undefined
        ? options.lastPlayDate
        : (await getNightLanternState()).lastPlayDate;
    await applyLanternReminderSchedule({
      now: options?.now ?? new Date(),
      optedIn,
      lastPlayDate,
    });
  };

  const next = syncChain.then(run, run);
  syncChain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}
