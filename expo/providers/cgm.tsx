import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Vibration } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import * as Haptics from "expo-haptics";

export type CGMTrend = "rising_fast" | "rising" | "stable" | "falling" | "falling_fast";

export type CGMReading = {
  id: string;
  value: number;
  timestamp: string;
  trend: CGMTrend;
};

export type CGMConnectionStatus = "disconnected" | "connecting" | "connected" | "signal_loss";

export type CGMDevice = {
  id: string;
  name: string;
  type: "dexcom" | "libre" | "medtronic" | "simulated";
  lastSync: string | null;
};

export type CGMAlert = {
  id: string;
  type: "high" | "low" | "urgent_low" | "signal_loss" | "rising_fast" | "falling_fast";
  value: number;
  timestamp: string;
  acknowledged: boolean;
};

export type CGMSettings = {
  highThreshold: number;
  lowThreshold: number;
  urgentLowThreshold: number;
  alertsEnabled: boolean;
  hapticFeedback: boolean;
  targetRangeMin: number;
  targetRangeMax: number;
};

type CGMState = {
  readings: CGMReading[];
  currentReading: CGMReading | null;
  connectionStatus: CGMConnectionStatus;
  device: CGMDevice | null;
  alerts: CGMAlert[];
  settings: CGMSettings;
  isSimulating: boolean;

  connectDevice: (deviceType: CGMDevice["type"]) => Promise<void>;
  disconnectDevice: () => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  acknowledgeAlert: (alertId: string) => void;
  clearAlerts: () => void;
  updateSettings: (settings: Partial<CGMSettings>) => void;
  getTimeInRange: (hours?: number) => { inRange: number; above: number; below: number; readings: number };
  getAverageGlucose: (hours?: number) => number | null;
  getGMI: () => number | null;
  getReadingsForPeriod: (hours: number) => CGMReading[];
};

const STORAGE_KEYS = {
  readings: "diacare:cgm_readings:v1",
  settings: "diacare:cgm_settings:v1",
  device: "diacare:cgm_device:v1",
} as const;

const DEFAULT_SETTINGS: CGMSettings = {
  highThreshold: 180,
  lowThreshold: 70,
  urgentLowThreshold: 55,
  alertsEnabled: true,
  hapticFeedback: true,
  targetRangeMin: 70,
  targetRangeMax: 180,
};

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function calculateTrend(readings: CGMReading[]): CGMTrend {
  if (readings.length < 3) return "stable";
  
  const recent = readings.slice(0, 3);
  const rateOfChange = (recent[0].value - recent[2].value) / 10;
  
  if (rateOfChange > 3) return "rising_fast";
  if (rateOfChange > 1) return "rising";
  if (rateOfChange < -3) return "falling_fast";
  if (rateOfChange < -1) return "falling";
  return "stable";
}

function getTrendArrow(trend: CGMTrend): string {
  switch (trend) {
    case "rising_fast": return "↑↑";
    case "rising": return "↑";
    case "stable": return "→";
    case "falling": return "↓";
    case "falling_fast": return "↓↓";
  }
}

function getTrendLabel(trend: CGMTrend): string {
  switch (trend) {
    case "rising_fast": return "Rising fast";
    case "rising": return "Rising";
    case "stable": return "Stable";
    case "falling": return "Falling";
    case "falling_fast": return "Falling fast";
  }
}

function generateSimulatedReading(lastValue: number, readings: CGMReading[]): CGMReading {
  const noise = (Math.random() - 0.5) * 15;
  const mealEffect = Math.random() > 0.95 ? Math.random() * 40 : 0;
  const insulinEffect = Math.random() > 0.95 ? -Math.random() * 30 : 0;
  
  const meanReversion = (100 - lastValue) * 0.02;
  
  let newValue = lastValue + noise + mealEffect + insulinEffect + meanReversion;
  newValue = Math.max(40, Math.min(400, newValue));
  newValue = Math.round(newValue);
  
  const tempReadings: CGMReading[] = [
    { id: "temp", value: newValue, timestamp: new Date().toISOString(), trend: "stable" },
    ...readings.slice(0, 2),
  ];
  
  const trend = calculateTrend(tempReadings);
  
  return {
    id: uid("cgm"),
    value: newValue,
    timestamp: new Date().toISOString(),
    trend,
  };
}

