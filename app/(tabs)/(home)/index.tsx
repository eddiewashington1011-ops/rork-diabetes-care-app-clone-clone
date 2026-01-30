import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { BottomCTA } from "@/components/BottomCTA";
import {
  TrendingDown,
  TrendingUp,
  Activity,
  ChevronRight,
  Droplets,
  Heart,
  Utensils,
  Bell,
  Flame,
  Sparkles,
  AlarmClock,
  Plus,
  Bluetooth,
  BluetoothOff,
  Target,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { sugarTips, quickStats } from "@/mocks/sugarTips";
import { recipes } from "@/mocks/recipes";
import { exercises } from "@/mocks/exercises";
import { useEngagement } from "@/providers/engagement";
import { useCGM, getTrendArrow, getTrendLabel } from "@/providers/cgm";
import { GlucoseGraph } from "@/components/GlucoseGraph";

function parseTimeToHourMinute(time: string): { hour: number; minute: number } | null {
  const [hhRaw, mmRaw] = time.split(":");
  const hour = Number(hhRaw);
  const minute = Number(mmRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function computeNextOccurrence(time: string, now: Date): Date | null {
  const hm = parseTimeToHourMinute(time);
  if (!hm) return null;

  const d = new Date(now);
  d.setSeconds(0, 0);
  d.setHours(hm.hour, hm.minute, 0, 0);

  if (d.getTime() <= now.getTime()) {
    d.setDate(d.getDate() + 1);
  }

  return d;
}

function formatClockTime(d: Date): string {
  try {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function classify(valueMgDl: number): { label: string; color: string; bg: string } {
  if (valueMgDl < 70) return { label: "Low", color: Colors.light.gold, bg: Colors.light.goldLight };
  if (valueMgDl <= 180) return { label: "In range", color: Colors.light.success, bg: Colors.light.successLight };
  return { label: "High", color: Colors.light.danger, bg: Colors.light.dangerLight };
}

export default function HomeScreen() {
  const router = useRouter();
  const { getLatestGlucoseEntry, getTodayCheckins, reminders, getCurrentStreak, snoozeReminder, clearSnooze, addEntry, entries } =
    useEngagement();
  
  const {
    currentReading,
    readings: cgmReadings,
    connectionStatus,
    device,
    settings,
    getTimeInRange,
  } = useCGM();
  
  const isCGMConnected = connectionStatus === "connected";
  const hasCGMData = cgmReadings.length > 0;

  const [quickCustomText, setQuickCustomText] = useState<string>("");

  const lowerTips = sugarTips.filter((t) => t.type === "lower").slice(0, 2);
  const raiseTips = sugarTips.filter((t) => t.type === "raise").slice(0, 2);

  const todayRecipe = useMemo(() => {
    if (!recipes || recipes.length === 0) return null;
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return recipes[dayOfYear % recipes.length] ?? null;
  }, []);

  const todayExercise = useMemo(() => {
    if (!exercises || exercises.length === 0) return null;
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return exercises[dayOfYear % exercises.length] ?? null;
  }, []);

  const latest = getLatestGlucoseEntry();
  const today = getTodayCheckins();

  const activeRemindersCount = useMemo(() => reminders.filter((r) => r.enabled).length, [reminders]);
  const moveStreak = getCurrentStreak("move");
  const hydrateStreak = getCurrentStreak("hydrate");

  const todayMoveDone = Boolean(today?.move);
  const todayHydrateDone = Boolean(today?.hydrate);

  const nextReminder = useMemo(() => {
    const now = new Date();
    const candidates = reminders
      .filter((r) => r.enabled)
      .map((r) => {
        const scheduledAt = computeNextOccurrence(r.time, now);
        const snoozedUntil = r.snoozedUntilIso ? new Date(r.snoozedUntilIso) : null;
        const snoozeActive = Boolean(snoozedUntil && snoozedUntil.getTime() > now.getTime());

        const nextAt = snoozeActive && snoozedUntil ? snoozedUntil : scheduledAt;
        if (!nextAt) return null;

        return {
          id: r.id,
          title: r.title,
          time: r.time,
          nextAt,
          snoozeActive,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    candidates.sort((a, b) => a.nextAt.getTime() - b.nextAt.getTime());
    return candidates[0] ?? null;
  }, [reminders]);

  const insight = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const morningEntries = entries.filter((e) => {
      const d = new Date(e.createdAt);
      const isRecent = d.getTime() >= sevenDaysAgo.getTime();
      const h = d.getHours();
      const isMorning = h >= 5 && h <= 11;
      return isRecent && isMorning;
    });

    if (morningEntries.length < 4) {
      return {
        title: "Build your first insight",
        body: "Log a few morning readings this week — you'll start seeing patterns here.",
        tone: "neutral" as const,
      };
    }

    const values = morningEntries.map((e) => e.valueMgDl);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    const inRange = values.filter((v) => v >= 70 && v <= 180).length;
    const inRangePct = Math.round((inRange / values.length) * 100);

    if (avg > 165) {
      return {
        title: "Mornings running higher",
        body: `Avg ${Math.round(avg)} mg/dL in the morning • ${inRangePct}% in range`,
        tone: "high" as const,
      };
    }

    if (avg < 90) {
      return {
        title: "Mornings trending lower",
        body: `Avg ${Math.round(avg)} mg/dL in the morning • ${inRangePct}% in range`,
        tone: "low" as const,
      };
    }

    return {
      title: "Solid morning balance",
      body: `Avg ${Math.round(avg)} mg/dL in the morning • ${inRangePct}% in range`,
      tone: "good" as const,
    };
  }, [entries]);

  const onQuickPreset = useCallback(
    (v: number) => {
      console.log("[home] quick preset glucose", { v });
      addEntry({ valueMgDl: v, context: "other" });
    },
    [addEntry],
  );

  const onQuickCustom = useCallback(() => {
    const v = Number(quickCustomText);
    if (!Number.isFinite(v) || v <= 0) {
      Alert.alert("Enter a number", "Please enter a valid glucose value (mg/dL). ");
      return;
    }
    const rounded = Math.round(v);
    console.log("[home] quick custom glucose", { rounded });
    addEntry({ valueMgDl: rounded, context: "other" });
    setQuickCustomText("");
  }, [addEntry, quickCustomText]);

  const onLogGlucose = useCallback(() => {
    console.log("[home] bottom cta pressed");
    router.push("/(tabs)/(home)/glucose");
  }, [router]);

  return (
    <View style={styles.screen} testID="home-screen">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} testID="home-scroll">
        <LinearGradient
          colors={["#0D9488", "#0F766E"]}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroContent}>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.heroTitle}>Dia Care #2</Text>
            <Text style={styles.heroTagline}>The Diabetes Management App</Text>
            <Text style={styles.heroSubtitle}>I’m Dia — your coach & check-in buddy.</Text>
          </View>
          <View style={styles.statsRow}>
            {quickStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statSublabel}>{stat.sublabel}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.diaCard} testID="home-dia-card">
            <View style={styles.diaTopRow}>
              <View style={styles.diaAvatar}>
                <Text style={styles.diaAvatarText}>D</Text>
              </View>
              <View style={styles.diaTextCol}>
                <Text style={styles.diaTitle}>Hi, I’m Dia</Text>
                <Text style={styles.diaSub} numberOfLines={2}>
                  Tell me your goal and I’ll build a diabetes-friendly plan — meals, grocery list, and simple workouts.
                </Text>
              </View>
            </View>
            <View style={styles.diaActionsRow}>
              <TouchableOpacity
                style={[styles.diaActionBtn, styles.diaActionPrimary]}
                onPress={() => router.push("/(tabs)/meal-plan")}
                activeOpacity={0.9}
                testID="home-dia-start-meal-plan"
              >
                <Text style={styles.diaActionPrimaryText}>Start meal plan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.diaActionBtn}
                onPress={() => router.push("/(tabs)/grocery-list")}
                activeOpacity={0.9}
                testID="home-dia-open-grocery"
              >
                <Text style={styles.diaActionText}>Grocery list</Text>
              </TouchableOpacity>
            </View>
          </View>
        <View style={styles.engagementWrap}>
          <View style={styles.engagementHeader}>
            <View style={styles.engagementTitleRow}>
              <Sparkles size={18} color={Colors.light.sapphire} />
              <Text style={styles.engagementTitle}>Today</Text>
            </View>
            <TouchableOpacity
              style={styles.engagementCta}
              onPress={() => router.push("/(tabs)/(home)/streaks")}
              activeOpacity={0.9}
              testID="home-today-open-streaks"
            >
              <Text style={styles.engagementCtaText}>View</Text>
              <ChevronRight size={16} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.todayStack}>
            <TouchableOpacity
              style={styles.todayCard}
              onPress={() => router.push("/(tabs)/(home)/reminders")}
              activeOpacity={0.92}
              testID="home-today-next-reminder"
            >
              <View style={styles.todayCardTopRow}>
                <View style={styles.todayCardTitleRow}>
                  <View style={[styles.engagementIcon, { backgroundColor: Colors.light.tintLight }]}>
                    <AlarmClock size={18} color={Colors.light.tint} />
                  </View>
                  <View style={styles.todayCardTitleCol}>
                    <Text style={styles.todayCardTitle}>Next reminder</Text>
                    <Text style={styles.todayCardSub} numberOfLines={1}>
                      {nextReminder ? nextReminder.title : "No active reminders"}
                    </Text>
                  </View>
                </View>

                {nextReminder ? (
                  <View style={[styles.pill, { backgroundColor: Colors.light.background, borderColor: Colors.light.border }]}>
                    <Text style={[styles.pillText, { color: Colors.light.textSecondary }]}> {formatClockTime(nextReminder.nextAt)} </Text>
                  </View>
                ) : (
                  <View style={[styles.pill, { backgroundColor: Colors.light.background, borderColor: Colors.light.border }]}>
                    <Text style={[styles.pillText, { color: Colors.light.textSecondary }]}>Add</Text>
                  </View>
                )}
              </View>

              {nextReminder ? (
                <View style={styles.todayActionsRow}>
                  {nextReminder.snoozeActive ? (
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => void clearSnooze(nextReminder.id)}
                      activeOpacity={0.9}
                      testID="home-next-reminder-clear-snooze"
                    >
                      <Text style={styles.secondaryButtonText}>Clear snooze</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => void snoozeReminder(nextReminder.id, 30)}
                      activeOpacity={0.9}
                      testID="home-next-reminder-snooze-30"
                    >
                      <Text style={styles.secondaryButtonText}>Snooze 30m</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => router.push("/(tabs)/(home)/reminders")}
                    activeOpacity={0.9}
                    testID="home-next-reminder-manage"
                  >
                    <Text style={styles.secondaryButtonText}>Manage</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.todayActionsRow}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => router.push("/(tabs)/(home)/reminders")}
                    activeOpacity={0.9}
                    testID="home-next-reminder-create"
                  >
                    <Text style={styles.secondaryButtonText}>Create a reminder</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>

            {isCGMConnected && hasCGMData && (
              <TouchableOpacity
                style={styles.cgmWidget}
                onPress={() => router.push("/(tabs)/(home)/glucose")}
                activeOpacity={0.92}
                testID="home-cgm-widget"
              >
                <View style={styles.cgmWidgetHeader}>
                  <View style={styles.cgmWidgetTitleRow}>
                    <Bluetooth size={14} color={Colors.light.success} />
                    <Text style={styles.cgmWidgetTitle}>{device?.name ?? "CGM"}</Text>
                  </View>
                  <View style={[styles.pill, { backgroundColor: Colors.light.successLight, borderColor: Colors.light.successLight }]}>
                    <Text style={[styles.pillText, { color: Colors.light.success }]}>Live</Text>
                  </View>
                </View>
                
                <View style={styles.cgmWidgetMain}>
                  <View style={styles.cgmWidgetValue}>
                    <Text style={[
                      styles.cgmGlucoseValue,
                      currentReading && currentReading.value < settings.lowThreshold && { color: Colors.light.gold },
                      currentReading && currentReading.value > settings.highThreshold && { color: Colors.light.danger },
                    ]}>
                      {currentReading?.value ?? "—"}
                    </Text>
                    <View style={styles.cgmUnitTrend}>
                      <Text style={styles.cgmUnit}>mg/dL</Text>
                      <Text style={styles.cgmTrendArrow}>
                        {currentReading ? getTrendArrow(currentReading.trend) : ""}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cgmWidgetStats}>
                    <View style={styles.cgmStatItem}>
                      <Target size={12} color={Colors.light.success} />
                      <Text style={styles.cgmStatText}>{getTimeInRange(24).inRange}% TIR</Text>
                    </View>
                    <Text style={styles.cgmTrendLabel}>
                      {currentReading ? getTrendLabel(currentReading.trend) : ""}
                    </Text>
                  </View>
                </View>
                
                <GlucoseGraph
                  readings={cgmReadings}
                  hours={3}
                  height={80}
                  showLabels={false}
                  compact={true}
                  lowThreshold={settings.lowThreshold}
                  highThreshold={settings.highThreshold}
                />
              </TouchableOpacity>
            )}

            <View style={styles.todayRow}>
              <View style={styles.todayHalf}>
                <View style={styles.quickLogCard} testID="home-quick-log">
                  <View style={styles.quickLogTop}>
                    <View style={[styles.engagementIcon, { backgroundColor: isCGMConnected ? Colors.light.successLight : Colors.light.sapphireLight }]}>
                      {isCGMConnected ? (
                        <Bluetooth size={18} color={Colors.light.success} />
                      ) : (
                        <BluetoothOff size={18} color={Colors.light.sapphire} />
                      )}
                    </View>
                    {isCGMConnected && currentReading ? (
                      <View
                        style={[
                          styles.pill,
                          { 
                            backgroundColor: currentReading.value < settings.lowThreshold ? Colors.light.goldLight :
                              currentReading.value > settings.highThreshold ? Colors.light.dangerLight : Colors.light.successLight,
                            borderColor: currentReading.value < settings.lowThreshold ? Colors.light.goldLight :
                              currentReading.value > settings.highThreshold ? Colors.light.dangerLight : Colors.light.successLight,
                          },
                        ]}
                      >
                        <Text style={[styles.pillText, { 
                          color: currentReading.value < settings.lowThreshold ? Colors.light.gold :
                            currentReading.value > settings.highThreshold ? Colors.light.danger : Colors.light.success
                        }]}>
                          {currentReading.value < settings.lowThreshold ? "Low" :
                           currentReading.value > settings.highThreshold ? "High" : "In Range"}
                        </Text>
                      </View>
                    ) : latest ? (
                      <View
                        style={[
                          styles.pill,
                          { backgroundColor: classify(latest.valueMgDl).bg, borderColor: classify(latest.valueMgDl).bg },
                        ]}
                      >
                        <Text style={[styles.pillText, { color: classify(latest.valueMgDl).color }]}>
                          {classify(latest.valueMgDl).label}
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.pill, { backgroundColor: Colors.light.tintLight, borderColor: Colors.light.tintLight }]}>
                        <Text style={[styles.pillText, { color: Colors.light.tint }]}>New</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.engagementCardTitle}>
                    {isCGMConnected ? "CGM Monitor" : "Quick log"}
                  </Text>
                  <Text style={styles.quickLogHint}>
                    {isCGMConnected && currentReading 
                      ? `${currentReading.value} ${getTrendArrow(currentReading.trend)} • ${formatTime(currentReading.timestamp)}`
                      : latest ? `Latest ${latest.valueMgDl} • ${formatTime(latest.createdAt)}` : "Tap to connect CGM"}
                  </Text>

                  {!isCGMConnected && (
                    <View style={styles.quickPillsRow}>
                      {[80, 100, 120].map((v) => (
                        <TouchableOpacity
                          key={v}
                          style={styles.quickPill}
                          onPress={() => onQuickPreset(v)}
                          activeOpacity={0.88}
                          testID={`home-quick-log-${v}`}
                        >
                          <Text style={styles.quickPillText}>{v}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {!isCGMConnected && (
                    <View style={styles.quickCustomRow}>
                      <TextInput
                        value={quickCustomText}
                        onChangeText={setQuickCustomText}
                        keyboardType="numeric"
                        placeholder="Custom"
                        placeholderTextColor={Colors.light.textSecondary}
                        style={styles.quickCustomInput}
                        testID="home-quick-log-custom-input"
                      />
                      <TouchableOpacity
                        style={styles.quickAddBtn}
                        onPress={onQuickCustom}
                        activeOpacity={0.9}
                        testID="home-quick-log-custom-add"
                      >
                        <Plus size={14} color={Colors.light.text} />
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.linkRow}
                    onPress={() => router.push("/(tabs)/(home)/glucose")}
                    activeOpacity={0.9}
                    testID="home-quick-log-open-full"
                  >
                    <Text style={styles.linkText}>
                      {isCGMConnected ? "View glucose trends" : "Open full log"}
                    </Text>
                    <ChevronRight size={16} color={Colors.light.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.todayHalf}>
                <TouchableOpacity
                  style={styles.streakCard}
                  onPress={() => router.push("/(tabs)/(home)/streaks")}
                  activeOpacity={0.92}
                  testID="home-open-streaks"
                >
                  <View style={styles.streakRow}>
                    <View style={[styles.engagementIcon, { backgroundColor: Colors.light.goldLight }]}>
                      <Flame size={18} color={Colors.light.gold} />
                    </View>
                    <View style={styles.streakBody}>
                      <Text style={styles.engagementCardTitle}>Streaks</Text>
                      <Text style={styles.engagementCardSub} numberOfLines={2}>
                        {todayMoveDone && todayHydrateDone
                        ? "Both wins done — protect the streak"
                        : "Two tiny wins: move + hydrate"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.streakPillsRow}>
                    <View style={[styles.smallPill, { backgroundColor: Colors.light.tintLight }]}
                    >
                      <Text style={[styles.smallPillText, { color: Colors.light.tint }]}>
                        Move {todayMoveDone ? "✓" : "—"} • {moveStreak}d
                      </Text>
                    </View>
                    <View style={[styles.smallPill, { backgroundColor: Colors.light.successLight }]}
                    >
                      <Text style={[styles.smallPillText, { color: Colors.light.success }]}>
                        Hydrate {todayHydrateDone ? "✓" : "—"} • {hydrateStreak}d
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.insightCard}
              onPress={() => router.push("/(tabs)/(home)/glucose")}
              activeOpacity={0.92}
              testID="home-today-insight"
            >
              <View style={styles.insightTop}>
                <View style={[styles.engagementIcon, { backgroundColor: Colors.light.surface }]}>
                  <Sparkles size={18} color={Colors.light.sapphire} />
                </View>
                <View style={styles.insightBody}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightSub} numberOfLines={2}>
                    {insight.body}
                  </Text>
                </View>
                <ChevronRight size={18} color={Colors.light.textSecondary} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.remindersMiniCard}
              onPress={() => router.push("/(tabs)/(home)/reminders")}
              activeOpacity={0.92}
              testID="home-open-reminders"
            >
              <View style={styles.engagementCardTop}>
                <View style={[styles.engagementIcon, { backgroundColor: Colors.light.tintLight }]}>
                  <Bell size={18} color={Colors.light.tint} />
                </View>
                <View style={[styles.pill, { backgroundColor: Colors.light.background, borderColor: Colors.light.border }]}>
                  <Text style={[styles.pillText, { color: Colors.light.textSecondary }]}>
                    {activeRemindersCount} active
                  </Text>
                </View>
              </View>
              <Text style={styles.engagementCardTitle}>Reminders</Text>
              <Text style={styles.engagementCardSub}>Keep your routine on autopilot</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => router.push("/(tabs)/(home)/sugar-tips")}
        >
          <View style={styles.sectionTitleRow}>
            <Activity size={20} color={Colors.light.tint} />
            <Text style={styles.sectionTitle}>Sugar Control</Text>
          </View>
          <ChevronRight size={20} color={Colors.light.textSecondary} />
        </TouchableOpacity>

        <View style={styles.tipsContainer}>
          <View style={styles.tipColumn}>
            <View style={[styles.tipHeader, { backgroundColor: Colors.light.successLight }]}>
              <TrendingDown size={16} color={Colors.light.success} />
              <Text style={[styles.tipHeaderText, { color: Colors.light.success }]}>
                Lower Sugar
              </Text>
            </View>
            {lowerTips.map((tip) => (
              <TouchableOpacity key={tip.id} style={styles.tipCard}>
                <Text style={styles.tipIcon}>{tip.icon}</Text>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipDesc} numberOfLines={2}>
                    {tip.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.tipColumn}>
            <View style={[styles.tipHeader, { backgroundColor: Colors.light.accentLight }]}>
              <TrendingUp size={16} color={Colors.light.accent} />
              <Text style={[styles.tipHeaderText, { color: Colors.light.accent }]}>
                Raise Sugar
              </Text>
            </View>
            {raiseTips.map((tip) => (
              <TouchableOpacity key={tip.id} style={styles.tipCard}>
                <Text style={styles.tipIcon}>{tip.icon}</Text>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipDesc} numberOfLines={2}>
                    {tip.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Utensils size={20} color={Colors.light.tint} />
            <Text style={styles.sectionTitle}>Today&apos;s Recipe</Text>
          </View>
        </View>

        {todayRecipe && (
          <TouchableOpacity
            style={styles.featuredCard}
            onPress={() => router.push(`/(tabs)/recipes/${todayRecipe.id}`)}
          >
            <Image source={{ uri: todayRecipe.image }} style={styles.featuredImage} />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.8)"]}
              style={styles.featuredOverlay}
            >
              <View style={styles.featuredContent}>
                <View style={styles.featuredBadge}>
                  <Text style={styles.badgeText}>
                    {todayRecipe.carbsPerServing}g carbs
                  </Text>
                </View>
                <Text style={styles.featuredTitle}>{todayRecipe.title}</Text>
                <Text style={styles.featuredDesc}>{todayRecipe.description}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Heart size={20} color={Colors.light.tint} />
            <Text style={styles.sectionTitle}>Recommended Workout</Text>
          </View>
        </View>

        {todayExercise && (
          <TouchableOpacity
            style={styles.workoutCard}
            onPress={() => router.push(`/(tabs)/exercise/${todayExercise.id}`)}
          >
            <Image source={{ uri: todayExercise.image }} style={styles.workoutImage} />
            <View style={styles.workoutContent}>
              <Text style={styles.workoutTitle}>{todayExercise.title}</Text>
              <Text style={styles.workoutDesc} numberOfLines={2}>
                {todayExercise.description}
              </Text>
              <View style={styles.workoutMeta}>
                <View style={styles.metaItem}>
                  <Droplets size={14} color={Colors.light.tint} />
                  <Text style={styles.metaText}>{todayExercise.duration} min</Text>
                </View>
                <View
                  style={[
                    styles.intensityBadge,
                    todayExercise.intensity === "Low" && styles.intensityLow,
                    todayExercise.intensity === "Medium" && styles.intensityMedium,
                    todayExercise.intensity === "High" && styles.intensityHigh,
                  ]}
                >
                  <Text style={styles.intensityText}>{todayExercise.intensity}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacer} />
      </View>
      </ScrollView>

      <BottomCTA
        title={isCGMConnected ? "CGM Active" : "Log glucose"}
        subtitle={isCGMConnected && currentReading 
          ? `${currentReading.value} mg/dL ${getTrendArrow(currentReading.trend)} • ${device?.name}`
          : latest ? `Last: ${latest.valueMgDl} mg/dL` : "Connect CGM or add reading"}
        onPress={onLogGlucose}
        testID="home-bottom-cta"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  heroSection: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroContent: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  heroTagline: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  statSublabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  engagementWrap: {
    backgroundColor: Colors.light.surface,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 22,
  },
  diaCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 14,
  },
  diaTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  diaAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: Colors.light.sapphireLight,
    alignItems: "center",
    justifyContent: "center",
  },
  diaAvatarText: {
    fontSize: 16,
    fontWeight: "900" as const,
    color: Colors.light.sapphire,
  },
  diaTextCol: {
    flex: 1,
  },
  diaTitle: {
    fontSize: 14,
    fontWeight: "900" as const,
    color: Colors.light.text,
    marginBottom: 3,
  },
  diaSub: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  diaActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  diaActionBtn: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  diaActionPrimary: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  diaActionText: {
    fontSize: 12,
    fontWeight: "900" as const,
    color: Colors.light.text,
  },
  diaActionPrimaryText: {
    fontSize: 12,
    fontWeight: "900" as const,
    color: "#fff",
  },
  engagementHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  engagementTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  engagementTitle: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  engagementCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  engagementCtaText: {
    fontSize: 12,
    fontWeight: "800" as const,
    color: Colors.light.textSecondary,
  },
  todayStack: {
    gap: 10,
  },
  todayCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  todayCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 10,
  },
  todayCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  todayCardTitleCol: {
    flex: 1,
  },
  todayCardTitle: {
    fontSize: 13,
    fontWeight: "900" as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  todayCardSub: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
  },
  todayActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: "900" as const,
    color: Colors.light.text,
  },
  todayRow: {
    flexDirection: "row",
    gap: 10,
  },
  todayHalf: {
    flex: 1,
  },
  quickLogCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  quickLogTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  quickLogHint: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.textSecondary,
  },
  quickPillsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  quickPill: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.sapphireLight,
    borderWidth: 1,
    borderColor: Colors.light.sapphireLight,
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: "900" as const,
    color: Colors.light.sapphire,
  },
  quickCustomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  quickCustomInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  quickAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  linkRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  linkText: {
    fontSize: 12,
    fontWeight: "900" as const,
    color: Colors.light.textSecondary,
  },
  streakCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    flex: 1,
  },
  streakPillsRow: {
    flexDirection: "column",
    gap: 6,
    marginTop: 10,
  },
  smallPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  insightCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  insightTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  insightBody: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: "900" as const,
    color: Colors.light.text,
    marginBottom: 3,
  },
  insightSub: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  remindersMiniCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  engagementCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  engagementIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "900" as const,
  },
  engagementCardTitle: {
    fontSize: 13,
    fontWeight: "900" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  engagementCardValue: {
    fontSize: 15,
    fontWeight: "900" as const,
    color: Colors.light.text,
  },
  engagementCardSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  streakBody: {
    flex: 1,
  },
  streakPills: {
    alignItems: "flex-end",
    gap: 6,
  },

  smallPillText: {
    fontSize: 11,
    fontWeight: "900" as const,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  tipsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  tipColumn: {
    flex: 1,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  tipHeaderText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tipCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tipIcon: {
    fontSize: 24,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  tipDesc: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    lineHeight: 15,
  },
  featuredCard: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 28,
    height: 200,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredContent: {},
  featuredBadge: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  featuredDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
  workoutCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  workoutImage: {
    width: 110,
    height: 120,
  },
  workoutContent: {
    flex: 1,
    padding: 14,
    justifyContent: "center",
  },
  workoutTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 6,
  },
  workoutDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  workoutMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },
  intensityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  intensityLow: {
    backgroundColor: Colors.light.successLight,
  },
  intensityMedium: {
    backgroundColor: Colors.light.accentLight,
  },
  intensityHigh: {
    backgroundColor: Colors.light.dangerLight,
  },
  intensityText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.text,
  },
  bottomSpacer: {
    height: 140,
  },
  cgmWidget: {
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 10,
  },
  cgmWidgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cgmWidgetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cgmWidgetTitle: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.textSecondary,
  },
  cgmWidgetMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cgmWidgetValue: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  cgmGlucoseValue: {
    fontSize: 42,
    fontWeight: "900" as const,
    color: Colors.light.success,
    lineHeight: 46,
  },
  cgmUnitTrend: {
    paddingBottom: 6,
  },
  cgmUnit: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.light.textSecondary,
  },
  cgmTrendArrow: {
    fontSize: 16,
    fontWeight: "900" as const,
    color: Colors.light.text,
    marginTop: 2,
  },
  cgmWidgetStats: {
    alignItems: "flex-end",
  },
  cgmStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cgmStatText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.success,
  },
  cgmTrendLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
});
