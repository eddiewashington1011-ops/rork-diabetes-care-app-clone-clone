import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  Crown,
  ChevronRight,
  Activity,
  Bell,
  Shield,
  Info,
  RotateCcw,
  Calendar,
  Zap,
  Heart,
  FileText,
  Stethoscope,
  Smartphone,
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { useSubscription } from "@/providers/subscription";
import { useOnboarding } from "@/providers/onboarding";
import { useAnalytics } from "@/providers/analytics";
import { useEngagement } from "@/providers/engagement";
import { AnimatedPressable, FadeIn } from "@/components/AnimatedPressable";
import { useHealthExport } from "@/providers/healthExport";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isProUser } = useSubscription();
  const { resetOnboarding, diabetesType } = useOnboarding();
  const { getUserStats, trackEvent } = useAnalytics();
  const { notificationsStatus, requestNotificationsPermission, entries, reminders } = useEngagement();
  const { appleHealthStatus, requestAppleHealthAccess } = useHealthExport();

  const stats = useMemo(() => getUserStats(), [getUserStats]);

  const handleUpgrade = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent("settings_upgrade_tapped");
    router.push("/paywall");
  }, [router, trackEvent]);

  const handleResetOnboarding = useCallback(() => {
    Alert.alert(
      "Reset Onboarding",
      "This will reset your onboarding preferences. You'll see the welcome screens again on next launch.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            trackEvent("settings_onboarding_reset");
            await resetOnboarding();
            router.replace("/onboarding");
          },
        },
      ]
    );
  }, [resetOnboarding, router, trackEvent]);

  const handleNotificationToggle = useCallback(async () => {
    if (notificationsStatus !== "granted") {
      const granted = await requestNotificationsPermission();
      trackEvent("settings_notifications_requested", { granted });
    }
  }, [notificationsStatus, requestNotificationsPermission, trackEvent]);

  const handleHealthReports = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent("settings_health_reports_tapped");
    router.push("/(tabs)/(home)/health-reports");
  }, [router, trackEvent]);

  const handleAppleHealth = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent("settings_apple_health_tapped");
    await requestAppleHealthAccess();
  }, [requestAppleHealthAccess, trackEvent]);

  const diabetesTypeLabel = useMemo(() => {
    switch (diabetesType) {
      case "type1": return "Type 1 Diabetes";
      case "type2": return "Type 2 Diabetes";
      case "prediabetes": return "Prediabetes";
      case "gestational": return "Gestational";
      default: return "Not set";
    }
  }, [diabetesType]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!isProUser && (
          <FadeIn>
            <AnimatedPressable style={styles.premiumBanner} onPress={handleUpgrade}>
              <View style={styles.premiumIcon}>
                <Crown size={24} color="#FFD700" />
              </View>
              <View style={styles.premiumContent}>
                <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                <Text style={styles.premiumDesc}>Unlock all features & insights</Text>
              </View>
              <ChevronRight size={20} color="#fff" />
            </AnimatedPressable>
          </FadeIn>
        )}

        {isProUser && (
          <FadeIn>
            <View style={styles.proBadge}>
              <Crown size={20} color={Colors.light.accent} />
              <Text style={styles.proBadgeText}>Premium Member</Text>
            </View>
          </FadeIn>
        )}

        <FadeIn delay={50}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: Colors.light.tintLight }]}>
                  <Calendar size={18} color={Colors.light.tint} />
                </View>
                <Text style={styles.statValue}>{stats.daysActive}</Text>
                <Text style={styles.statLabel}>Days Active</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: Colors.light.successLight }]}>
                  <Activity size={18} color={Colors.light.success} />
                </View>
                <Text style={styles.statValue}>{entries.length}</Text>
                <Text style={styles.statLabel}>Readings</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: Colors.light.accentLight }]}>
                  <Zap size={18} color={Colors.light.accent} />
                </View>
                <Text style={styles.statValue}>{stats.totalSessions}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: Colors.light.sapphireLight }]}>
                  <Bell size={18} color={Colors.light.sapphire} />
                </View>
                <Text style={styles.statValue}>{reminders.filter(r => r.enabled).length}</Text>
                <Text style={styles.statLabel}>Reminders</Text>
              </View>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={100}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: Colors.light.tintLight }]}>
                  <Heart size={18} color={Colors.light.tint} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>Diabetes Type</Text>
                  <Text style={styles.rowValue}>{diabetesTypeLabel}</Text>
                </View>
              </View>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={150}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: Colors.light.accentLight }]}>
                  <Bell size={18} color={Colors.light.accent} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>Notifications</Text>
                  <Text style={styles.rowSubtitle}>
                    {notificationsStatus === "granted" ? "Enabled" : "Disabled"}
                  </Text>
                </View>
                <Switch
                  value={notificationsStatus === "granted"}
                  onValueChange={handleNotificationToggle}
                  trackColor={{ false: Colors.light.border, true: Colors.light.tint }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={200}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health & Data</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.row}
                onPress={handleHealthReports}
                activeOpacity={0.7}
              >
                <View style={[styles.rowIcon, { backgroundColor: Colors.light.tintLight }]}>
                  <FileText size={18} color={Colors.light.tint} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>Health Reports</Text>
                  <Text style={styles.rowSubtitle}>Generate & share PDF reports</Text>
                </View>
                <ChevronRight size={18} color={Colors.light.textSecondary} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.row}
                onPress={handleHealthReports}
                activeOpacity={0.7}
              >
                <View style={[styles.rowIcon, { backgroundColor: Colors.light.sapphireLight }]}>
                  <Stethoscope size={18} color={Colors.light.sapphire} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>Share with Doctor</Text>
                  <Text style={styles.rowSubtitle}>Export data for appointments</Text>
                </View>
                <ChevronRight size={18} color={Colors.light.textSecondary} />
              </TouchableOpacity>

              {Platform.OS === "ios" && (
                <>
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={styles.row}
                    onPress={handleAppleHealth}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.rowIcon, { backgroundColor: "#FF2D55" + "20" }]}>
                      <Heart size={18} color="#FF2D55" />
                    </View>
                    <View style={styles.rowContent}>
                      <Text style={styles.rowTitle}>Apple Health</Text>
                      <Text style={styles.rowSubtitle}>
                        {appleHealthStatus === "authorized" ? "Connected" : "Sync glucose & activity"}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusPill,
                      appleHealthStatus === "authorized" && styles.statusPillActive
                    ]}>
                      <Text style={[
                        styles.statusPillText,
                        appleHealthStatus === "authorized" && styles.statusPillTextActive
                      ]}>
                        {appleHealthStatus === "authorized" ? "On" : "Off"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push("/(tabs)/(home)/widget-settings")}
                activeOpacity={0.7}
              >
                <View style={[styles.rowIcon, { backgroundColor: Colors.light.successLight }]}>
                  <Smartphone size={18} color={Colors.light.success} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>Widget Settings</Text>
                  <Text style={styles.rowSubtitle}>Home screen glucose widget</Text>
                </View>
                <ChevronRight size={18} color={Colors.light.textSecondary} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push("/(tabs)/(home)/doctors")}
                activeOpacity={0.7}
              >
                <View style={[styles.rowIcon, { backgroundColor: Colors.light.coralLight }]}>
                  <Stethoscope size={18} color={Colors.light.coral} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>My Doctors</Text>
                  <Text style={styles.rowSubtitle}>Manage healthcare team</Text>
                </View>
                <ChevronRight size={18} color={Colors.light.textSecondary} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push("/(tabs)/(home)/food-log")}
                activeOpacity={0.7}
              >
                <View style={[styles.rowIcon, { backgroundColor: Colors.light.accentLight }]}>
                  <Activity size={18} color={Colors.light.accent} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>Food Log</Text>
                  <Text style={styles.rowSubtitle}>Track meals and carbs</Text>
                </View>
                <ChevronRight size={18} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={250}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.row} activeOpacity={0.7}>
                <View style={[styles.rowIcon, { backgroundColor: Colors.light.sapphireLight }]}>
                  <Shield size={18} color={Colors.light.sapphire} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>Privacy Policy</Text>
                </View>
                <ChevronRight size={18} color={Colors.light.textSecondary} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.row} activeOpacity={0.7}>
                <View style={[styles.rowIcon, { backgroundColor: Colors.light.slateLight }]}>
                  <Info size={18} color={Colors.light.slate} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>Terms of Service</Text>
                </View>
                <ChevronRight size={18} color={Colors.light.textSecondary} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.row}
                onPress={handleResetOnboarding}
                activeOpacity={0.7}
              >
                <View style={[styles.rowIcon, { backgroundColor: Colors.light.dangerLight }]}>
                  <RotateCcw size={18} color={Colors.light.danger} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>Reset Onboarding</Text>
                </View>
                <ChevronRight size={18} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={300}>
          <View style={styles.section}>
            <View style={styles.appInfo}>
              <View style={styles.appIcon}>
                <Text style={styles.appIconText}>D</Text>
              </View>
              <Text style={styles.appName}>Dia Care</Text>
              <Text style={styles.appVersion}>Version 1.0.0</Text>
              <View style={styles.madeWith}>
                <Text style={styles.madeWithText}>Made with</Text>
                <Heart size={14} color={Colors.light.danger} fill={Colors.light.danger} />
                <Text style={styles.madeWithText}>for diabetics</Text>
              </View>
            </View>
          </View>
        </FadeIn>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  premiumBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.tint,
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
  },
  premiumIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  premiumContent: {
    flex: 1,
    marginLeft: 14,
  },
  premiumTitle: {
    fontSize: 17,
    fontWeight: "800" as const,
    color: "#fff",
  },
  premiumDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.accentLight,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 24,
  },
  proBadgeText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.accent,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.textSecondary,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: {
    flex: 1,
    marginLeft: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  rowSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 13,
    color: Colors.light.tint,
    marginTop: 2,
    fontWeight: "600" as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginLeft: 66,
  },
  appInfo: {
    alignItems: "center",
    paddingVertical: 24,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  appIconText: {
    fontSize: 28,
    fontWeight: "900" as const,
    color: "#fff",
  },
  appName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  appVersion: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  madeWith: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
  },
  madeWithText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  statusPill: {
    backgroundColor: Colors.light.background,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statusPillActive: {
    backgroundColor: Colors.light.successLight,
    borderColor: Colors.light.successLight,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.light.textSecondary,
  },
  statusPillTextActive: {
    color: Colors.light.success,
  },
});
