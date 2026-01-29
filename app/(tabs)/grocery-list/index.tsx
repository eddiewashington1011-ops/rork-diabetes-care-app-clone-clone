import React, { useCallback, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
} from "react-native";
import { Check, ShoppingCart, Package, RotateCcw, ChevronDown, ListChecks } from "lucide-react-native";

import Colors from "@/constants/colors";
import { useGroceryList } from "@/providers/groceryList";

type Mode = "shop" | "have";

export default function GroceryListScreen() {
  const { sections, isHydrating, lastError, toggleHave, resetAllToShop } = useGroceryList();

  const [mode, setMode] = useState<Mode>("shop");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode);
    Animated.spring(tabIndicatorAnim, {
      toValue: newMode === "shop" ? 0 : 1,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
  }, [tabIndicatorAnim]);

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
      {/* Fixed Header with Tabs */}
      <View style={styles.fixedHeader}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconWrap}>
              <ListChecks size={20} color={Colors.light.tint} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Grocery List</Text>
              <Text style={styles.headerMeta}>
                {totals.shop} to shop • {totals.have} have
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={onReset}
            activeOpacity={0.85}
            testID="grocery-list-reset"
          >
            <RotateCcw size={16} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        </View>

        {lastError ? (
          <View style={styles.inlineError} testID="grocery-list-last-error">
            <Text style={styles.inlineErrorText}>{lastError}</Text>
          </View>
        ) : null}

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                transform: [
                  {
                    translateX: tabIndicatorAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 150],
                    }),
                  },
                ],
              },
            ]}
          />
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleModeChange("shop")}
            activeOpacity={0.85}
            testID="grocery-list-tab-shop"
          >
            <ShoppingCart
              size={18}
              color={mode === "shop" ? Colors.light.tint : Colors.light.textSecondary}
            />
            <Text style={[styles.tabText, mode === "shop" && styles.tabTextActive]}>
              Shopping List
            </Text>
            <View style={[styles.tabBadge, mode === "shop" && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, mode === "shop" && styles.tabBadgeTextActive]}>
                {totals.shop}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleModeChange("have")}
            activeOpacity={0.85}
            testID="grocery-list-tab-have"
          >
            <Package
              size={18}
              color={mode === "have" ? Colors.light.tint : Colors.light.textSecondary}
            />
            <Text style={[styles.tabText, mode === "have" && styles.tabTextActive]}>
              In Pantry
            </Text>
            <View style={[styles.tabBadge, mode === "have" && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, mode === "have" && styles.tabBadgeTextActive]}>
                {totals.have}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} />}
        testID="grocery-list-scroll"
      >

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
  fixedHeader: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.tint + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  headerMeta: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineError: {
    backgroundColor: Colors.light.dangerLight,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.danger,
  },
  inlineErrorText: {
    fontSize: 12,
    color: Colors.light.danger,
    fontWeight: "600" as const,
  },
  tabBar: {
    flexDirection: "row",
    position: "relative",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 150,
    height: 3,
    backgroundColor: Colors.light.tint,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    maxWidth: 150,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: Colors.light.tint,
    fontWeight: "700" as const,
  },
  tabBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: Colors.light.tint + "20",
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.light.textSecondary,
  },
  tabBadgeTextActive: {
    color: Colors.light.tint,
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
