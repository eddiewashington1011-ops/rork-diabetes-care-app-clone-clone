import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Share } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useEngagement } from "./engagement";
import { useCGM } from "./cgm";
import { useFoodLog } from "./foodLog";

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  email?: string;
  phone?: string;
  clinic?: string;
  notes?: string;
  lastShared?: string;
};

export type Appointment = {
  id: string;
  doctorId: string;
  date: string;
  time: string;
  type: "checkup" | "followup" | "emergency" | "telehealth";
  notes?: string;
  reminder: boolean;
  status: "scheduled" | "completed" | "cancelled";
};

export type SharedReport = {
  id: string;
  doctorId: string;
  reportType: "glucose" | "nutrition" | "comprehensive";
  period: "7days" | "14days" | "30days" | "90days";
  sharedAt: string;
  method: "email" | "message" | "other";
};

type DoctorShareState = {
  doctors: Doctor[];
  appointments: Appointment[];
  sharedReports: SharedReport[];
  isLoading: boolean;

  addDoctor: (doctor: Omit<Doctor, "id">) => Promise<Doctor>;
  updateDoctor: (id: string, updates: Partial<Doctor>) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;
  
  scheduleAppointment: (appointment: Omit<Appointment, "id" | "status">) => Promise<Appointment>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  cancelAppointment: (id: string) => Promise<void>;
  getUpcomingAppointments: () => Appointment[];
  
  shareReportWithDoctor: (doctorId: string, reportType: SharedReport["reportType"], period: SharedReport["period"]) => Promise<void>;
  generateDoctorReport: (doctorId: string, period: SharedReport["period"]) => string;
  getReportsForDoctor: (doctorId: string) => SharedReport[];
};

const STORAGE_KEYS = {
  doctors: "diacare:doctors:v1",
  appointments: "diacare:appointments:v1",
  reports: "diacare:shared_reports:v1",
} as const;

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

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getPeriodDays(period: SharedReport["period"]): number {
  switch (period) {
    case "7days": return 7;
    case "14days": return 14;
    case "30days": return 30;
    case "90days": return 90;
  }
}

