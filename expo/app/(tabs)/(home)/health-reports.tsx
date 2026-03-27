import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import {
  FileText,
  Download,
  Share2,
  Calendar,
  Activity,
  Heart,
  Utensils,
  Flame,
  Target,
  TrendingUp,
  Stethoscope,
  CheckCircle,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { useHealthExport, ReportPeriod } from "@/providers/healthExport";
import { AnimatedPressable, FadeIn } from "@/components/AnimatedPressable";

const PERIODS: { key: ReportPeriod; label: string; desc: string }[] = [
  { key: "7days", label: "7 Days", desc: "Weekly snapshot" },
  { key: "14days", label: "14 Days", desc: "Bi-weekly review" },
  { key: "30days", label: "30 Days", desc: "Monthly summary" },
  { key: "90days", label: "90 Days", desc: "Quarterly report" },
];

export default function HealthReportsScreen() {
  const {
    isGenerating,
    lastReport,
    appleHealthStatus,
    generateReport,
    exportReport,
    shareWithDoctor,
    requestAppleHealthAccess,
  } = useHealthExport();

  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("30days");

  const onGenerate = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    console.log("[health-reports] generating report", { selectedPeriod });
    await generateReport(selectedPeriod, "pdf");
  }, [generateReport, selectedPeriod]);

  const onExport = useCallback(async () => {
    if (!lastReport) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await exportReport(lastReport);
  }, [exportReport, lastReport]);

  const onShareDoctor = useCallback(async () => {
    if (!lastReport) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await shareWithDoctor(lastReport);
  }, [shareWithDoctor, lastReport]);

  const onConnectAppleHealth = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await requestAppleHealthAccess();
  }, [requestAppleHealthAccess]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Health Reports",
          headerStyle: { backgroundColor: Colors.light.surface },
          headerTitleStyle: { fontWeight: "700" },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <FileText size={28} color={Colors.light.tint} />
            </View>
            <Text style={styles.heroTitle}>Generate Health Report</Text>
            <Text style={styles.heroDesc}>
              Create a comprehensive report of your glucose data, nutrition, and activity to share with your healthcare provider.
            </Text>
          </View>
        </FadeIn>

        <FadeIn delay={50}>
          <Text style={styles.sectionTitle}>Select Report Period</Text>
          <View style={styles.periodGrid}>
            {PERIODS.map((p) => {
              const active = selectedPeriod === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.periodCard, active && styles.periodCardActive]}
                  onPress={() => setSelectedPeriod(p.key)}
                  activeOpacity={0.85}
                  testID={`period-${p.key}`}
                >
                  <Calendar size={18} color={active ? "#fff" : Colors.light.tint} />
                  <Text style={[styles.periodLabel, active && styles.periodLabelActive]}>
                    {p.label}
                  </Text>
                  <Text style={[styles.periodDesc, active && styles.periodDescActive]}>
                    {p.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </FadeIn>

        <FadeIn delay={100}>
          <AnimatedPressable
            style={[styles.generateBtn, isGenerating && styles.generateBtnDisabled]}
            onPress={onGenerate}
            disabled={isGenerating}
            testID="generate-report-btn"
          >
            {isGenerating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <FileText size={20} color="#fff" />
            )}
            <Text style={styles.generateBtnText}>
              {isGenerating ? "Generating Report..." : "Generate Report"}
            </Text>
          </AnimatedPressable>
        </FadeIn>

        {lastReport && (
          <FadeIn delay={150}>
            <View style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={styles.reportTitleRow}>
                  <CheckCircle size={18} color={Colors.light.success} />
                  <Text style={styles.reportTitle}>Report Ready</Text>
                </View>
                <Text style={styles.reportDate}>
                  {new Date(lastReport.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: Colors.light.tintLight }]}>
                    <Activity size={16} color={Colors.light.tint} />
                  </View>
                  <Text style={styles.statValue}>{lastReport.glucoseStats.avgGlucose}</Text>
                  <Text style={styles.statLabel}>Avg mg/dL</Text>
                </View>

                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: Colors.light.successLight }]}>
                    <Target size={16} color={Colors.light.success} />
                  </View>
                  <Text style={styles.statValue}>{lastReport.glucoseStats.timeInRange}%</Text>
                  <Text style={styles.statLabel}>In Range</Text>
                </View>

                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: Colors.light.accentLight }]}>
                    <Utensils size={16} color={Colors.light.accent} />
                  </View>
                  <Text style={styles.statValue}>{lastReport.carbStats.avgDailyCarbs}g</Text>
                  <Text style={styles.statLabel}>Avg Carbs</Text>
                </View>

                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: Colors.light.goldLight }]}>
                    <Flame size={16} color={Colors.light.gold} />
                  </View>
                  <Text style={styles.statValue}>{lastReport.streakStats.moveStreak}</Text>
                  <Text style={styles.statLabel}>Move Streak</Text>
                </View>
              </View>

              <View style={styles.reportActions}>
                <TouchableOpacity
                  style={styles.reportActionBtn}
                  onPress={onExport}
                  activeOpacity={0.85}
                  testID="export-report-btn"
                >
                  <Download size={18} color={Colors.light.tint} />
                  <Text style={styles.reportActionText}>Export</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reportActionBtn, styles.reportActionPrimary]}
                  onPress={onShareDoctor}
                  activeOpacity={0.85}
                  testID="share-doctor-btn"
                >
                  <Stethoscope size={18} color="#fff" />
                  <Text style={[styles.reportActionText, { color: "#fff" }]}>
                    Share with Doctor
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </FadeIn>
        )}

        <FadeIn delay={200}>
          <Text style={styles.sectionTitle}>Health Integrations</Text>
          
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={styles.integrationCard}
              onPress={onConnectAppleHealth}
              activeOpacity={0.85}
              testID="apple-health-btn"
            >
              <View style={[styles.integrationIcon, { backgroundColor: "#FF2D55" + "20" }]}>
                <Heart size={22} color="#FF2D55" />
              </View>
              <View style={styles.integrationContent}>
                <Text style={styles.integrationTitle}>Apple Health</Text>
                <Text style={styles.integrationDesc}>
                  Sync glucose, activity, and nutrition data
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                appleHealthStatus === "authorized" && styles.statusBadgeConnected
              ]}>
                <Text style={[
                  styles.statusBadgeText,
                  appleHealthStatus === "authorized" && styles.statusBadgeTextConnected
                ]}>
                  {appleHealthStatus === "authorized" ? "Connected" : "Connect"}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.integrationCard}>
            <View style={[styles.integrationIcon, { backgroundColor: Colors.light.sapphireLight }]}>
              <Share2 size={22} color={Colors.light.sapphire} />
            </View>
            <View style={styles.integrationContent}>
              <Text style={styles.integrationTitle}>Share Reports</Text>
              <Text style={styles.integrationDesc}>
                Email or message reports to your care team
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Available</Text>
            </View>
          </View>

          <View style={styles.integrationCard}>
            <View style={[styles.integrationIcon, { backgroundColor: Colors.light.successLight }]}>
              <TrendingUp size={22} color={Colors.light.success} />
            </View>
            <View style={styles.integrationContent}>
              <Text style={styles.integrationTitle}>CGM Data Export</Text>
              <Text style={styles.integrationDesc}>
                Export continuous glucose monitoring data
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Available</Text>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={250}>
          <View style={styles.disclaimerCard}>
            <Text style={styles.disclaimerTitle}>Medical Disclaimer</Text>
            <Text style={styles.disclaimerText}>
              Reports generated by Dia Care are for informational purposes only and should not replace professional medical advice. Always consult with your healthcare provider for medical decisions.
            </Text>
          </View>
        </FadeIn>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  heroCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 24,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.light.tintLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  periodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  periodCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  periodCardActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  periodLabel: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginTop: 8,
  },
  periodLabelActive: {
    color: "#fff",
  },
  periodDesc: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  periodDescActive: {
    color: "rgba(255,255,255,0.8)",
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.light.sapphire,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },
  generateBtnDisabled: {
    opacity: 0.7,
  },
  generateBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800" as const,
  },
  reportCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 24,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  reportTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  reportDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "600" as const,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    minWidth: "20%",
    alignItems: "center",
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    fontWeight: "600" as const,
    marginTop: 2,
  },
  reportActions: {
    flexDirection: "row",
    gap: 10,
  },
  reportActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  reportActionPrimary: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  reportActionText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  integrationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 10,
  },
  integrationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  integrationContent: {
    flex: 1,
    marginLeft: 12,
  },
  integrationTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  integrationDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: Colors.light.background,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statusBadgeConnected: {
    backgroundColor: Colors.light.successLight,
    borderColor: Colors.light.successLight,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.light.textSecondary,
  },
  statusBadgeTextConnected: {
    color: Colors.light.success,
  },
  disclaimerCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginTop: 14,
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  disclaimerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
});
