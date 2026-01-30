import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

type AnalyticsEvent = {
  name: string;
  properties?: Record<string, any>;
  timestamp: string;
};

type SessionData = {
  startTime: string;
  endTime?: string;
  screenViews: string[];
  eventsCount: number;
};

type AnalyticsState = {
  trackEvent: (name: string, properties?: Record<string, any>) => void;
  trackScreenView: (screenName: string) => void;
  getUserStats: () => {
    totalSessions: number;
    totalEvents: number;
    mostViewedScreens: { screen: string; count: number }[];
    lastActiveDate: string | null;
    daysActive: number;
  };
  isInitialized: boolean;
};

const STORAGE_KEYS = {
  events: "diacare:analytics_events:v1",
  sessions: "diacare:analytics_sessions:v1",
  stats: "diacare:analytics_stats:v1",
} as const;

type StoredStats = {
  totalSessions: number;
  totalEvents: number;
  screenViewCounts: Record<string, number>;
  lastActiveDate: string | null;
  activeDates: string[];
};

function getTodayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const [AnalyticsProvider, useAnalytics] = createContextHook<AnalyticsState>(() => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [stats, setStats] = useState<StoredStats>({
    totalSessions: 0,
    totalEvents: 0,
    screenViewCounts: {},
    lastActiveDate: null,
    activeDates: [],
  });

  const currentSessionRef = useRef<SessionData | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const eventsQueueRef = useRef<AnalyticsEvent[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const storedStats = await AsyncStorage.getItem(STORAGE_KEYS.stats);
        if (storedStats) {
          const parsed = JSON.parse(storedStats) as StoredStats;
          setStats(parsed);
          console.log("[analytics] Loaded stats", parsed);
        }

        currentSessionRef.current = {
          startTime: new Date().toISOString(),
          screenViews: [],
          eventsCount: 0,
        };

        setStats((prev) => {
          const today = getTodayKey();
          const activeDates = prev.activeDates.includes(today)
            ? prev.activeDates
            : [...prev.activeDates, today].slice(-365);
          return {
            ...prev,
            totalSessions: prev.totalSessions + 1,
            lastActiveDate: today,
            activeDates,
          };
        });

        setIsInitialized(true);
        console.log("[analytics] Session started");
      } catch (e) {
        console.error("[analytics] Failed to initialize", e);
        setIsInitialized(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    AsyncStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats)).catch((e) =>
      console.error("[analytics] Failed to persist stats", e)
    );
  }, [stats, isInitialized]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (prevState === "active" && nextState.match(/inactive|background/)) {
        if (currentSessionRef.current) {
          currentSessionRef.current.endTime = new Date().toISOString();
          console.log("[analytics] Session paused", currentSessionRef.current);
        }
      } else if (prevState.match(/inactive|background/) && nextState === "active") {
        const lastEnd = currentSessionRef.current?.endTime;
        if (lastEnd) {
          const elapsed = Date.now() - new Date(lastEnd).getTime();
          if (elapsed > 30 * 60 * 1000) {
            currentSessionRef.current = {
              startTime: new Date().toISOString(),
              screenViews: [],
              eventsCount: 0,
            };
            setStats((prev) => ({
              ...prev,
              totalSessions: prev.totalSessions + 1,
            }));
            console.log("[analytics] New session started after long pause");
          } else {
            currentSessionRef.current.endTime = undefined;
            console.log("[analytics] Session resumed");
          }
        }
      }
    });

    return () => subscription.remove();
  }, []);

  const trackEvent = useCallback((name: string, properties?: Record<string, any>) => {
    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: new Date().toISOString(),
    };

    eventsQueueRef.current.push(event);
    if (eventsQueueRef.current.length > 100) {
      eventsQueueRef.current = eventsQueueRef.current.slice(-100);
    }

    if (currentSessionRef.current !== null) {
      currentSessionRef.current.eventsCount += 1;
    }

    setStats((prev) => ({
      ...prev,
      totalEvents: prev.totalEvents + 1,
    }));

    console.log("[analytics] Event tracked", { name, properties });
  }, []);

  const trackScreenView = useCallback((screenName: string) => {
    if (currentSessionRef.current) {
      currentSessionRef.current.screenViews.push(screenName);
    }

    setStats((prev) => ({
      ...prev,
      screenViewCounts: {
        ...prev.screenViewCounts,
        [screenName]: (prev.screenViewCounts[screenName] ?? 0) + 1,
      },
    }));

    console.log("[analytics] Screen view", { screenName });
  }, []);

  const getUserStats = useCallback(() => {
    const sortedScreens = Object.entries(stats.screenViewCounts)
      .map(([screen, count]) => ({ screen, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSessions: stats.totalSessions,
      totalEvents: stats.totalEvents,
      mostViewedScreens: sortedScreens,
      lastActiveDate: stats.lastActiveDate,
      daysActive: stats.activeDates.length,
    };
  }, [stats]);

  const value: AnalyticsState = useMemo(
    () => ({
      trackEvent,
      trackScreenView,
      getUserStats,
      isInitialized,
    }),
    [trackEvent, trackScreenView, getUserStats, isInitialized]
  );

  return value;
});
