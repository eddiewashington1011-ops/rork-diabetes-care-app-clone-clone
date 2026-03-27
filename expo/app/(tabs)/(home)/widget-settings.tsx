import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import {
  Smartphone,
  Activity,
  Target,
  TrendingUp,
  Utensils,
  Flame,
  Bell,
  RefreshCw,
  Info,
  ExternalLink,
  CheckCircle,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { AnimatedPressable, FadeIn } from "@/components/AnimatedPressable";

type WidgetConfig = {
  showCurrentGlucose: boolean;
  showTrend: boolean;
  showTimeInRange: boolean;
  showDailyCarbs: boolean;
  showCalories: boolean;
  showNextReminder: boolean;
  refreshInterval: "5min" | "15min" | "30min" | "1hr";
  compactMode: boolean;
};

const DEFAULT_CONFIG: WidgetConfig = {
  showCurrentGlucose: true,
  showTrend: true,
  showTimeInRange: true,
  showDailyCarbs: true,
  showCalories: false,
  showNextReminder: true,
  refreshInterval: "15min",
  compactMode: false,
};

const REFRESH_OPTIONS = [
  { key: "5min" as const, label: "5 minutes" },
  { key: "15min" as const, label: "15 minutes" },
  { key: "30min" as const, label: "30 minutes" },
  { key: "1hr" as const, label: "1 hour" },
];

export default function WidgetSettingsScreen() {
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = useState(false);

  const toggleSetting = useCallback((key: keyof WidgetConfig) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const setRefreshInterval = useCallback((interval: WidgetConfig["refreshInterval"]) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setConfig((prev) => ({ ...prev, refreshInterval: interval }));
  }, []);

  const onSaveSettings = useCallback(async () => {
    setIsSaving(true);
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    Alert.alert(
      "Widget Settings Saved",
      "Your home screen widget will update with your new preferences.",
      [{ text: "OK" }]
    );
    
    setIsSaving(false);
  }, []);

  const onOpenWidgetGuide = useCallback(() => {
    Alert.alert(
      "Add Widget to Home Screen",
      Platform.OS === "ios"
        ? "1. Long press on your home screen\n2. Tap the + button in the top left\n3. Search for 'Dia Care'\n4. Select your preferred widget size\n5. Tap 'Add Widget'"
        : "1. Long press on your home screen\n2. Tap 'Widgets'\n3. Search for 'Dia Care'\n4. Drag the widget to your home screen",
      [{ text: "Got it" }]
    );
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Widget Settings",
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
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Smartphone size={20} color={Colors.light.tint} />
              <Text style={styles.previewTitle}>Widget Preview</Text>
            </View>
            
            <View style={styles.widgetPreview}>
              <View style={styles.widgetMock}>
                {config.showCurrentGlucose && (
                  <View style={styles.widgetGlucose}>
                    <Text style={styles.widgetGlucoseValue}>112</Text>
                    <Text style={styles.widgetGlucoseUnit}>mg/dL</Text>
                    {config.showTrend && <Text style={styles.widgetTrend}>→</Text>}
                  </View>
                )}
                
                <View style={styles.widgetStats}>
                  {config.showTimeInRange && (
                    <View style={styles.widgetStatItem}>
                      <Target size={12} color={Colors.light.success} />
                      <Text style={styles.widgetStatText}>78% TIR</Text>
                    </View>
                  )}
                  {config.showDailyCarbs && (
                    <View style={styles.widgetStatItem}>
                      <Utensils size={12} color={Colors.light.tint} />
                      <Text style={styles.widgetStatText}>85g carbs</Text>
                    </View>
                  )}
                  {config.showCalories && (
                    <View style={styles.widgetStatItem}>
                      <Flame size={12} color={Colors.light.coral} />
                      <Text style={styles.widgetStatText}>1,420 cal</Text>
                    </View>
                  )}
                </View>
                
                {config.showNextReminder && (
                  <View style={styles.widgetReminder}>
                    <Bell size={10} color={Colors.light.textSecondary} />
                    <Text style={styles.widgetReminderText}>Next: Check glucose • 2:00 PM</Text>
                  </View>
                )}
              </View>
            </View>
            
            <TouchableOpacity style={styles.guideButton} onPress={onOpenWidgetGuide}>
              <Info size={16} color={Colors.light.tint} />
              <Text style={styles.guideButtonText}>How to add widget</Text>
              <ExternalLink size={14} color={Colors.light.tint} />
            </TouchableOpacity>
          </View>
        </FadeIn>

        <FadeIn delay={50}>
          <Text style={styles.sectionTitle}>Display Options</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: Colors.light.tintLight }]}>
                <Activity size={18} color={Colors.light.tint} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Current Glucose</Text>
                <Text style={styles.settingDesc}>Show your latest reading</Text>
              </View>
              <Switch
                value={config.showCurrentGlucose}
                onValueChange={() => toggleSetting("showCurrentGlucose")}
                trackColor={{ false: Colors.light.border, true: Colors.light.tint }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: Colors.light.sapphireLight }]}>
                <TrendingUp size={18} color={Colors.light.sapphire} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Glucose Trend</Text>
                <Text style={styles.settingDesc}>Show trend arrow</Text>
              </View>
              <Switch
                value={config.showTrend}
                onValueChange={() => toggleSetting("showTrend")}
                trackColor={{ false: Colors.light.border, true: Colors.light.tint }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: Colors.light.successLight }]}>
                <Target size={18} color={Colors.light.success} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Time in Range</Text>
                <Text style={styles.settingDesc}>Show daily TIR percentage</Text>
              </View>
              <Switch
                value={config.showTimeInRange}
                onValueChange={() => toggleSetting("showTimeInRange")}
                trackColor={{ false: Colors.light.border, true: Colors.light.tint }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: Colors.light.accentLight }]}>
                <Utensils size={18} color={Colors.light.accent} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Daily Carbs</Text>
                <Text style={styles.settingDesc}>Show carb intake</Text>
              </View>
              <Switch
                value={config.showDailyCarbs}
                onValueChange={() => toggleSetting("showDailyCarbs")}
                trackColor={{ false: Colors.light.border, true: Colors.light.tint }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: Colors.light.coralLight }]}>
                <Flame size={18} color={Colors.light.coral} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Daily Calories</Text>
                <Text style={styles.settingDesc}>Show calorie count</Text>
              </View>
              <Switch
                value={config.showCalories}
                onValueChange={() => toggleSetting("showCalories")}
                trackColor={{ false: Colors.light.border, true: Colors.light.tint }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: Colors.light.goldLight }]}>
                <Bell size={18} color={Colors.light.gold} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Next Reminder</Text>
                <Text style={styles.settingDesc}>Show upcoming reminder</Text>
              </View>
              <Switch
                value={config.showNextReminder}
                onValueChange={() => toggleSetting("showNextReminder")}
                trackColor={{ false: Colors.light.border, true: Colors.light.tint }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={100}>
          <Text style={styles.sectionTitle}>Refresh Interval</Text>
          <View style={styles.refreshGrid}>
            {REFRESH_OPTIONS.map((option) => {
              const active = config.refreshInterval === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.refreshOption, active && styles.refreshOptionActive]}
                  onPress={() => setRefreshInterval(option.key)}
                >
                  {active && <CheckCircle size={14} color="#fff" />}
                  <Text style={[styles.refreshOptionText, active && styles.refreshOptionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.refreshHint}>
            More frequent updates may affect battery life
          </Text>
        </FadeIn>

        <FadeIn delay={150}>
          <Text style={styles.sectionTitle}>Layout</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: Colors.light.slateLight }]}>
                <Smartphone size={18} color={Colors.light.slate} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Compact Mode</Text>
                <Text style={styles.settingDesc}>Smaller widget for limited space</Text>
              </View>
              <Switch
                value={config.compactMode}
                onValueChange={() => toggleSetting("compactMode")}
                trackColor={{ false: Colors.light.border, true: Colors.light.tint }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={200}>
          <AnimatedPressable
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={onSaveSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              <RefreshCw size={18} color="#fff" />
            ) : (
              <CheckCircle size={18} color="#fff" />
            )}
            <Text style={styles.saveButtonText}>
              {isSaving ? "Saving..." : "Save Widget Settings"}
            </Text>
          </AnimatedPressable>
        </FadeIn>

        <FadeIn delay={250}>
          <View style={styles.infoCard}>
            <Info size={18} color={Colors.light.sapphire} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Widget Availability</Text>
              <Text style={styles.infoText}>
                Home screen widgets are available on iOS 14+ and Android 8+. The widget displays your
                diabetes data at a glance without opening the app.
              </Text>
            </View>
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
  previewCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 24,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  widgetPreview: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  widgetMock: {
    backgroundColor: "#1c1c1e",
    borderRadius: 12,
    padding: 12,
  },
  widgetGlucose: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  widgetGlucoseValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.light.success,
  },
  widgetGlucoseUnit: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    marginLeft: 4,
  },
  widgetTrend: {
    fontSize: 24,
    color: Colors.light.success,
    marginLeft: 8,
  },
  widgetStats: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  widgetStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  widgetStatText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600" as const,
  },
  widgetReminder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  widgetReminderText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
  },
  guideButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.tintLight,
    borderRadius: 12,
    paddingVertical: 10,
  },
  guideButtonText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.tint,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  settingsCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  settingDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginLeft: 66,
  },
  refreshGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  refreshOption: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.surface,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  refreshOptionActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  refreshOptionText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  refreshOptionTextActive: {
    color: "#fff",
  },
  refreshHint: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.sapphire,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800" as const,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.sapphireLight,
    borderRadius: 14,
    padding: 14,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.sapphire,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: Colors.light.text,
    lineHeight: 18,
  },
});
