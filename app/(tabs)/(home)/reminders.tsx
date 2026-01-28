import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Bell, Plus, Trash2, CheckCircle2, ShieldAlert } from "lucide-react-native";

import Colors from "@/constants/colors";
import { ReminderType, useEngagement } from "@/providers/engagement";

const PRESETS: { type: ReminderType; title: string }[] = [
  { type: "glucose", title: "Check glucose" },
  { type: "meds", title: "Take meds" },
  { type: "hydrate", title: "Drink water" },
  { type: "walk", title: "Go for a walk" },
  { type: "custom", title: "Custom" },
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function clampTime(text: string): string {
  const parts = text.split(":");
  const h = Number(parts[0] ?? 0);
  const m = Number(parts[1] ?? 0);
  const hh = Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 9;
  const mm = Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0;
  return `${pad2(hh)}:${pad2(mm)}`;
}

export default function RemindersScreen() {
  const {
    reminders,
    upsertReminder,
    toggleReminder,
    removeReminder,
    requestNotificationsPermission,
    notificationsStatus,
  } = useEngagement();

  const [preset, setPreset] = useState<ReminderType>("glucose");
  const [title, setTitle] = useState<string>("Check glucose");
  const [time, setTime] = useState<string>("09:00");
  const [enabled, setEnabled] = useState<boolean>(true);

  const canSchedule = Platform.OS !== "web";

  const sorted = useMemo(() => {
    return [...reminders].sort((a, b) => a.time.localeCompare(b.time));
  }, [reminders]);

  const onAdd = useCallback(async () => {
    const finalTitle = title.trim();
    if (!finalTitle) {
      Alert.alert("Missing title", "Please enter a reminder title.");
      return;
    }

    const finalTime = clampTime(time);
    console.log("[reminders] add", { preset, finalTitle, finalTime, enabled });

    if (enabled && canSchedule && notificationsStatus !== "granted") {
      const granted = await requestNotificationsPermission();
      if (!granted) {
        Alert.alert(
          "Notifications off",
          "Enable notifications in system settings to receive reminders. You can still keep reminders listed in-app.",
        );
      }
    }

    await upsertReminder({ title: finalTitle, type: preset, time: finalTime, enabled });

    setTime(finalTime);
    setTitle(PRESETS.find((p) => p.type === preset)?.title ?? "Reminder");
  }, [canSchedule, enabled, notificationsStatus, preset, requestNotificationsPermission, time, title, upsertReminder]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="reminders-screen">
      <LinearGradient
        colors={[Colors.light.tint, "#0F766E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTitleRow}>
          <Bell size={18} color="#fff" />
          <Text style={styles.heroTitle}>Reminders</Text>
        </View>

        <View style={styles.heroNoteRow}>
          {canSchedule ? (
            notificationsStatus === "granted" ? (
              <View style={styles.heroNotePill}>
                <CheckCircle2 size={14} color="#fff" />
                <Text style={styles.heroNoteText}>Notifications enabled</Text>
              </View>
            ) : (
              <View style={[styles.heroNotePill, { backgroundColor: "rgba(255,255,255,0.16)" }]}>
                <ShieldAlert size={14} color="#fff" />
                <Text style={styles.heroNoteText}>Notifications not granted</Text>
              </View>
            )
          ) : (
            <View style={[styles.heroNotePill, { backgroundColor: "rgba(255,255,255,0.16)" }]}>
              <Text style={styles.heroNoteText}>Web: reminders stay in-app</Text>
            </View>
          )}
        </View>

        <Text style={styles.heroSubtitle}>Set a gentle routine. Tap a reminder to toggle it on/off.</Text>
      </LinearGradient>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Add reminder</Text>

        <View style={styles.presetRow}>
          {PRESETS.map((p) => {
            const active = p.type === preset;
            return (
              <TouchableOpacity
                key={p.type}
                onPress={() => {
                  setPreset(p.type);
                  setTitle(p.title);
                }}
                activeOpacity={0.85}
                style={[styles.presetChip, active && styles.presetChipActive]}
                testID={`reminder-preset-${p.type}`}
              >
                <Text style={[styles.presetText, active && styles.presetTextActive]}>{p.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.twoColRow}>
          <View style={styles.col}>
            <Text style={styles.inputLabel}>Time (HH:MM)</Text>
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="09:00"
              placeholderTextColor={Colors.light.textSecondary}
              style={styles.input}
              testID="reminder-time"
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.inputLabel}>Enabled</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{enabled ? "On" : "Off"}</Text>
              <Switch value={enabled} onValueChange={setEnabled} testID="reminder-enabled" />
            </View>
          </View>
        </View>

        <Text style={styles.inputLabel}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Check glucose"
          placeholderTextColor={Colors.light.textSecondary}
          style={styles.input}
          testID="reminder-title"
        />

        <TouchableOpacity onPress={onAdd} style={styles.primaryButton} activeOpacity={0.9} testID="reminder-add">
          <Plus size={16} color="#fff" />
          <Text style={styles.primaryButtonText}>Add reminder</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Your reminders</Text>
        <Text style={styles.sectionMeta}>{sorted.length}</Text>
      </View>

      {sorted.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nothing scheduled</Text>
          <Text style={styles.emptySub}>Add a reminder above to build a daily rhythm.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {sorted.map((r) => (
            <View key={r.id} style={styles.item} testID={`reminder-item-${r.id}`}>
              <TouchableOpacity
                style={styles.itemMain}
                activeOpacity={0.9}
                onPress={() => toggleReminder(r.id, !r.enabled)}
                testID={`reminder-toggle-${r.id}`}
              >
                <View style={styles.timeBadge}>
                  <Text style={styles.timeText}>{r.time}</Text>
                </View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {r.title}
                  </Text>
                  <Text style={styles.itemSub}>{r.enabled ? "Enabled" : "Paused"}</Text>
                </View>
                <Switch value={r.enabled} onValueChange={(v) => toggleReminder(r.id, v)} testID={`reminder-switch-${r.id}`} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => removeReminder(r.id)}
                style={styles.trash}
                activeOpacity={0.85}
                testID={`reminder-delete-${r.id}`}
              >
                <Trash2 size={16} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

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
  heroNoteRow: {
    marginTop: 10,
    marginBottom: 10,
  },
  heroNotePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroNoteText: {
    color: "rgba(255,255,255,0.95)",
    fontWeight: "800" as const,
    fontSize: 12,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600" as const,
  },
  formCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900" as const,
    color: Colors.light.text,
    marginBottom: 10,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: "800" as const,
    color: Colors.light.textSecondary,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  presetChip: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  presetChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  presetText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "900" as const,
  },
  presetTextActive: {
    color: "#fff",
  },
  twoColRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  col: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "800" as const,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "800" as const,
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 10,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "900" as const,
    color: Colors.light.text,
  },
  primaryButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900" as const,
  },
  listHeader: {
    marginTop: 6,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  emptyCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "900" as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.textSecondary,
    fontWeight: "600" as const,
  },
  list: {
    gap: 10,
  },
  item: {
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
  },
  itemMain: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timeBadge: {
    backgroundColor: Colors.light.tintLight,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 64,
    alignItems: "center",
  },
  timeText: {
    fontWeight: "900" as const,
    color: Colors.light.tint,
    fontSize: 13,
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "900" as const,
    color: Colors.light.text,
  },
  itemSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.textSecondary,
  },
  trash: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    alignSelf: "flex-end",
  },
  bottomSpacer: {
    height: 12,
  },
});