export const [CGMProvider, useCGM] = createContextHook<CGMState>(() => {
  const [readings, setReadings] = useState<CGMReading[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<CGMConnectionStatus>("disconnected");
  const [device, setDevice] = useState<CGMDevice | null>(null);
  const [alerts, setAlerts] = useState<CGMAlert[]>([]);
  const [settings, setSettings] = useState<CGMSettings>(DEFAULT_SETTINGS);
  const [isSimulating, setIsSimulating] = useState(false);
  
  const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      console.log("[cgm] Hydrating state...");
      const [rawReadings, rawSettings, rawDevice] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.readings),
        AsyncStorage.getItem(STORAGE_KEYS.settings),
        AsyncStorage.getItem(STORAGE_KEYS.device),
      ]);

      if (!mounted) return;

      const storedReadings = safeParseJson<CGMReading[]>(rawReadings, []);
      const storedSettings = safeParseJson<CGMSettings>(rawSettings, DEFAULT_SETTINGS);
      const storedDevice = safeParseJson<CGMDevice | null>(rawDevice, null);

      setReadings(storedReadings);
      setSettings({ ...DEFAULT_SETTINGS, ...storedSettings });
      
      if (storedDevice) {
        setDevice(storedDevice);
        if (storedDevice.type === "simulated") {
          setConnectionStatus("connected");
          setIsSimulating(true);
        }
      }

      hydratedRef.current = true;
      console.log("[cgm] Hydrated", {
        readings: storedReadings.length,
        device: storedDevice?.name ?? "none",
      });
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.readings, JSON.stringify(readings.slice(0, 2880))).catch((e) =>
      console.error("[cgm] Failed to persist readings", e)
    );
  }, [readings]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings)).catch((e) =>
      console.error("[cgm] Failed to persist settings", e)
    );
  }, [settings]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.device, JSON.stringify(device)).catch((e) =>
      console.error("[cgm] Failed to persist device", e)
    );
  }, [device]);

  const triggerAlert = useCallback((type: CGMAlert["type"], value: number) => {
    if (!settings.alertsEnabled) return;
    
    const alert: CGMAlert = {
      id: uid("alert"),
      type,
      value,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };
    
    console.log("[cgm] Alert triggered", alert);
    setAlerts((prev) => [alert, ...prev].slice(0, 50));
    
    if (settings.hapticFeedback && Platform.OS !== "web") {
      if (type === "urgent_low") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Vibration.vibrate([0, 500, 200, 500]);
      } else if (type === "high" || type === "low") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }
  }, [settings.alertsEnabled, settings.hapticFeedback]);

  const checkAlerts = useCallback((reading: CGMReading) => {
    const { value, trend } = reading;
    
    if (value <= settings.urgentLowThreshold) {
      triggerAlert("urgent_low", value);
    } else if (value < settings.lowThreshold) {
      triggerAlert("low", value);
    } else if (value > settings.highThreshold) {
      triggerAlert("high", value);
    }
    
    if (trend === "rising_fast") {
      triggerAlert("rising_fast", value);
    } else if (trend === "falling_fast") {
      triggerAlert("falling_fast", value);
    }
  }, [settings, triggerAlert]);

  

  useEffect(() => {
    if (!isSimulating || connectionStatus !== "connected") {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      return;
    }

    const runSimulation = () => {
      setReadings((prev) => {
        const lastValue = prev[0]?.value ?? 100;
        const newReading = generateSimulatedReading(lastValue, prev);
        console.log("[cgm] Simulated reading", { value: newReading.value, trend: newReading.trend });
        
        setTimeout(() => checkAlerts(newReading), 0);
        
        return [newReading, ...prev].slice(0, 2880);
      });
    };

    runSimulation();
    
    simulationIntervalRef.current = setInterval(runSimulation, 5 * 60 * 1000);

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
    };
  }, [isSimulating, connectionStatus, checkAlerts]);

  const connectDevice = useCallback(async (deviceType: CGMDevice["type"]) => {
    console.log("[cgm] Connecting device", { deviceType });
    setConnectionStatus("connecting");

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const deviceNames: Record<CGMDevice["type"], string> = {
      dexcom: "Dexcom G7",
      libre: "FreeStyle Libre 3",
      medtronic: "Medtronic Guardian",
      simulated: "Demo CGM",
    };

    const newDevice: CGMDevice = {
      id: uid("device"),
      name: deviceNames[deviceType],
      type: deviceType,
      lastSync: new Date().toISOString(),
    };

    setDevice(newDevice);
    setConnectionStatus("connected");
    
    if (deviceType === "simulated") {
      setIsSimulating(true);
    }

    console.log("[cgm] Device connected", newDevice);
  }, []);

  const disconnectDevice = useCallback(() => {
    console.log("[cgm] Disconnecting device");
    setIsSimulating(false);
    setConnectionStatus("disconnected");
    setDevice(null);
    
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  }, []);

  const startSimulation = useCallback(() => {
    if (device?.type === "simulated") {
      setIsSimulating(true);
    }
  }, [device]);

  const stopSimulation = useCallback(() => {
    setIsSimulating(false);
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<CGMSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const getReadingsForPeriod = useCallback((hours: number): CGMReading[] => {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return readings.filter((r) => new Date(r.timestamp).getTime() >= cutoff);
  }, [readings]);

  const getTimeInRange = useCallback((hours = 24) => {
    const periodReadings = getReadingsForPeriod(hours);
    if (periodReadings.length === 0) {
      return { inRange: 0, above: 0, below: 0, readings: 0 };
    }

    const inRange = periodReadings.filter(
      (r) => r.value >= settings.targetRangeMin && r.value <= settings.targetRangeMax
    ).length;
    const above = periodReadings.filter((r) => r.value > settings.targetRangeMax).length;
    const below = periodReadings.filter((r) => r.value < settings.targetRangeMin).length;

    return {
      inRange: Math.round((inRange / periodReadings.length) * 100),
      above: Math.round((above / periodReadings.length) * 100),
      below: Math.round((below / periodReadings.length) * 100),
      readings: periodReadings.length,
    };
  }, [getReadingsForPeriod, settings.targetRangeMax, settings.targetRangeMin]);

  const getAverageGlucose = useCallback((hours = 24): number | null => {
    const periodReadings = getReadingsForPeriod(hours);
    if (periodReadings.length === 0) return null;

    const sum = periodReadings.reduce((acc, r) => acc + r.value, 0);
    return Math.round(sum / periodReadings.length);
  }, [getReadingsForPeriod]);

  const getGMI = useCallback((): number | null => {
    const avg = getAverageGlucose(24 * 14);
    if (avg === null) return null;
    return Math.round((3.31 + 0.02392 * avg) * 10) / 10;
  }, [getAverageGlucose]);

  const currentReading = readings[0] ?? null;

  const value: CGMState = useMemo(
    () => ({
      readings,
      currentReading,
      connectionStatus,
      device,
      alerts,
      settings,
      isSimulating,
      connectDevice,
      disconnectDevice,
      startSimulation,
      stopSimulation,
      acknowledgeAlert,
      clearAlerts,
      updateSettings,
      getTimeInRange,
      getAverageGlucose,
      getGMI,
      getReadingsForPeriod,
    }),
    [
      readings,
      currentReading,
      connectionStatus,
      device,
      alerts,
      settings,
      isSimulating,
      connectDevice,
      disconnectDevice,
      startSimulation,
      stopSimulation,
      acknowledgeAlert,
      clearAlerts,
      updateSettings,
      getTimeInRange,
      getAverageGlucose,
      getGMI,
      getReadingsForPeriod,
    ]
  );

  return value;
});

export { getTrendArrow, getTrendLabel };
