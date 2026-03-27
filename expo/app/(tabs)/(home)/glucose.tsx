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
import {
  Trash2,
  Clock,
  Activity,
  Bluetooth,
  BluetoothOff,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { BottomCTA } from "@/components/BottomCTA";
import { GlucoseGraph } from "@/components/GlucoseGraph";
import { useEngagement, GlucoseContext } from "@/providers/engagement";
import { useCGM, getTrendArrow, getTrendLabel } from "@/providers/cgm";

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

function TrendIcon({ trend }: { trend: string }) {
  const size = 20;
  const color = "#fff";
  
  switch (trend) {
    case "rising_fast":
      return <TrendingUp size={size} color={color} style={{ transform: [{ rotate: "-45deg" }] }} />;
    case "rising":
      return <TrendingUp size={size} color={color} />;
    case "falling":
      return <TrendingDown size={size} color={color} />;
    case "falling_fast":
      return <TrendingDown size={size} color={color} style={{ transform: [{ rotate: "45deg" }] }} />;
    default:
      return <Minus size={size} color={color} />;
  }
}

export default function GlucoseScreen() {
  const { entries, addEntry, deleteEntry } = useEngagement();
  const {
    currentReading,
    readings: cgmReadings,
    connectionStatus,
    device,
    settings,
    getTimeInRange,
    getAverageGlucose,
    getGMI,
    connectDevice,
    disconnectDevice,
    alerts,
    acknowledgeAlert,
  } = useCGM();

  const [valueText, setValueText] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [context, setContext] = useState<GlucoseContext>("afterMeal");
  const [selectedPeriod, setSelectedPeriod] = useState<number>(3);
  const [showManualEntry, setShowManualEntry] = useState(false);

  const parsedValue = useMemo(() => {
    const v = Number(valueText);
    if (!Number.isFinite(v)) return null;
    if (v <= 0) return null;
    return Math.round(v);
  }, [valueText]);

  const onQuickAdd = useCallback(() => {
    if (!parsedValue) {
      Alert.alert("Enter a number", "Please enter a valid glucose value (mg/dL).");
      return;
    }
    console.log("[glucose] add pressed", { parsedValue, context, noteLength: note.length });
    addEntry({ valueMgDl: parsedValue, context, note });
    setValueText("");
    setNote("");
    setShowManualEntry(false);
  }, [addEntry, context, note, parsedValue]);

  const timeInRange = getTimeInRange(24);
  const avgGlucose = getAverageGlucose(24);
  const gmi = getGMI();

  const isConnected = connectionStatus === "connected";
  const hasData = cgmReadings.length > 0;

  const glucoseColor = useMemo(() => {
    if (!currentReading) return Colors.light.tint;
    if (currentReading.value < settings.lowThreshold) return Colors.light.gold;
    if (currentReading.value > settings.highThreshold) return Colors.light.danger;
    return Colors.light.success;
  }, [currentReading, settings]);

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged).slice(0, 3);

  const onConnectCGM = useCallback(() => {
    Alert.alert(
      "Connect CGM",
      "Select your CGM device to connect. For demo purposes, you can use the simulated CGM.",
      [
        { text: "Dexcom G7", onPress: () => connectDevice("dexcom") },
        { text: "FreeStyle Libre 3", onPress: () => connectDevice("libre") },
        { text: "Demo CGM (Simulated)", onPress: () => connectDevice("simulated") },
        { text: "Cancel", style: "cancel" },
      ]
    );
  }, [connectDevice]);

  const latest = entries[0] ?? null;
  const latestClass = latest ? classify(latest.valueMgDl) : null;

  return (
    <View style={styles.screen} testID="glucose-screen">
      <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="glucose-scroll">
        <LinearGradient
          colors={isConnected ? [glucoseColor, adjustColor(glucoseColor, -30)] : [Colors.light.sapphire, "#0B2C44"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroTitleRow}>
              {isConnected ? (
                <Bluetooth size={18} color="#fff" />
              ) : (
                <BluetoothOff size={18} color="rgba(255,255,255,0.7)" />
              )}
              <Text style={styles.heroTitle}>
                {isConnected ? device?.name ?? "CGM Connected" : "CGM Monitor"}
              </Text>
            </View>
            {isConnected && currentReading ? (
              <View style={styles.latestPill}>
                <Clock size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.latestPillText}>{formatTime(currentReading.timestamp)}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.connectBtn}
                onPress={isConnected ? disconnectDevice : onConnectCGM}
                activeOpacity={0.85}
              >
                <Text style={styles.connectBtnText}>
                  {isConnected ? "Disconnect" : "Connect"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {isConnected && currentReading ? (
            <View style={styles.cgmMainDisplay}>
              <View style={styles.glucoseValueWrap}>
                <Text style={styles.glucoseValue}>{currentReading.value}</Text>
                <View style={styles.glucoseUnitCol}>
                  <Text style={styles.glucoseUnit}>mg/dL</Text>
                  <View style={styles.trendRow}>
                    <TrendIcon trend={currentReading.trend} />
                    <Text style={styles.trendText}>{getTrendArrow(currentReading.trend)}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.trendLabel}>{getTrendLabel(currentReading.trend)}</Text>
              
              <View style={styles.rangeIndicator}>
                <View style={[styles.rangeDot, { backgroundColor: glucoseColor }]} />
                <Text style={styles.rangeText}>
                  {currentReading.value < settings.lowThreshold
                    ? "Below target"
                    : currentReading.value > settings.highThreshold
                    ? "Above target"
                    : "In target range"}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.heroMainRow}>
              <View style={styles.latestCard}>
                <Text style={styles.latestLabel}>Latest</Text>
                <Text style={styles.latestValue}>{latest ? latest.valueMgDl : "—"}</Text>
                <Text style={styles.latestUnit}>mg/dL</Text>
              </View>
              <View style={styles.heroRight}>
                <Text style={styles.heroHint}>
                  {isConnected ? "Waiting for data..." : "Connect your CGM"}
                </Text>
                <Text style={styles.heroStatus}>
                  {latestClass ? latestClass.label : "No readings yet"}
                </Text>
                <TouchableOpacity
                  style={styles.connectCgmBtn}
                  onPress={onConnectCGM}
                  activeOpacity={0.85}
                >
                  <Bluetooth size={14} color="#fff" />
                  <Text style={styles.connectCgmBtnText}>Connect CGM</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>

        {unacknowledgedAlerts.length > 0 && (
          <View style={styles.alertsCard}>
            <View style={styles.alertsHeader}>
              <AlertTriangle size={16} color={Colors.light.danger} />
              <Text style={styles.alertsTitle}>Active Alerts</Text>
            </View>
            {unacknowledgedAlerts.map((alert) => (
              <TouchableOpacity
                key={alert.id}
                style={styles.alertItem}
                onPress={() => acknowledgeAlert(alert.id)}
                activeOpacity={0.85}
              >
                <View style={styles.alertContent}>
                  <Text style={styles.alertType}>
                    {alert.type === "urgent_low" ? "⚠️ Urgent Low" :
                     alert.type === "low" ? "Low Glucose" :
                     alert.type === "high" ? "High Glucose" :
                     alert.type === "rising_fast" ? "Rising Fast" :
                     alert.type === "falling_fast" ? "Falling Fast" : "Alert"}
                  </Text>
                  <Text style={styles.alertValue}>{alert.value} mg/dL</Text>
                </View>
                <CheckCircle size={20} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {hasData && (
          <View style={styles.graphCard}>
            <View style={styles.graphHeader}>
              <View style={styles.graphTitleRow}>
                <Activity size={16} color={Colors.light.tint} />
                <Text style={styles.graphTitle}>Glucose Trend</Text>
              </View>
              <View style={styles.periodSelector}>
                {[3, 6, 12, 24].map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.periodBtn, selectedPeriod === h && styles.periodBtnActive]}
                    onPress={() => setSelectedPeriod(h)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.periodBtnText, selectedPeriod === h && styles.periodBtnTextActive]}>
                      {h}h
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <GlucoseGraph
              readings={cgmReadings}
              hours={selectedPeriod}
              height={200}
              lowThreshold={settings.lowThreshold}
              highThreshold={settings.highThreshold}
            />
          </View>
        )}

        {hasData && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors.light.successLight }]}>
                <Target size={18} color={Colors.light.success} />
              </View>
              <Text style={styles.statValue}>{timeInRange.inRange}%</Text>
              <Text style={styles.statLabel}>Time in Range</Text>
              <View style={styles.tirBar}>
                <View style={[styles.tirSegment, styles.tirBelow, { flex: timeInRange.below || 1 }]} />
                <View style={[styles.tirSegment, styles.tirIn, { flex: timeInRange.inRange || 1 }]} />
                <View style={[styles.tirSegment, styles.tirAbove, { flex: timeInRange.above || 1 }]} />
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors.light.tintLight }]}>
                <Activity size={18} color={Colors.light.tint} />
              </View>
              <Text style={styles.statValue}>{avgGlucose ?? "—"}</Text>
              <Text style={styles.statLabel}>Avg Glucose (24h)</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors.light.sapphireLight }]}>
                <Zap size={18} color={Colors.light.sapphire} />
              </View>
              <Text style={styles.statValue}>{gmi ?? "—"}%</Text>
              <Text style={styles.statLabel}>GMI (est. A1C)</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors.light.accentLight }]}>
                <RefreshCw size={18} color={Colors.light.accent} />
              </View>
              <Text style={styles.statValue}>{timeInRange.readings}</Text>
              <Text style={styles.statLabel}>Readings (24h)</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.manualEntryToggle}
          onPress={() => setShowManualEntry(!showManualEntry)}
          activeOpacity={0.85}
        >
          <Text style={styles.manualEntryToggleText}>
            {showManualEntry ? "Hide Manual Entry" : "Add Manual Reading"}
          </Text>
        </TouchableOpacity>

        {showManualEntry && (
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Manual Entry</Text>

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

            <TouchableOpacity
              style={styles.addManualBtn}
              onPress={onQuickAdd}
              activeOpacity={0.85}
            >
              <Text style={styles.addManualBtnText}>Add Reading</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>History</Text>
          <Text style={styles.sectionMeta}>{entries.length} manual entries</Text>
        </View>

        {entries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No manual readings yet</Text>
            <Text style={styles.emptySub}>
              {isConnected
                ? "CGM data is being tracked automatically"
                : "Add a reading above or connect your CGM"}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {entries.slice(0, 20).map((e) => {
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
                    <Text style={styles.itemContext}>
                      {CONTEXTS.find((c2) => c2.key === e.context)?.label ?? e.context}
                    </Text>
                    {e.note ? (
                      <Text style={styles.itemNote} numberOfLines={2}>
                        {e.note}
                      </Text>
                    ) : null}
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

      <BottomCTA
        title={isConnected ? "CGM Active" : "Connect CGM"}
        subtitle={isConnected ? `${device?.name} • Real-time monitoring` : "Tap to connect your device"}
        onPress={isConnected ? () => {} : onConnectCGM}
        testID="glucose-bottom-cta"
      />
    </View>
  );
}

function adjustColor(color: string, amount: number): string {
  const hex = color.replace("#", "");
  const num = parseInt(hex, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
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
  connectBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  connectBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800" as const,
  },
  cgmMainDisplay: {
    alignItems: "center",
    paddingVertical: 10,
  },
  glucoseValueWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  glucoseValue: {
    color: "#fff",
    fontSize: 72,
    fontWeight: "900" as const,
    lineHeight: 76,
  },
  glucoseUnitCol: {
    paddingBottom: 12,
    alignItems: "flex-start",
  },
  glucoseUnit: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "700" as const,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  trendText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900" as const,
  },
  trendLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "700" as const,
    marginTop: 4,
  },
  rangeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rangeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rangeText: {
    color: "#fff",
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
  connectCgmBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  connectCgmBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800" as const,
  },
  alertsCard: {
    backgroundColor: Colors.light.dangerLight,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.light.danger,
  },
  alertsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: "800" as const,
    color: Colors.light.danger,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
  },
  alertContent: {
    flex: 1,
  },
  alertType: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  alertValue: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  graphCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 14,
  },
  graphHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  graphTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  graphTitle: {
    fontSize: 14,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  periodSelector: {
    flexDirection: "row",
    gap: 6,
  },
  periodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
  },
  periodBtnActive: {
    backgroundColor: Colors.light.tint,
  },
  periodBtnText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.light.textSecondary,
  },
  periodBtnTextActive: {
    color: "#fff",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "900" as const,
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  tirBar: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 10,
  },
  tirSegment: {
    height: "100%",
  },
  tirBelow: {
    backgroundColor: Colors.light.gold,
  },
  tirIn: {
    backgroundColor: Colors.light.success,
  },
  tirAbove: {
    backgroundColor: Colors.light.danger,
  },
  manualEntryToggle: {
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 14,
  },
  manualEntryToggleText: {
    fontSize: 13,
    fontWeight: "800" as const,
    color: Colors.light.tint,
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
  addManualBtn: {
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  addManualBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800" as const,
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