export const [DoctorShareProvider, useDoctorShare] = createContextHook<DoctorShareState>(() => {
  const { entries, getCurrentStreak } = useEngagement();
  const { readings, getTimeInRange } = useCGM();
  const { getWeeklySummary } = useFoodLog();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sharedReports, setSharedReports] = useState<SharedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      console.log("[doctorShare] Hydrating...");
      const [rawDoctors, rawAppointments, rawReports] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.doctors),
        AsyncStorage.getItem(STORAGE_KEYS.appointments),
        AsyncStorage.getItem(STORAGE_KEYS.reports),
      ]);

      if (!mounted) return;

      setDoctors(safeParseJson<Doctor[]>(rawDoctors, []));
      setAppointments(safeParseJson<Appointment[]>(rawAppointments, []));
      setSharedReports(safeParseJson<SharedReport[]>(rawReports, []));

      hydratedRef.current = true;
      setIsLoading(false);
      console.log("[doctorShare] Hydrated");
    })();

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.doctors, JSON.stringify(doctors)).catch((e) =>
      console.error("[doctorShare] Failed to persist doctors", e)
    );
  }, [doctors]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.appointments, JSON.stringify(appointments)).catch((e) =>
      console.error("[doctorShare] Failed to persist appointments", e)
    );
  }, [appointments]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.reports, JSON.stringify(sharedReports)).catch((e) =>
      console.error("[doctorShare] Failed to persist reports", e)
    );
  }, [sharedReports]);

  const addDoctor = useCallback(async (doctorData: Omit<Doctor, "id">): Promise<Doctor> => {
    const doctor: Doctor = {
      ...doctorData,
      id: uid("doc"),
    };
    console.log("[doctorShare] addDoctor", { name: doctor.name });
    setDoctors((prev) => [...prev, doctor]);
    return doctor;
  }, []);

  const updateDoctor = useCallback(async (id: string, updates: Partial<Doctor>): Promise<void> => {
    console.log("[doctorShare] updateDoctor", { id });
    setDoctors((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  }, []);

  const deleteDoctor = useCallback(async (id: string): Promise<void> => {
    console.log("[doctorShare] deleteDoctor", { id });
    setDoctors((prev) => prev.filter((d) => d.id !== id));
    setAppointments((prev) => prev.filter((a) => a.doctorId !== id));
  }, []);

  const scheduleAppointment = useCallback(async (data: Omit<Appointment, "id" | "status">): Promise<Appointment> => {
    const appointment: Appointment = {
      ...data,
      id: uid("apt"),
      status: "scheduled",
    };
    console.log("[doctorShare] scheduleAppointment", { doctorId: data.doctorId, date: data.date });
    setAppointments((prev) => [...prev, appointment]);
    return appointment;
  }, []);

  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>): Promise<void> => {
    console.log("[doctorShare] updateAppointment", { id });
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }, []);

  const cancelAppointment = useCallback(async (id: string): Promise<void> => {
    console.log("[doctorShare] cancelAppointment", { id });
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)));
  }, []);

  const getUpcomingAppointments = useCallback((): Appointment[] => {
    const now = new Date();
    return appointments
      .filter((a) => a.status === "scheduled" && new Date(`${a.date}T${a.time}`) > now)
      .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  }, [appointments]);

  const generateDoctorReport = useCallback((doctorId: string, period: SharedReport["period"]): string => {
    const doctor = doctors.find((d) => d.id === doctorId);
    const days = getPeriodDays(period);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const periodEntries = entries.filter(
      (e) => new Date(e.createdAt).getTime() >= cutoffDate.getTime()
    );

    const periodReadings = readings.filter(
      (r) => new Date(r.timestamp).getTime() >= cutoffDate.getTime()
    );

    const allValues = [
      ...periodEntries.map((e) => e.valueMgDl),
      ...periodReadings.map((r) => r.value),
    ];

    const avgGlucose = allValues.length > 0
      ? Math.round(allValues.reduce((a, b) => a + b, 0) / allValues.length)
      : 0;
    const minGlucose = allValues.length > 0 ? Math.min(...allValues) : 0;
    const maxGlucose = allValues.length > 0 ? Math.max(...allValues) : 0;

    const tirData = getTimeInRange(days * 24);
    const weeklySummary = getWeeklySummary();
    const avgCarbs = weeklySummary.length > 0
      ? Math.round(weeklySummary.reduce((sum, d) => sum + d.totals.carbs, 0) / weeklySummary.length)
      : 0;

    const periodLabel = period === "7days" ? "7-Day" :
      period === "14days" ? "14-Day" :
      period === "30days" ? "30-Day" : "90-Day";

    return `
DIABETES HEALTH REPORT
${periodLabel} Summary for ${doctor?.name ?? "Healthcare Provider"}
Generated: ${formatDate(new Date())}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GLUCOSE OVERVIEW
• Average Glucose: ${avgGlucose} mg/dL
• Range: ${minGlucose} - ${maxGlucose} mg/dL
• Time in Range (70-180): ${tirData.inRange}%
• Time Above Range: ${tirData.above}%
• Time Below Range: ${tirData.below}%
• Total Readings: ${allValues.length}

GLUCOSE VARIABILITY
• Coefficient of Variation: ${allValues.length > 1 ? 
  Math.round((Math.sqrt(allValues.reduce((sum, v) => sum + Math.pow(v - avgGlucose, 2), 0) / allValues.length) / avgGlucose) * 100) : 0}%
• GMI (estimated A1C): ${avgGlucose > 0 ? ((3.31 + 0.02392 * avgGlucose)).toFixed(1) : "—"}%

NUTRITION SUMMARY
• Average Daily Carbs: ${avgCarbs}g
• Daily Calorie Average: ${weeklySummary.length > 0 ? 
  Math.round(weeklySummary.reduce((sum, d) => sum + d.totals.calories, 0) / weeklySummary.length) : 0} kcal
• Meals Logged This Period: ${weeklySummary.reduce((sum, d) => sum + d.entries.length, 0)}

ACTIVITY & ENGAGEMENT
• Movement Streak: ${getCurrentStreak("move")} days
• Hydration Streak: ${getCurrentStreak("hydrate")} days
• Active Monitoring: ${periodEntries.length > 0 ? "Yes" : "Limited data"}

PATTERNS & INSIGHTS
${avgGlucose > 180 ? "⚠️ Average glucose elevated - consider reviewing meal timing and carb intake" : ""}
${tirData.below > 10 ? "⚠️ Significant time below range - hypoglycemia management may need review" : ""}
${tirData.inRange >= 70 ? "✅ Good time in range - maintain current management approach" : ""}
${avgCarbs > 200 ? "📊 Higher carb intake detected - consider spacing carbs throughout the day" : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated by Dia Care App
This report is for informational purposes only.
Please discuss findings with your healthcare provider.
    `.trim();
  }, [doctors, entries, readings, getTimeInRange, getCurrentStreak, getWeeklySummary]);

  const shareReportWithDoctor = useCallback(async (
    doctorId: string,
    reportType: SharedReport["reportType"],
    period: SharedReport["period"]
  ): Promise<void> => {
    const doctor = doctors.find((d) => d.id === doctorId);
    if (!doctor) {
      Alert.alert("Error", "Doctor not found");
      return;
    }

    const reportContent = generateDoctorReport(doctorId, period);

    try {
      const result = await Share.share({
        title: `Diabetes Report for ${doctor.name}`,
        message: reportContent,
      });

      if (result.action === Share.sharedAction) {
        const report: SharedReport = {
          id: uid("report"),
          doctorId,
          reportType,
          period,
          sharedAt: new Date().toISOString(),
          method: "other",
        };

        setSharedReports((prev) => [report, ...prev]);
        setDoctors((prev) =>
          prev.map((d) => (d.id === doctorId ? { ...d, lastShared: new Date().toISOString() } : d))
        );

        console.log("[doctorShare] Report shared successfully");
      }
    } catch (error) {
      console.error("[doctorShare] Share failed", error);
      Alert.alert("Share Failed", "Could not share the report. Please try again.");
    }
  }, [doctors, generateDoctorReport]);

  const getReportsForDoctor = useCallback((doctorId: string): SharedReport[] => {
    return sharedReports.filter((r) => r.doctorId === doctorId);
  }, [sharedReports]);

  const value: DoctorShareState = useMemo(() => ({
    doctors,
    appointments,
    sharedReports,
    isLoading,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    scheduleAppointment,
    updateAppointment,
    cancelAppointment,
    getUpcomingAppointments,
    shareReportWithDoctor,
    generateDoctorReport,
    getReportsForDoctor,
  }), [
    doctors, appointments, sharedReports, isLoading,
    addDoctor, updateDoctor, deleteDoctor,
    scheduleAppointment, updateAppointment, cancelAppointment, getUpcomingAppointments,
    shareReportWithDoctor, generateDoctorReport, getReportsForDoctor,
  ]);

  return value;
});
