import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Droplets, Trash2, Clock } from "lucide-react-native";

import Colors from "@/constants/colors";
import { BottomCTA } from "@/components/BottomCTA";
import { useEngagement, GlucoseContext } from "@/providers/engagement";

const CONTEXTS: { key: GlucoseContext; label: string }[] = [
  { key: "fasting", label: "Fasting" },
  { key: "beforeMeal", label: "Before meal" },
  { key: "afterMeal", label: "After meal" },
  { key: "bedtime", label: "Bedtime" },
  { key: "other", label: "Other" },
];

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function classify(valueMgDl: number): { label: string; tone: "low" | "in" | "high" } {
  if (valueMgDl < 70) return { label: "Low", tone: "low" };
  if (valueMgDl <= 180) return { label: "In range", tone: "in" };
  return { label: "High", tone: "high" };
}

export default function GlucoseScreen() {
  const { entries, addEntry, deleteEntry } = useEngagement();

  const [valueText, setValueText] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [context, setContext] = useState<GlucoseContext>("afterMeal");

  const parsedValue = useMemo(() => {
    const v = Number(valueText);
    if (!Number.isFinite(v)) return null;
    if (v <= 0) return null;
    return Math.round(v);
  }, [valueText]);

  const onQuickAdd = useCallback(() => {
    if (!parsedValue) {
      Alert.alert("Enter a number", "Please enter a valid glucose value (mg/dL). ");
      return;
    }
    console.log("[glucose] add pressed", { parsedValue, context, noteLength: note.length });
    addEntry({ valueMgDl: parsedValue, context, note });
    setValueText("");
    setNote("");
  }, [addEntry, context, note, parsedValue]);

  const latest = entries[0] ?? null;
  const latestClass = latest ? classify(latest.valueMgDl) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="glucose-screen">
      <LinearGradient
        colors={[Colors.light.sapphire, "#0B2C44"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTopRow}>
          <View style={styles.heroTitleRow}>
            <Droplets size={18} color="#fff" />
            <Text style={styles.heroTitle}>Glucose log</Text>
          </View>
          {latest ? (
            <View style={styles.latestPill}>
              <Clock size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.latestPillText}>{formatTime(latest.createdAt)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.heroMainRow}>
          <View style={styles.latestCard}>
            <Text style={styles.latestLabel}>Latest</Text>
            <Text style={styles.latestValue}>{latest ? latest.valueMgDl : "—"}</Text>
            <Text style={styles.latestUnit}>mg/dL</Text>
          </View>
          <View style={styles.heroRight}>
            <Text style={styles.heroHint}>Quick-check summary</Text>
            <Text style={styles.heroStatus}>
              {latestClass ? latestClass.label : "Log your first reading"}
            </Text>
            <Text style={styles.heroSub}>
              {latest ? `Context: ${CONTEXTS.find((c) => c.key === latest.context)?.label ?? ""}` : ""}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Quick add</Text>

        <View style={styles.row}>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Value (mg/dL)</Text>
            <TextInput
              value={valueText}
              onChangeText={setValueText}
              keyboardType="numeric"
              placeholder="e.g. 128"
              placeholderTextColor={Colors.light.textSecondary}
              style={styles.input}
              testID="glucose-value-input"
            />
          </View>
        </View>

        <View style={styles.contextRow}>
          {CONTEXTS.map((c) => {
            const active = c.key === context;
            return (
              <TouchableOpacity
                key={c.key}
                style={[styles.contextChip, active && styles.contextChipActive]}
                onPress={() => setContext(c.key)}
                activeOpacity={0.85}
                testID={`glucose-context-${c.key}`}
              >
                <Text style={[styles.contextText, active && styles.contextTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.row}>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Note (optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="What did you eat? How do you feel?"
              placeholderTextColor={Colors.light.textSecondary}
              style={[styles.input, styles.noteInput]}
              multiline
              testID="glucose-note-input"
            />
          </View>
        </View>

      </View>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Recent</Text>
        <Text style={styles.sectionMeta}>{entries.length} entries</Text>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No readings yet</Text>
          <Text style={styles.emptySub}>Add a reading above to start building your trends.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {entries.slice(0, 30).map((e) => {
            const c = classify(e.valueMgDl);
            const toneStyle =
              c.tone === "low" ? styles.toneLow : c.tone === "high" ? styles.toneHigh : styles.toneIn;

            return (
              <View key={e.id} style={styles.item} testID={`glucose-item-${e.id}`}>
                <View style={[styles.toneBar, toneStyle]} />
                <View style={styles.itemBody}>
                  <View style={styles.itemTopRow}>
                    <Text style={styles.itemValue}>{e.valueMgDl} mg/dL</Text>
                    <Text style={styles.itemTime}>{formatTime(e.createdAt)}</Text>
                  </View>
                  <Text style={styles.itemContext}>{CONTEXTS.find((c2) => c2.key === e.context)?.label ?? e.context}</Text>
                  {e.note ? <Text style={styles.itemNote} numberOfLines={2}>{e.note}</Text> : null}
                </View>
                <TouchableOpacity
                  onPress={() => deleteEntry(e.id)}
                  style={styles.trash}
                  activeOpacity={0.85}
                  testID={`glucose-delete-${e.id}`}
                >
                  <Trash2 size={16} color={Colors.light.textSecondary} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>

    <BottomCTA title="Add reading" subtitle="Log a glucose value" onPress={onQuickAdd} testID="glucose-bottom-cta" />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 16,
    paddingBottom: 140,
  },
  hero: {
    borderRadius: 22,
    padding: 16,
    overflow: "hidden",
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800" as const,
  },
  latestPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  latestPillText: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 12,
    fontWeight: "700" as const,
  },
  heroMainRow: {
    flexDirection: "row",
    gap: 12,
  },
  latestCard: {
    width: 120,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center",
  },
  latestLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "700" as const,
  },
  latestValue: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "900" as const,
    marginTop: 4,
  },
  latestUnit: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    marginTop: -2,
    fontWeight: "700" as const,
  },
  heroRight: {
    flex: 1,
    paddingTop: 2,
  },
  heroHint: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600" as const,
  },
  heroStatus: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900" as const,
    marginTop: 2,
  },
  heroSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
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
    fontWeight: "800" as const,
    color: Colors.light.text,
    marginBottom: 10,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.textSecondary,
  },
  row: {
    marginBottom: 10,
  },
  inputWrap: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "700" as const,
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
    fontSize: 15,
    fontWeight: "700" as const,
  },
  noteInput: {
    minHeight: 78,
    textAlignVertical: "top",
  },
  contextRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  contextChip: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  contextChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  contextText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "800" as const,
  },
  contextTextActive: {
    color: "#fff",
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
    flexDirection: "row",
    alignItems: "stretch",
  },
  toneBar: {
    width: 6,
  },
  toneLow: {
    backgroundColor: Colors.light.accent,
  },
  toneIn: {
    backgroundColor: Colors.light.success,
  },
  toneHigh: {
    backgroundColor: Colors.light.danger,
  },
  itemBody: {
    flex: 1,
    padding: 12,
  },
  itemTopRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  itemValue: {
    fontSize: 15,
    fontWeight: "900" as const,
    color: Colors.light.text,
  },
  itemTime: {
    fontSize: 12,
    fontWeight: "800" as const,
    color: Colors.light.textSecondary,
  },
  itemContext: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800" as const,
    color: Colors.light.tint,
  },
  itemNote: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.textSecondary,
    fontWeight: "600" as const,
  },
  trash: {
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  bottomSpacer: {
    height: 12,
  },
});
