import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Check, ShoppingCart, Package, RotateCcw, ChevronDown } from "lucide-react-native";

import Colors from "@/constants/colors";
import { useGroceryList } from "@/providers/groceryList";

type Mode = "shop" | "have";

function ModeChip({
  mode,
  active,
  title,
  subtitle,
  onPress,
  icon,
  testID,
}: {
  mode: Mode;
  active: boolean;
  title: string;
  subtitle: string;
  onPress: () => void;
  icon: React.ReactNode;
  testID: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.modeChip, active && styles.modeChipActive]}
      testID={testID}
    >
      <View style={[styles.modeIconWrap, active && styles.modeIconWrapActive]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.modeTitle, active && styles.modeTitleActive]}>{title}</Text>
        <Text style={[styles.modeSubtitle, active && styles.modeSubtitleActive]}>{subtitle}</Text>
      </View>
      {active ? (
        <View style={styles.modeCheck}>
          <Check size={14} color="#fff" />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export default function GroceryListScreen() {
  const { sections, isHydrating, lastError, toggleHave, resetAllToShop } = useGroceryList();

  const [mode, setMode] = useState<Mode>("shop");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const visibleSections = useMemo(() => {
    return sections
      .map((s) => {
        const filtered = s.items.filter((it) => (mode === "shop" ? it.status === "shop" : it.status === "have"));
        return { ...s, items: filtered };
      })
      .filter((s) => s.items.length > 0);
  }, [mode, sections]);

  const totals = useMemo(() => {
    const all = sections.flatMap((s) => s.items);
    const have = all.filter((i) => i.status === "have").length;
    const shop = all.filter((i) => i.status === "shop").length;
    return { have, shop, all: all.length };
  }, [sections]);

  const onReset = useCallback(() => {
    Alert.alert("Reset grocery list?", "This will move everything back to Shop.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          void resetAllToShop();
        },
      },
    ]);
  }, [resetAllToShop]);

  const onToggleSection = useCallback((id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !(prev[id] ?? false) }));
  }, []);

  const onToggleItem = useCallback(
    (key: string) => {
      void toggleHave(key);
    },
    [toggleHave],
  );

  return (
    <View style={styles.screen} testID="grocery-list-screen">
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} />}
        testID="grocery-list-scroll"
      >
        <View style={styles.headerCard} testID="grocery-list-header-card">
          <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle}>Your groceries</Text>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={onReset}
              activeOpacity={0.85}
              testID="grocery-list-reset"
            >
              <RotateCcw size={16} color={Colors.light.text} />
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.headerSubtitle}>
            Built from your current Meal Plan • {totals.shop} to shop • {totals.have} in pantry
          </Text>

          {lastError ? (
            <View style={styles.inlineError} testID="grocery-list-last-error">
              <Text style={styles.inlineErrorText}>{lastError}</Text>
            </View>
          ) : null}

          <View style={styles.modeRow}>
            <ModeChip
              mode="shop"
              active={mode === "shop"}
              title="Shop"
              subtitle="What you still need"
              onPress={() => setMode("shop")}
              icon={<ShoppingCart size={18} color={mode === "shop" ? "#fff" : Colors.light.textSecondary} />}
              testID="grocery-list-mode-shop"
            />
            <ModeChip
              mode="have"
              active={mode === "have"}
              title="Have"
              subtitle="Already at home"
              onPress={() => setMode("have")}
              icon={<Package size={18} color={mode === "have" ? "#fff" : Colors.light.textSecondary} />}
              testID="grocery-list-mode-have"
            />
          </View>
        </View>

        {isHydrating ? (
          <View style={styles.loadingWrap} testID="grocery-list-loading">
            <ActivityIndicator />
            <Text style={styles.loadingText}>Loading your grocery list…</Text>
          </View>
        ) : visibleSections.length === 0 ? (
          <View style={styles.emptyCard} testID="grocery-list-empty">
            <Text style={styles.emptyTitle}>{mode === "shop" ? "Nothing to shop" : "Nothing marked as Have"}</Text>
            <Text style={styles.emptySubtitle}>
              {mode === "shop"
                ? "Mark items as Have to clear your shopping list."
                : "Switch to Shop and check items off as you buy them."}
            </Text>
          </View>
        ) : (
          <View style={styles.sectionsWrap} testID="grocery-list-sections">
            {visibleSections.map((section) => {
              const isCollapsed = collapsed[section.id] ?? false;
              const count = section.items.length;

              return (
                <View key={section.id} style={styles.sectionCard} testID={`grocery-list-section-${section.id}`}>
                  <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => onToggleSection(section.id)}
                    activeOpacity={0.85}
                    testID={`grocery-list-section-toggle-${section.id}`}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionTitle}>{section.title}</Text>
                      <Text style={styles.sectionMeta}>{count} items</Text>
                    </View>
                    <ChevronDown
                      size={18}
                      color={Colors.light.textSecondary}
                      style={{ transform: [{ rotate: isCollapsed ? "-90deg" : "0deg" }] }}
                    />
                  </TouchableOpacity>

                  {!isCollapsed ? (
                    <View style={styles.itemsWrap}>
                      {section.items.map((it) => {
                        const checked = it.status === "have";
                        return (
                          <TouchableOpacity
                            key={it.key}
                            style={styles.itemRow}
                            onPress={() => onToggleItem(it.key)}
                            activeOpacity={0.85}
                            testID={`grocery-list-item-${it.key}`}
                          >
                            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                              {checked ? <Check size={14} color="#fff" /> : null}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.itemLabel}>{it.label}</Text>
                              <Text style={styles.itemMeta}>
                                {it.count > 1 ? `Used in ${it.count} meals` : "Used in 1 meal"}
                              </Text>
                            </View>
                            <View style={[styles.pill, checked ? styles.pillHave : styles.pillShop]}>
                              <Text style={[styles.pillText, checked ? styles.pillTextHave : styles.pillTextShop]}>
                                {checked ? "Have" : "Shop"}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 28 }} />
      </ScrollView>
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
    padding: 20,
  },
  headerCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 14,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  inlineError: {
    backgroundColor: Colors.light.dangerLight,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.danger,
  },
  inlineErrorText: {
    fontSize: 12,
    color: Colors.light.danger,
    fontWeight: "600" as const,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
  },
  modeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  modeChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  modeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modeIconWrapActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  modeTitleActive: {
    color: "#fff",
  },
  modeSubtitle: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  modeSubtitleActive: {
    color: "rgba(255,255,255,0.85)",
  },
  modeCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  loadingWrap: {
    paddingVertical: 22,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  emptyCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.textSecondary,
  },
  sectionsWrap: {
    gap: 12,
  },
  sectionCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  sectionMeta: {
    marginTop: 2,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  itemsWrap: {
    paddingVertical: 6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.light.success,
    borderColor: Colors.light.success,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  itemMeta: {
    marginTop: 2,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillShop: {
    backgroundColor: Colors.light.accentLight,
    borderColor: Colors.light.accent,
  },
  pillHave: {
    backgroundColor: Colors.light.successLight,
    borderColor: Colors.light.success,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "800" as const,
  },
  pillTextShop: {
    color: Colors.light.gold,
  },
  pillTextHave: {
    color: Colors.light.success,
  },
});
