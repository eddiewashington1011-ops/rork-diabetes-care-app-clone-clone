import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Flame, Droplets, Footprints, GlassWater, CupSoda } from "lucide-react-native";

import Colors from "@/constants/colors";
import { HabitKey, useEngagement } from "@/providers/engagement";

type HabitDef = {
  key: HabitKey;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  light: string;
};

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function StreaksScreen() {
  const { getCurrentStreak, getTodayCheckins, setCheckin } = useEngagement();

  const todayKey = useMemo(() => dateKey(new Date()), []);
  const today = getTodayCheckins();

  const habits: HabitDef[] = useMemo(
    () => [
      {
        key: "logGlucose",
        title: "Log glucose",
        subtitle: "Any reading today counts",
        icon: <Droplets size={16} color="#fff" />,
        color: Colors.light.sapphire,
        light: Colors.light.sapphireLight,
      },
      {
        key: "move",
        title: "Move",
        subtitle: "Walk, stretch, or workout",
        icon: <Footprints size={16} color="#fff" />,
        color: Colors.light.tint,
        light: Colors.light.tintLight,
      },
      {
        key: "hydrate",
        title: "Hydrate",
        subtitle: "Aim for steady water intake",
        icon: <GlassWater size={16} color="#fff" />,
        color: Colors.light.success,
        light: Colors.light.successLight,
      },
      {
        key: "noSugaryDrink",
        title: "No sugary drink",
        subtitle: "Small win, big impact",
        icon: <CupSoda size={16} color="#fff" />,
        color: Colors.light.gold,
        light: Colors.light.goldLight,
      },
    ],
    [],
  );

  const week = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - idx));
      return {
        key: dateKey(d),
        label: d.toLocaleDateString([], { weekday: "short" }).toUpperCase(),
        day: d.getDate(),
      };
    });
  }, []);

  const onToggle = useCallback(
    (habit: HabitKey) => {
      const current = Boolean(today?.[habit]);
      console.log("[streaks] toggle", { habit, current: !current });
      setCheckin(todayKey, habit, !current);
    },
    [setCheckin, today, todayKey],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="streaks-screen">
      <LinearGradient colors={[Colors.light.slate, Colors.light.sapphire]} style={styles.hero}>
        <View style={styles.heroTitleRow}>
          <Flame size={18} color="#fff" />
          <Text style={styles.heroTitle}>Streaks</Text>
        </View>
        <Text style={styles.heroSubtitle}>Gentle goals. No guilt. Tap to check in for today.</Text>

        <View style={styles.weekRow}>
          {week.map((w) => {
            const isToday = w.key === todayKey;
            return (
              <View key={w.key} style={[styles.weekCell, isToday && styles.weekCellToday]}>
                <Text style={[styles.weekLabel, isToday && styles.weekLabelToday]}>{w.label}</Text>
                <Text style={[styles.weekDay, isToday && styles.weekDayToday]}>{w.day}</Text>
              </View>
            );
          })}
        </View>
      </LinearGradient>

      <View style={styles.grid}>
        <View style={styles.gridRow}>
          {habits.slice(0, 2).map((h) => {
            const done = Boolean(today?.[h.key]);
            const streak = getCurrentStreak(h.key);

            return (
              <TouchableOpacity
                key={h.key}
                style={[styles.habitCard, { borderColor: h.light }, done && { backgroundColor: h.light }]}
                onPress={() => onToggle(h.key)}
                activeOpacity={0.9}
                testID={`habit-${h.key}`}
              >
                <View style={[styles.habitIcon, { backgroundColor: h.color }]}>{h.icon}</View>
                <Text style={styles.habitTitle}>{h.title}</Text>
                <Text style={styles.habitSub}>{h.subtitle}</Text>
                <View style={styles.habitBottom}>
                  <View style={styles.streakInfo}>
                    <Text style={styles.streakNum}>{streak}</Text>
                    <Text style={styles.streakLabel}>day streak</Text>
                  </View>
                  <Text style={[styles.donePill, done ? styles.donePillOn : styles.donePillOff]}>
                    {done ? "Done" : "Tap"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.gridRow}>
          {[habits[3], habits[2]].map((h) => {
            const done = Boolean(today?.[h.key]);
            const streak = getCurrentStreak(h.key);

            return (
              <TouchableOpacity
                key={h.key}
                style={[styles.habitCard, { borderColor: h.light }, done && { backgroundColor: h.light }]}
                onPress={() => onToggle(h.key)}
                activeOpacity={0.9}
                testID={`habit-${h.key}`}
              >
                <View style={[styles.habitIcon, { backgroundColor: h.color }]}>{h.icon}</View>
                <Text style={styles.habitTitle}>{h.title}</Text>
                <Text style={styles.habitSub}>{h.subtitle}</Text>
                <View style={styles.habitBottom}>
                  <View style={styles.streakInfo}>
                    <Text style={styles.streakNum}>{streak}</Text>
                    <Text style={styles.streakLabel}>day streak</Text>
                  </View>
                  <Text style={[styles.donePill, done ? styles.donePillOn : styles.donePillOff]}>
                    {done ? "Done" : "Tap"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  hero: {
    borderRadius: 22,
    padding: 16,
    overflow: "hidden",
    marginBottom: 14,
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900" as const,
  },
  heroSubtitle: {
    marginTop: 8,
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600" as const,
  },
  weekRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekCell: {
    width: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 8,
    alignItems: "center",
  },
  weekCellToday: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  weekLabel: {
    fontSize: 10,
    fontWeight: "900" as const,
    color: "rgba(255,255,255,0.75)",
  },
  weekLabelToday: {
    color: "rgba(255,255,255,0.95)",
  },
  weekDay: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "900" as const,
    color: "rgba(255,255,255,0.85)",
  },
  weekDayToday: {
    color: "#fff",
  },
  grid: {
    gap: 10,
  },
  gridRow: {
    flexDirection: "row",
    gap: 10,
  },
  habitCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  habitIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  habitTitle: {
    fontSize: 14,
    fontWeight: "900" as const,
    color: Colors.light.text,
    textAlign: "center" as const,
  },
  habitSub: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    textAlign: "center" as const,
    lineHeight: 15,
  },
  habitBottom: {
    marginTop: 12,
    alignItems: "center",
    width: "100%" as const,
  },
  streakInfo: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  streakNum: {
    fontSize: 22,
    fontWeight: "900" as const,
    color: Colors.light.text,
  },
  streakLabel: {
    fontSize: 11,
    fontWeight: "800" as const,
    color: Colors.light.textSecondary,
  },
  donePill: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "900" as const,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  donePillOn: {
    color: Colors.light.success,
    backgroundColor: Colors.light.successLight,
  },
  donePillOff: {
    color: Colors.light.textSecondary,
    backgroundColor: Colors.light.background,
  },
  bottomSpacer: {
    height: 12,
  },
});
