import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import * as Notifications from "expo-notifications";

import { trpc } from "@/lib/trpc";

type GlucoseContext = "fasting" | "beforeMeal" | "afterMeal" | "bedtime" | "other";

type GlucoseEntry = {
  id: string;
  valueMgDl: number;
  context: GlucoseContext;
  note: string;
  createdAt: string;
};

type ReminderType = "glucose" | "meds" | "hydrate" | "walk" | "custom";

type Reminder = {
  id: string;
  title: string;
  type: ReminderType;
  time: string; // HH:MM
  enabled: boolean;
  notificationId: string | null;
  snoozedUntilIso: string | null;
  snoozeNotificationId: string | null;
};

type HabitKey = "logGlucose" | "move" | "hydrate" | "noSugaryDrink";

type CheckinsByDate = Record<string, Partial<Record<HabitKey, boolean>>>;

type EngagementState = {
  entries: GlucoseEntry[];
  reminders: Reminder[];
  checkinsByDate: CheckinsByDate;
  notificationsStatus: "unknown" | "granted" | "denied";

  addEntry: (input: { valueMgDl: number; context: GlucoseContext; note?: string; createdAt?: Date }) => void;
  deleteEntry: (id: string) => void;

  upsertReminder: (input: { id?: string; title: string; type: ReminderType; time: string; enabled: boolean }) => Promise<void>;
  toggleReminder: (id: string, enabled: boolean) => Promise<void>;
  snoozeReminder: (id: string, minutes: number) => Promise<void>;
  clearSnooze: (id: string) => Promise<void>;
  removeReminder: (id: string) => Promise<void>;
  requestNotificationsPermission: () => Promise<boolean>;

  setCheckin: (dateKey: string, habit: HabitKey, value: boolean) => void;

  getTodayCheckins: () => Partial<Record<HabitKey, boolean>>;
  getCurrentStreak: (habit: HabitKey) => number;
  getLatestGlucoseEntry: () => GlucoseEntry | null;
};

const STORAGE_KEYS = {
  entries: "diacare:glucose_entries:v1",
  reminders: "diacare:reminders:v1",
  checkins: "diacare:checkins:v1",
  clientId: "diacare:client_id:v1",
  syncUpdatedAtMs: "diacare:sync_updated_at_ms:v1",
} as const;

function getTodayKey(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error("[engagement] Failed to parse JSON", { rawLength: raw.length, e });
    return fallback;
  }
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeReminder(r: Reminder): Reminder {
  return {
    ...r,
    notificationId: r.notificationId ?? null,
    snoozedUntilIso: r.snoozedUntilIso ?? null,
    snoozeNotificationId: r.snoozeNotificationId ?? null,
  };
}

try {
  if (Platform.OS !== "web") {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    console.log("[engagement] Notification handler set successfully");
  }
} catch (e) {
  console.warn("[engagement] Failed to set notification handler - app will continue without notifications", e);
}

function parseTimeToHourMinute(time: string): { hour: number; minute: number } | null {
  const [hhRaw, mmRaw] = time.split(":");
  const hour = Number(hhRaw);
  const minute = Number(mmRaw);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

async function scheduleReminderNotification(input: { title: string; time: string }): Promise<string | null> {
  if (Platform.OS === "web") {
    console.log("[engagement] Notifications scheduling skipped on web", input);
    return null;
  }

  const hm = parseTimeToHourMinute(input.time);
  if (!hm) {
    console.warn("[engagement] Invalid reminder time", { time: input.time });
    return null;
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: input.title,
        body: "Tap to open Dia Care and check in.",
        ...(Platform.OS === "android" ? { channelId: "diacare-reminders" } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hm.hour,
        minute: hm.minute,
      },
    });
    console.log("[engagement] Scheduled daily notification", { id, input });
    return id;
  } catch (e) {
    console.error("[engagement] Failed to schedule notification", { input, e });
    return null;
  }
}

async function cancelReminderNotification(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  if (Platform.OS === "web") return;

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log("[engagement] Cancelled notification", { notificationId });
  } catch (e) {
    console.error("[engagement] Failed to cancel notification", { notificationId, e });
  }
}

