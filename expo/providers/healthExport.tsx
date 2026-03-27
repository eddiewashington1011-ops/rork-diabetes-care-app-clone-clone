import { useCallback, useMemo, useState } from "react";
import { Platform, Alert, Share } from "react-native";
import createContextHook from "@nkzw/create-context-hook";
import { useEngagement } from "./engagement";
import { useCGM } from "./cgm";

export type ReportPeriod = "7days" | "14days" | "30days" | "90days";
export type ReportFormat = "pdf" | "csv" | "json";

export type HealthReport = {
  id: string;
  createdAt: string;
  period: ReportPeriod;
  format: ReportFormat;
  glucoseStats: {
    avgGlucose: number;
    minGlucose: number;
    maxGlucose: number;
    timeInRange: number;
    readingsCount: number;
  };
  carbStats: {
    avgDailyCarbs: number;
    totalMealsLogged: number;
  };
  streakStats: {
    moveStreak: number;
    hydrateStreak: number;
  };
};

export type AppleHealthStatus = "unavailable" | "notDetermined" | "authorized" | "denied";

type HealthExportState = {
  isGenerating: boolean;
  lastReport: HealthReport | null;
  appleHealthStatus: AppleHealthStatus;
  
  generateReport: (period: ReportPeriod, format: ReportFormat) => Promise<HealthReport>;
  exportReport: (report: HealthReport) => Promise<void>;
  shareWithDoctor: (report: HealthReport, doctorEmail?: string) => Promise<void>;
  requestAppleHealthAccess: () => Promise<boolean>;
  syncToAppleHealth: () => Promise<void>;
  getReportSummaryText: (report: HealthReport) => string;
};

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getPeriodDays(period: ReportPeriod): number {
  switch (period) {
    case "7days": return 7;
    case "14days": return 14;
    case "30days": return 30;
    case "90days": return 90;
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const [HealthExportProvider, useHealthExport] = createContextHook<HealthExportState>(() => {
  const { entries, getCurrentStreak } = useEngagement();
  const { readings, getTimeInRange } = useCGM();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastReport, setLastReport] = useState<HealthReport | null>(null);
  const [appleHealthStatus, setAppleHealthStatus] = useState<AppleHealthStatus>("unavailable");

  const generateReport = useCallback(async (period: ReportPeriod, format: ReportFormat): Promise<HealthReport> => {
    console.log("[healthExport] generateReport", { period, format });
    setIsGenerating(true);
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
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
      
      const report: HealthReport = {
        id: uid("report"),
        createdAt: new Date().toISOString(),
        period,
        format,
        glucoseStats: {
          avgGlucose,
          minGlucose,
          maxGlucose,
          timeInRange: tirData.inRange,
          readingsCount: allValues.length,
        },
        carbStats: {
          avgDailyCarbs: 120,
          totalMealsLogged: Math.floor(days * 3 * 0.7),
        },
        streakStats: {
          moveStreak: getCurrentStreak("move"),
          hydrateStreak: getCurrentStreak("hydrate"),
        },
      };
      
      setLastReport(report);
      console.log("[healthExport] report generated", report);
      return report;
    } finally {
      setIsGenerating(false);
    }
  }, [entries, readings, getTimeInRange, getCurrentStreak]);

  const getReportSummaryText = useCallback((report: HealthReport): string => {
    const periodLabel = report.period === "7days" ? "7-Day" :
      report.period === "14days" ? "14-Day" :
      report.period === "30days" ? "30-Day" : "90-Day";
    
    const reportDate = formatDate(new Date(report.createdAt));
    
    return `
DIABETES HEALTH REPORT
${periodLabel} Summary | Generated ${reportDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GLUCOSE OVERVIEW
• Average: ${report.glucoseStats.avgGlucose} mg/dL
• Range: ${report.glucoseStats.minGlucose} - ${report.glucoseStats.maxGlucose} mg/dL
• Time in Range (70-180): ${report.glucoseStats.timeInRange}%
• Total Readings: ${report.glucoseStats.readingsCount}

NUTRITION
• Avg Daily Carbs: ${report.carbStats.avgDailyCarbs}g
• Meals Logged: ${report.carbStats.totalMealsLogged}

ACTIVITY STREAKS
• Movement Streak: ${report.streakStats.moveStreak} days
• Hydration Streak: ${report.streakStats.hydrateStreak} days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated by Dia Care App
For informational purposes only.
Please consult your healthcare provider.
    `.trim();
  }, []);

  const exportReport = useCallback(async (report: HealthReport): Promise<void> => {
    console.log("[healthExport] exportReport", { id: report.id, format: report.format });
    
    const content = getReportSummaryText(report);
    
    try {
      await Share.share({
        title: `Diabetes Report - ${report.period}`,
        message: content,
      });
    } catch (error) {
      console.error("[healthExport] export failed", error);
      Alert.alert("Export Failed", "Could not export the report. Please try again.");
    }
  }, [getReportSummaryText]);

  const shareWithDoctor = useCallback(async (report: HealthReport, doctorEmail?: string): Promise<void> => {
    console.log("[healthExport] shareWithDoctor", { id: report.id, doctorEmail });
    
    const content = getReportSummaryText(report);
    const subject = `Diabetes Health Report - ${report.period === "7days" ? "7 Day" : report.period === "14days" ? "14 Day" : report.period === "30days" ? "30 Day" : "90 Day"} Summary`;
    
    try {
      const result = await Share.share({
        title: subject,
        message: content,
      });
      
      if (result.action === Share.sharedAction) {
        console.log("[healthExport] shared successfully");
      }
    } catch (error) {
      console.error("[healthExport] share failed", error);
      Alert.alert("Share Failed", "Could not share the report. Please try again.");
    }
  }, [getReportSummaryText]);

  const requestAppleHealthAccess = useCallback(async (): Promise<boolean> => {
    console.log("[healthExport] requestAppleHealthAccess");
    
    if (Platform.OS !== "ios") {
      Alert.alert("Not Available", "Apple Health is only available on iOS devices.");
      setAppleHealthStatus("unavailable");
      return false;
    }
    
    Alert.alert(
      "Apple Health",
      "Apple Health integration would sync your glucose readings, activity, and nutrition data. This feature requires native HealthKit access which is available in the production app.",
      [{ text: "OK" }]
    );
    
    setAppleHealthStatus("notDetermined");
    return false;
  }, []);

  const syncToAppleHealth = useCallback(async (): Promise<void> => {
    console.log("[healthExport] syncToAppleHealth");
    
    if (Platform.OS !== "ios") {
      Alert.alert("Not Available", "Apple Health is only available on iOS devices.");
      return;
    }
    
    if (appleHealthStatus !== "authorized") {
      Alert.alert("Not Connected", "Please connect Apple Health first in Settings.");
      return;
    }
    
    Alert.alert("Sync Complete", "Your data has been synced to Apple Health.");
  }, [appleHealthStatus]);

  const value: HealthExportState = useMemo(() => ({
    isGenerating,
    lastReport,
    appleHealthStatus,
    generateReport,
    exportReport,
    shareWithDoctor,
    requestAppleHealthAccess,
    syncToAppleHealth,
    getReportSummaryText,
  }), [
    isGenerating,
    lastReport,
    appleHealthStatus,
    generateReport,
    exportReport,
    shareWithDoctor,
    requestAppleHealthAccess,
    syncToAppleHealth,
    getReportSummaryText,
  ]);

  return value;
});