async function scheduleSnoozeNotification(input: { title: string; snoozedUntil: Date }): Promise<string | null> {
  if (Platform.OS === "web") {
    console.log("[engagement] Snooze notification skipped on web", {
      title: input.title,
      snoozedUntilIso: input.snoozedUntil.toISOString(),
    });
    return null;
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: input.title,
        body: "Snoozed reminder — tap to check in.",
        ...(Platform.OS === "android" ? { channelId: "diacare-reminders" } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: input.snoozedUntil,
      },
    });
    console.log("[engagement] Scheduled snooze notification", { id, title: input.title, at: input.snoozedUntil.toISOString() });
    return id;
  } catch (e) {
    console.error("[engagement] Failed to schedule snooze notification", {
      title: input.title,
      snoozedUntilIso: input.snoozedUntil.toISOString(),
      e,
    });
    return null;
  }
}

export const [EngagementProvider, useEngagement] = createContextHook<EngagementState>(() => {
  const [entries, setEntries] = useState<GlucoseEntry[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [checkinsByDate, setCheckinsByDate] = useState<CheckinsByDate>({});
  const [notificationsStatus, setNotificationsStatus] = useState<EngagementState["notificationsStatus"]>("unknown");
  const [reconcileNonce, setReconcileNonce] = useState<number>(0);

  const [clientId, setClientId] = useState<string | null>(null);
  const [syncUpdatedAtMs, setSyncUpdatedAtMs] = useState<number>(0);

  const hydratedRef = useRef(false);
  const remindersRef = useRef<Reminder[]>([]);
  const reconcileInFlightRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const lastPushedAtMsRef = useRef<number>(0);
  const applyingRemoteRef = useRef(false);

  useEffect(() => {
    remindersRef.current = reminders;
  }, [reminders]);

  useEffect(() => {
    if (Platform.OS === "web") return;

    (async () => {
      try {
        await Notifications.setNotificationChannelAsync("diacare-reminders", {
          name: "Dia Care Reminders",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 100, 250],
          lightColor: "#14B8A6",
          sound: undefined,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          enableVibrate: true,
          showBadge: false,
        });
        console.log("[engagement] Android notification channel ready");
      } catch (e) {
        console.warn("[engagement] Failed to init Android notification channel", e);
      }
    })();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      console.log("[engagement] Hydrating state...");
      const [rawEntries, rawReminders, rawCheckins, rawClientId, rawSyncUpdatedAtMs] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.entries),
        AsyncStorage.getItem(STORAGE_KEYS.reminders),
        AsyncStorage.getItem(STORAGE_KEYS.checkins),
        AsyncStorage.getItem(STORAGE_KEYS.clientId),
        AsyncStorage.getItem(STORAGE_KEYS.syncUpdatedAtMs),
      ]);

      if (!mounted) return;

      const nextEntries = safeParseJson<GlucoseEntry[]>(rawEntries, []);
      const parsedReminders = safeParseJson<Reminder[]>(rawReminders, []);
      const nextReminders: Reminder[] = parsedReminders.map(normalizeReminder);
      const nextCheckins = safeParseJson<CheckinsByDate>(rawCheckins, {});

      const storedSyncUpdatedAtMs = rawSyncUpdatedAtMs ? Number(rawSyncUpdatedAtMs) : 0;
      const nextSyncUpdatedAtMs = Number.isFinite(storedSyncUpdatedAtMs) ? storedSyncUpdatedAtMs : 0;

      let nextClientId = rawClientId ?? null;
      if (!nextClientId) {
        nextClientId = uid("client");
        AsyncStorage.setItem(STORAGE_KEYS.clientId, nextClientId).catch((e) =>
          console.warn("[engagement] Failed to persist clientId", e),
        );
      }

      setEntries(nextEntries);
      setReminders(nextReminders);
      setCheckinsByDate(nextCheckins);
      setClientId(nextClientId);
      setSyncUpdatedAtMs(nextSyncUpdatedAtMs);

      hydratedRef.current = true;
      console.log("[engagement] Hydrated", {
        entries: nextEntries.length,
        reminders: nextReminders.length,
        checkinsDates: Object.keys(nextCheckins).length,
        clientId: nextClientId,
        syncUpdatedAtMs: nextSyncUpdatedAtMs,
      });

      if (Platform.OS !== "web") {
        try {
          const settings = await Notifications.getPermissionsAsync();
          const granted = settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED;
          setNotificationsStatus(granted ? "granted" : "denied");
        } catch (e) {
          console.warn("[engagement] Permissions check failed", e);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries)).catch((e) =>
      console.error("[engagement] Failed to persist entries", e),
    );
  }, [entries]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.checkins, JSON.stringify(checkinsByDate)).catch((e) =>
      console.error("[engagement] Failed to persist checkins", e),
    );
  }, [checkinsByDate]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.reminders, JSON.stringify(reminders)).catch((e) =>
      console.error("[engagement] Failed to persist reminders", e),
    );
  }, [reminders]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.syncUpdatedAtMs, String(syncUpdatedAtMs)).catch((e) =>
      console.error("[engagement] Failed to persist syncUpdatedAtMs", e),
    );
  }, [syncUpdatedAtMs]);

  const reconcileScheduledNotifications = useCallback(async () => {
    if (!hydratedRef.current) return;
    if (Platform.OS === "web") return;
    if (notificationsStatus !== "granted") return;
    if (reconcileInFlightRef.current) return;

    reconcileInFlightRef.current = true;

    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const scheduledIds = new Set<string>(scheduled.map((n) => n.identifier));
      console.log("[engagement] Reconciling scheduled notifications", {
        reminders: remindersRef.current.length,
        scheduled: scheduled.length,
      });

      const now = new Date();
      const toUpdate: {
        reminderId: string;
        notificationId?: string | null;
        enabled?: boolean;
        snoozedUntilIso?: string | null;
        snoozeNotificationId?: string | null;
      }[] = [];

      for (const r of remindersRef.current) {
        const snoozedUntil = r.snoozedUntilIso ? new Date(r.snoozedUntilIso) : null;
        const snoozeActive = Boolean(snoozedUntil && snoozedUntil.getTime() > now.getTime());

        if (!r.enabled) {
          if (r.notificationId) {
            await cancelReminderNotification(r.notificationId);
            toUpdate.push({ reminderId: r.id, notificationId: null, enabled: false });
          }
          if (r.snoozeNotificationId) {
            await cancelReminderNotification(r.snoozeNotificationId);
            toUpdate.push({ reminderId: r.id, snoozedUntilIso: null, snoozeNotificationId: null });
          }
          continue;
        }

        if (snoozedUntil && !snoozeActive) {
          if (r.snoozeNotificationId) {
            await cancelReminderNotification(r.snoozeNotificationId);
          }
          toUpdate.push({ reminderId: r.id, snoozedUntilIso: null, snoozeNotificationId: null });
        } else if (snoozeActive) {
          const snoozeOk = r.snoozeNotificationId ? scheduledIds.has(r.snoozeNotificationId) : false;
          if (!snoozeOk && snoozedUntil) {
            if (r.snoozeNotificationId) {
              await cancelReminderNotification(r.snoozeNotificationId);
            }
            const nextSnoozeId = await scheduleSnoozeNotification({ title: r.title, snoozedUntil });
            toUpdate.push({ reminderId: r.id, snoozeNotificationId: nextSnoozeId ?? null });
          }
        }

        const existingOk = r.notificationId ? scheduledIds.has(r.notificationId) : false;
        if (!existingOk) {
          if (r.notificationId) {
            await cancelReminderNotification(r.notificationId);
          }

          const nextId = await scheduleReminderNotification({ title: r.title, time: r.time });
          toUpdate.push({ reminderId: r.id, notificationId: nextId ?? null, enabled: true });
        }
      }

      if (toUpdate.length > 0) {
        console.log("[engagement] Reconcile updates", { count: toUpdate.length });
        setReminders((prev) =>
          prev.map((r) => {
            const u = toUpdate.find((x) => x.reminderId === r.id);
            if (!u) return r;
            return {
              ...r,
              notificationId: u.notificationId ?? r.notificationId,
              enabled: u.enabled ?? r.enabled,
              snoozedUntilIso: u.snoozedUntilIso ?? r.snoozedUntilIso,
              snoozeNotificationId: u.snoozeNotificationId ?? r.snoozeNotificationId,
            };
          }),
        );
      }
    } catch (e) {
      console.warn("[engagement] Failed to reconcile notifications", e);
    } finally {
      reconcileInFlightRef.current = false;
    }
  }, [notificationsStatus]);

  useEffect(() => {
    void reconcileScheduledNotifications();
  }, [reconcileNonce, reconcileScheduledNotifications]);

  useEffect(() => {
    if (Platform.OS === "web") return;

    const sub = AppState.addEventListener("change", (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev.match(/inactive|background/) && next === "active") {
        console.log("[engagement] App became active; triggering reminder reconcile");
        setReconcileNonce((n) => n + 1);
      }
    });

    return () => {
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (Platform.OS === "web") return;
    if (notificationsStatus !== "granted") return;
    setReconcileNonce((n) => n + 1);
  }, [notificationsStatus, reminders]);

  const bumpSyncUpdatedAt = useCallback(() => {
    const next = Date.now();
    setSyncUpdatedAtMs(next);
    return next;
  }, []);

  const backendEnabled = Platform.OS === "web" || Boolean(process.env.EXPO_PUBLIC_RORK_API_BASE_URL);

  const pingQuery = trpc.engagement.ping.useQuery(undefined, {
    enabled: backendEnabled,
    staleTime: 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (pingQuery.data) {
      console.log("[engagement] backend ping ok", pingQuery.data);
    }
  }, [pingQuery.data]);

  useEffect(() => {
    if (pingQuery.error) {
      console.warn("[engagement] backend ping failed", pingQuery.error);
    }
  }, [pingQuery.error]);

  const pullQuery = trpc.engagement.pullAll.useQuery(
    { clientId: clientId ?? "" },
    {
      enabled: backendEnabled && Boolean(clientId),
      staleTime: 0,
      retry: 1,
    },
  );

  const pushMutation = trpc.engagement.pushAll.useMutation();

  const syncStatsQuery = trpc.engagement.stats.useQuery(
    { clientId: clientId ?? "" },
    {
      enabled: backendEnabled && Boolean(clientId),
      staleTime: 10_000,
      retry: 1,
    },
  );

  useEffect(() => {
    if (syncStatsQuery.data) {
      console.log("[engagement] backend sync stats", syncStatsQuery.data);
    }
  }, [syncStatsQuery.data]);

  useEffect(() => {
    if (syncStatsQuery.error) {
      console.warn("[engagement] backend sync stats failed", syncStatsQuery.error);
    }
  }, [syncStatsQuery.error]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (!clientId) return;
    if (!pullQuery.data) return;

    const remoteUpdatedAtMs = pullQuery.data.updatedAtMs;
    if (!Number.isFinite(remoteUpdatedAtMs) || remoteUpdatedAtMs <= 0) return;

    if (remoteUpdatedAtMs > syncUpdatedAtMs) {
      console.log("[engagement] Applying remote sync state", {
        remoteUpdatedAtMs,
        localUpdatedAtMs: syncUpdatedAtMs,
      });

      applyingRemoteRef.current = true;
      setEntries(pullQuery.data.state.entries);
      setReminders(pullQuery.data.state.reminders.map(normalizeReminder));
      setCheckinsByDate(pullQuery.data.state.checkinsByDate);
      setSyncUpdatedAtMs(remoteUpdatedAtMs);
      setTimeout(() => {
        applyingRemoteRef.current = false;
      }, 0);
    }
  }, [clientId, pullQuery.data, syncUpdatedAtMs]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (!backendEnabled) return;
    if (!clientId) return;
    if (applyingRemoteRef.current) return;

    if (syncUpdatedAtMs <= 0) return;
    if (syncUpdatedAtMs <= lastPushedAtMsRef.current) return;

    const state = {
      entries,
      reminders: reminders.map(normalizeReminder),
      checkinsByDate,
    };

    console.log("[engagement] Pushing sync snapshot", {
      clientId,
      syncUpdatedAtMs,
      entries: state.entries.length,
      reminders: state.reminders.length,
      checkinsDates: Object.keys(state.checkinsByDate).length,
    });

    lastPushedAtMsRef.current = syncUpdatedAtMs;

    pushMutation.mutate(
      {
        clientId,
        updatedAtMs: syncUpdatedAtMs,
        state,
      },
      {
        onError: (e) => {
          console.warn("[engagement] Sync push failed", { clientId, syncUpdatedAtMs, e });
        },
        onSuccess: (res) => {
          console.log("[engagement] Sync push ok", { clientId, res });
        },
      },
    );
  }, [backendEnabled, checkinsByDate, clientId, entries, pushMutation, reminders, syncUpdatedAtMs]);

  const requestNotificationsPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") {
      console.log("[engagement] Notifications permission considered granted on web (no-op)");
      setNotificationsStatus("granted");
      return true;
    }

    try {
      const settings = await Notifications.requestPermissionsAsync();
      const granted = settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED;
      console.log("[engagement] Notifications permission result", settings);
      setNotificationsStatus(granted ? "granted" : "denied");
      return granted;
    } catch (e) {
      console.error("[engagement] Notifications permission request failed", e);
      setNotificationsStatus("denied");
      return false;
    }
  }, []);

  const addEntry = useCallback((input: { valueMgDl: number; context: GlucoseContext; note?: string; createdAt?: Date }) => {
    const createdAt = (input.createdAt ?? new Date()).toISOString();
    const entry: GlucoseEntry = {
      id: uid("glucose"),
      valueMgDl: input.valueMgDl,
      context: input.context,
      note: input.note ?? "",
      createdAt,
    };

    console.log("[engagement] addEntry", entry);
    bumpSyncUpdatedAt();
    setEntries((prev) => [entry, ...prev].slice(0, 400));

    const todayKey = getTodayKey(new Date());
    setCheckinsByDate((prev) => {
      const day = prev[todayKey] ?? {};
      return { ...prev, [todayKey]: { ...day, logGlucose: true } };
    });
  }, [bumpSyncUpdatedAt]);

  const deleteEntry = useCallback(
    (id: string) => {
      console.log("[engagement] deleteEntry", { id });
      bumpSyncUpdatedAt();
      setEntries((prev) => prev.filter((e) => e.id !== id));
    },
    [bumpSyncUpdatedAt],
  );

  const upsertReminder = useCallback(
    async (input: { id?: string; title: string; type: ReminderType; time: string; enabled: boolean }) => {
      const id = input.id ?? uid("reminder");
      const existing = remindersRef.current.find((r) => r.id === id) ?? null;
      console.log("[engagement] upsertReminder", { ...input, id, existing });

      const nextBase: Reminder = {
        id,
        title: input.title,
        type: input.type,
        time: input.time,
        enabled: input.enabled,
        notificationId: existing?.notificationId ?? null,
        snoozedUntilIso: existing?.snoozedUntilIso ?? null,
        snoozeNotificationId: existing?.snoozeNotificationId ?? null,
      };

      bumpSyncUpdatedAt();
      setReminders((prev) => {
        const idx = prev.findIndex((r) => r.id === id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = nextBase;
          return copy;
        }
        return [nextBase, ...prev];
      });

      if (input.enabled) {
        const granted = notificationsStatus === "granted" ? true : await requestNotificationsPermission();
        if (!granted) {
          console.log("[engagement] Notification permission not granted; leaving reminder in-app only", { id });
          return;
        }

        await cancelReminderNotification(existing?.notificationId ?? null);
        const notificationId = await scheduleReminderNotification({ title: input.title, time: input.time });
        if (!notificationId) return;

        setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, notificationId, enabled: true } : r)));
      } else {
        await cancelReminderNotification(existing?.notificationId ?? null);
        if (existing?.snoozeNotificationId) {
          await cancelReminderNotification(existing.snoozeNotificationId);
        }
        bumpSyncUpdatedAt();
        setReminders((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, notificationId: null, enabled: false, snoozedUntilIso: null, snoozeNotificationId: null } : r,
          ),
        );
      }
    },
    [bumpSyncUpdatedAt, notificationsStatus, requestNotificationsPermission],
  );

  const toggleReminder = useCallback(
    async (id: string, enabled: boolean) => {
      const current = reminders.find((r) => r.id === id);
      if (!current) return;
      await upsertReminder({ ...current, enabled, id });
    },
    [reminders, upsertReminder],
  );

  const snoozeReminder = useCallback(
    async (id: string, minutes: number) => {
      const current = remindersRef.current.find((r) => r.id === id) ?? null;
      if (!current) return;
      if (minutes <= 0 || minutes > 24 * 60) return;

      const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);
      console.log("[engagement] snoozeReminder", { id, minutes, snoozedUntilIso: snoozedUntil.toISOString() });

      const granted = notificationsStatus === "granted" ? true : await requestNotificationsPermission();
      if (!granted) {
        console.log("[engagement] Snooze skipped: permission not granted", { id });
        bumpSyncUpdatedAt();
        setReminders((prev) =>
          prev.map((r) => (r.id === id ? { ...r, snoozedUntilIso: snoozedUntil.toISOString(), snoozeNotificationId: null } : r)),
        );
        return;
      }

      if (current.snoozeNotificationId) {
        await cancelReminderNotification(current.snoozeNotificationId);
      }

      const nextSnoozeId = await scheduleSnoozeNotification({ title: current.title, snoozedUntil });

      bumpSyncUpdatedAt();
      setReminders((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, snoozedUntilIso: snoozedUntil.toISOString(), snoozeNotificationId: nextSnoozeId ?? null }
            : r,
        ),
      );
    },
    [bumpSyncUpdatedAt, notificationsStatus, requestNotificationsPermission],
  );

  const clearSnooze = useCallback(
    async (id: string) => {
      const current = remindersRef.current.find((r) => r.id === id) ?? null;
      if (!current) return;
      console.log("[engagement] clearSnooze", { id });

      if (current.snoozeNotificationId) {
        await cancelReminderNotification(current.snoozeNotificationId);
      }

      bumpSyncUpdatedAt();
      setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, snoozedUntilIso: null, snoozeNotificationId: null } : r)));
    },
    [bumpSyncUpdatedAt],
  );

  const removeReminder = useCallback(
    async (id: string) => {
      const current = reminders.find((r) => r.id === id);
      console.log("[engagement] removeReminder", { id, current });
      await cancelReminderNotification(current?.notificationId ?? null);
      await cancelReminderNotification(current?.snoozeNotificationId ?? null);
      bumpSyncUpdatedAt();
      setReminders((prev) => prev.filter((r) => r.id !== id));
    },
    [bumpSyncUpdatedAt, reminders],
  );

  const setCheckin = useCallback(
    (dateKey: string, habit: HabitKey, value: boolean) => {
      console.log("[engagement] setCheckin", { dateKey, habit, value });
      bumpSyncUpdatedAt();
      setCheckinsByDate((prev) => {
        const day = prev[dateKey] ?? {};
        return { ...prev, [dateKey]: { ...day, [habit]: value } };
      });
    },
    [bumpSyncUpdatedAt],
  );

  const getTodayCheckins = useCallback(() => {
    const todayKey = getTodayKey(new Date());
    return checkinsByDate[todayKey] ?? {};
  }, [checkinsByDate]);

  const getCurrentStreak = useCallback(
    (habit: HabitKey) => {
      const now = new Date();
      let streak = 0;

      for (let i = 0; i < 365; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const key = getTodayKey(date);
        const day = checkinsByDate[key];
        const done = Boolean(day?.[habit]);
        if (!done) break;
        streak += 1;
      }

      return streak;
    },
    [checkinsByDate],
  );

  const getLatestGlucoseEntry = useCallback((): GlucoseEntry | null => {
    return entries.length > 0 ? entries[0] : null;
  }, [entries]);

  const value: EngagementState = useMemo(
    () => ({
      entries,
      reminders,
      checkinsByDate,
      notificationsStatus,
      addEntry,
      deleteEntry,
      upsertReminder,
      toggleReminder,
      snoozeReminder,
      clearSnooze,
      removeReminder,
      requestNotificationsPermission,
      setCheckin,
      getTodayCheckins,
      getCurrentStreak,
      getLatestGlucoseEntry,
    }),
    [
      entries,
      reminders,
      checkinsByDate,
      notificationsStatus,
      addEntry,
      deleteEntry,
      upsertReminder,
      toggleReminder,
      snoozeReminder,
      clearSnooze,
      removeReminder,
      requestNotificationsPermission,
      setCheckin,
      getTodayCheckins,
      getCurrentStreak,
      getLatestGlucoseEntry,
    ],
  );

  return value;
});

export type { GlucoseEntry, GlucoseContext, Reminder, ReminderType, HabitKey };
