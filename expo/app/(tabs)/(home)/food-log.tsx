import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import {
  Plus,
  Search,
  X,
  Utensils,
  Coffee,
  Moon,
  Apple,
  Flame,
  Wheat,
  Droplets,
  TrendingDown,
  TrendingUp,
  Minus,
  Heart,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { useFoodLog, FoodEntry, MacroNutrients } from "@/providers/foodLog";
import { AnimatedPressable, FadeIn } from "@/components/AnimatedPressable";

const MEAL_TYPES = [
  { key: "breakfast" as const, label: "Breakfast", icon: Coffee, color: Colors.light.gold },
  { key: "lunch" as const, label: "Lunch", icon: Utensils, color: Colors.light.tint },
  { key: "dinner" as const, label: "Dinner", icon: Moon, color: Colors.light.sapphire },
  { key: "snack" as const, label: "Snack", icon: Apple, color: Colors.light.success },
];

const COMMON_FOODS: { name: string; servingSize: string; macros: MacroNutrients }[] = [
  { name: "Apple", servingSize: "1 medium", macros: { calories: 95, carbs: 25, fiber: 4, sugar: 19, protein: 0, fat: 0, saturatedFat: 0, sodium: 2 } },
  { name: "Banana", servingSize: "1 medium", macros: { calories: 105, carbs: 27, fiber: 3, sugar: 14, protein: 1, fat: 0, saturatedFat: 0, sodium: 1 } },
  { name: "Greek Yogurt (plain)", servingSize: "1 cup", macros: { calories: 130, carbs: 8, fiber: 0, sugar: 7, protein: 22, fat: 0, saturatedFat: 0, sodium: 85 } },
  { name: "Chicken Breast (grilled)", servingSize: "4 oz", macros: { calories: 165, carbs: 0, fiber: 0, sugar: 0, protein: 31, fat: 4, saturatedFat: 1, sodium: 74 } },
  { name: "Brown Rice", servingSize: "1 cup cooked", macros: { calories: 216, carbs: 45, fiber: 4, sugar: 0, protein: 5, fat: 2, saturatedFat: 0, sodium: 10 } },
  { name: "Almonds", servingSize: "1 oz (23 nuts)", macros: { calories: 164, carbs: 6, fiber: 4, sugar: 1, protein: 6, fat: 14, saturatedFat: 1, sodium: 0 } },
  { name: "Egg (large)", servingSize: "1 egg", macros: { calories: 78, carbs: 1, fiber: 0, sugar: 0, protein: 6, fat: 5, saturatedFat: 2, sodium: 62 } },
  { name: "Salmon (baked)", servingSize: "4 oz", macros: { calories: 233, carbs: 0, fiber: 0, sugar: 0, protein: 25, fat: 14, saturatedFat: 3, sodium: 69 } },
  { name: "Spinach (raw)", servingSize: "2 cups", macros: { calories: 14, carbs: 2, fiber: 1, sugar: 0, protein: 2, fat: 0, saturatedFat: 0, sodium: 47 } },
  { name: "Oatmeal", servingSize: "1 cup cooked", macros: { calories: 158, carbs: 27, fiber: 4, sugar: 1, protein: 6, fat: 3, saturatedFat: 1, sodium: 9 } },
];

function MacroCircle({ value, goal, label, color }: { value: number; goal: number; label: string; color: string }) {
  const percent = Math.min(100, Math.round((value / goal) * 100));
  const isOver = value > goal;

  return (
    <View style={styles.macroCircle}>
      <View style={[styles.macroRing, { borderColor: color }]}>
        <Text style={[styles.macroValue, isOver && { color: Colors.light.danger }]}>
          {Math.round(value)}
        </Text>
      </View>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={[styles.macroPercent, { color }]}>{percent}%</Text>
    </View>
  );
}

function GlucoseImpactBadge({ impact }: { impact: "low" | "medium" | "high" }) {
  const config = {
    low: { color: Colors.light.success, bg: Colors.light.successLight, icon: TrendingDown, label: "Low Impact" },
    medium: { color: Colors.light.gold, bg: Colors.light.goldLight, icon: Minus, label: "Medium" },
    high: { color: Colors.light.danger, bg: Colors.light.dangerLight, icon: TrendingUp, label: "High Impact" },
  }[impact];

  const Icon = config.icon;

  return (
    <View style={[styles.impactBadge, { backgroundColor: config.bg }]}>
      <Icon size={12} color={config.color} />
      <Text style={[styles.impactText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

export default function FoodLogScreen() {
  const {
    dailyGoals,
    addEntry,
    getDailySummary,
    getGlucoseImpact,
    calculateNetCarbs,
  } = useFoodLog();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<FoodEntry["mealType"]>("breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [customFood, setCustomFood] = useState({
    name: "",
    servingSize: "1 serving",
    servings: 1,
    calories: "",
    carbs: "",
    fiber: "",
    sugar: "",
    protein: "",
    fat: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);

  const todaySummary = useMemo(() => getDailySummary(), [getDailySummary]);

  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return COMMON_FOODS;
    const needle = searchQuery.toLowerCase();
    return COMMON_FOODS.filter((f) => f.name.toLowerCase().includes(needle));
  }, [searchQuery]);

  const openAddModal = useCallback((mealType: FoodEntry["mealType"]) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedMealType(mealType);
    setAddModalOpen(true);
    setSearchQuery("");
    setShowCustomForm(false);
  }, []);

  const closeModal = useCallback(() => {
    setAddModalOpen(false);
    setSearchQuery("");
    setShowCustomForm(false);
    setCustomFood({
      name: "",
      servingSize: "1 serving",
      servings: 1,
      calories: "",
      carbs: "",
      fiber: "",
      sugar: "",
      protein: "",
      fat: "",
    });
  }, []);

  const onSelectFood = useCallback(async (food: typeof COMMON_FOODS[0]) => {
    if (isAdding) return;
    setIsAdding(true);

    try {
      await addEntry({
        name: food.name,
        servingSize: food.servingSize,
        servings: 1,
        macros: food.macros,
        mealType: selectedMealType,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      closeModal();
    } catch {
      Alert.alert("Error", "Could not add food. Please try again.");
    } finally {
      setIsAdding(false);
    }
  }, [addEntry, closeModal, isAdding, selectedMealType]);

  const onAddCustomFood = useCallback(async () => {
    if (!customFood.name.trim()) {
      Alert.alert("Missing Info", "Please enter a food name.");
      return;
    }

    const calories = Number(customFood.calories) || 0;
    const carbs = Number(customFood.carbs) || 0;
    const fiber = Number(customFood.fiber) || 0;
    const sugar = Number(customFood.sugar) || 0;
    const protein = Number(customFood.protein) || 0;
    const fat = Number(customFood.fat) || 0;

    setIsAdding(true);

    try {
      await addEntry({
        name: customFood.name.trim(),
        servingSize: customFood.servingSize,
        servings: customFood.servings,
        macros: {
          calories,
          carbs,
          fiber,
          sugar,
          protein,
          fat,
          saturatedFat: 0,
          sodium: 0,
        },
        mealType: selectedMealType,
        isCustom: true,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      closeModal();
    } catch {
      Alert.alert("Error", "Could not add food. Please try again.");
    } finally {
      setIsAdding(false);
    }
  }, [addEntry, closeModal, customFood, selectedMealType]);

  const netCarbs = calculateNetCarbs(todaySummary.totals.carbs, todaySummary.totals.fiber);
  const todayImpact = getGlucoseImpact(todaySummary.totals.carbs, todaySummary.totals.fiber);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Food Log",
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
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Today&apos;s Nutrition</Text>
              <GlucoseImpactBadge impact={todayImpact} />
            </View>

            <View style={styles.macrosRow}>
              <MacroCircle
                value={todaySummary.totals.calories}
                goal={dailyGoals.calories}
                label="Calories"
                color={Colors.light.coral}
              />
              <MacroCircle
                value={todaySummary.totals.carbs}
                goal={dailyGoals.carbs}
                label="Carbs"
                color={Colors.light.tint}
              />
              <MacroCircle
                value={todaySummary.totals.protein}
                goal={dailyGoals.protein}
                label="Protein"
                color={Colors.light.sapphire}
              />
              <MacroCircle
                value={todaySummary.totals.fat}
                goal={dailyGoals.fat}
                label="Fat"
                color={Colors.light.gold}
              />
            </View>

            <View style={styles.netCarbsRow}>
              <View style={styles.netCarbsItem}>
                <Wheat size={16} color={Colors.light.success} />
                <Text style={styles.netCarbsLabel}>Net Carbs</Text>
                <Text style={styles.netCarbsValue}>{netCarbs}g</Text>
              </View>
              <View style={styles.netCarbsDivider} />
              <View style={styles.netCarbsItem}>
                <Droplets size={16} color={Colors.light.tint} />
                <Text style={styles.netCarbsLabel}>Fiber</Text>
                <Text style={styles.netCarbsValue}>{Math.round(todaySummary.totals.fiber)}g</Text>
              </View>
              <View style={styles.netCarbsDivider} />
              <View style={styles.netCarbsItem}>
                <Heart size={16} color={Colors.light.danger} />
                <Text style={styles.netCarbsLabel}>Sugar</Text>
                <Text style={styles.netCarbsValue}>{Math.round(todaySummary.totals.sugar)}g</Text>
              </View>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={50}>
          <Text style={styles.sectionTitle}>Add Food</Text>
          <View style={styles.mealButtonsRow}>
            {MEAL_TYPES.map((meal) => {
              const Icon = meal.icon;
              const mealEntries = todaySummary.entries.filter((e) => e.mealType === meal.key);
              const mealCarbs = mealEntries.reduce((sum, e) => sum + e.macros.carbs * e.servings, 0);

              return (
                <TouchableOpacity
                  key={meal.key}
                  style={styles.mealButton}
                  onPress={() => openAddModal(meal.key)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.mealIconWrap, { backgroundColor: meal.color + "20" }]}>
                    <Icon size={20} color={meal.color} />
                  </View>
                  <Text style={styles.mealLabel}>{meal.label}</Text>
                  <Text style={styles.mealCarbs}>
                    {mealEntries.length > 0 ? `${Math.round(mealCarbs)}g carbs` : "Add food"}
                  </Text>
                  <View style={styles.mealAddIcon}>
                    <Plus size={14} color={Colors.light.textSecondary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </FadeIn>

        <FadeIn delay={100}>
          <Text style={styles.sectionTitle}>Today&apos;s Meals</Text>
          {todaySummary.entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Utensils size={32} color={Colors.light.textSecondary} />
              <Text style={styles.emptyText}>No food logged yet</Text>
              <Text style={styles.emptyHint}>Tap a meal above to start</Text>
            </View>
          ) : (
            <View style={styles.entriesList}>
              {todaySummary.entries.map((entry) => {
                const impact = getGlucoseImpact(entry.macros.carbs, entry.macros.fiber);
                const mealConfig = MEAL_TYPES.find((m) => m.key === entry.mealType);

                return (
                  <View key={entry.id} style={styles.entryCard}>
                    <View style={styles.entryTop}>
                      <View style={[styles.entryMealIcon, { backgroundColor: (mealConfig?.color ?? Colors.light.tint) + "20" }]}>
                        {mealConfig && <mealConfig.icon size={16} color={mealConfig.color} />}
                      </View>
                      <View style={styles.entryContent}>
                        <Text style={styles.entryName}>{entry.name}</Text>
                        <Text style={styles.entryServing}>
                          {entry.servings > 1 ? `${entry.servings}x ` : ""}{entry.servingSize}
                        </Text>
                      </View>
                      <GlucoseImpactBadge impact={impact} />
                    </View>
                    <View style={styles.entryMacros}>
                      <View style={styles.entryMacro}>
                        <Flame size={12} color={Colors.light.coral} />
                        <Text style={styles.entryMacroText}>{Math.round(entry.macros.calories * entry.servings)} cal</Text>
                      </View>
                      <View style={styles.entryMacro}>
                        <Wheat size={12} color={Colors.light.tint} />
                        <Text style={styles.entryMacroText}>{Math.round(entry.macros.carbs * entry.servings)}g carbs</Text>
                      </View>
                      <View style={styles.entryMacro}>
                        <Text style={styles.entryMacroText}>{Math.round(entry.macros.protein * entry.servings)}g protein</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </FadeIn>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={addModalOpen} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Add {MEAL_TYPES.find((m) => m.key === selectedMealType)?.label}</Text>
                <Text style={styles.modalSubtitle}>Search or add custom food</Text>
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={closeModal}>
                <X size={18} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <Search size={18} color={Colors.light.textSecondary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search foods..."
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.searchInput}
              />
            </View>

            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tab, !showCustomForm && styles.tabActive]}
                onPress={() => setShowCustomForm(false)}
              >
                <Text style={[styles.tabText, !showCustomForm && styles.tabTextActive]}>Common Foods</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, showCustomForm && styles.tabActive]}
                onPress={() => setShowCustomForm(true)}
              >
                <Text style={[styles.tabText, showCustomForm && styles.tabTextActive]}>Custom</Text>
              </TouchableOpacity>
            </View>

            {showCustomForm ? (
              <ScrollView style={styles.customForm} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Food Name*</Text>
                <TextInput
                  value={customFood.name}
                  onChangeText={(v) => setCustomFood((p) => ({ ...p, name: v }))}
                  placeholder="e.g. Homemade Salad"
                  placeholderTextColor={Colors.light.textSecondary}
                  style={styles.input}
                />

                <Text style={styles.inputLabel}>Serving Size</Text>
                <TextInput
                  value={customFood.servingSize}
                  onChangeText={(v) => setCustomFood((p) => ({ ...p, servingSize: v }))}
                  placeholder="e.g. 1 bowl"
                  placeholderTextColor={Colors.light.textSecondary}
                  style={styles.input}
                />

                <View style={styles.macroInputRow}>
                  <View style={styles.macroInputItem}>
                    <Text style={styles.inputLabel}>Calories</Text>
                    <TextInput
                      value={customFood.calories}
                      onChangeText={(v) => setCustomFood((p) => ({ ...p, calories: v }))}
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor={Colors.light.textSecondary}
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.macroInputItem}>
                    <Text style={styles.inputLabel}>Carbs (g)</Text>
                    <TextInput
                      value={customFood.carbs}
                      onChangeText={(v) => setCustomFood((p) => ({ ...p, carbs: v }))}
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor={Colors.light.textSecondary}
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.macroInputRow}>
                  <View style={styles.macroInputItem}>
                    <Text style={styles.inputLabel}>Fiber (g)</Text>
                    <TextInput
                      value={customFood.fiber}
                      onChangeText={(v) => setCustomFood((p) => ({ ...p, fiber: v }))}
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor={Colors.light.textSecondary}
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.macroInputItem}>
                    <Text style={styles.inputLabel}>Sugar (g)</Text>
                    <TextInput
                      value={customFood.sugar}
                      onChangeText={(v) => setCustomFood((p) => ({ ...p, sugar: v }))}
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor={Colors.light.textSecondary}
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.macroInputRow}>
                  <View style={styles.macroInputItem}>
                    <Text style={styles.inputLabel}>Protein (g)</Text>
                    <TextInput
                      value={customFood.protein}
                      onChangeText={(v) => setCustomFood((p) => ({ ...p, protein: v }))}
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor={Colors.light.textSecondary}
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.macroInputItem}>
                    <Text style={styles.inputLabel}>Fat (g)</Text>
                    <TextInput
                      value={customFood.fat}
                      onChangeText={(v) => setCustomFood((p) => ({ ...p, fat: v }))}
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor={Colors.light.textSecondary}
                      style={styles.input}
                    />
                  </View>
                </View>

                <AnimatedPressable
                  style={[styles.addButton, isAdding && styles.addButtonDisabled]}
                  onPress={onAddCustomFood}
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Plus size={18} color="#fff" />
                  )}
                  <Text style={styles.addButtonText}>{isAdding ? "Adding..." : "Add Food"}</Text>
                </AnimatedPressable>
              </ScrollView>
            ) : (
              <ScrollView style={styles.foodList} showsVerticalScrollIndicator={false}>
                {filteredFoods.map((food, idx) => {
                  const impact = getGlucoseImpact(food.macros.carbs, food.macros.fiber);

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={styles.foodItem}
                      onPress={() => onSelectFood(food)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.foodItemContent}>
                        <Text style={styles.foodItemName}>{food.name}</Text>
                        <Text style={styles.foodItemServing}>{food.servingSize}</Text>
                      </View>
                      <View style={styles.foodItemMacros}>
                        <Text style={styles.foodItemCal}>{food.macros.calories} cal</Text>
                        <Text style={styles.foodItemCarbs}>{food.macros.carbs}g carbs</Text>
                      </View>
                      <GlucoseImpactBadge impact={impact} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  summaryCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  macroCircle: {
    alignItems: "center",
  },
  macroRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    marginTop: 6,
  },
  macroPercent: {
    fontSize: 10,
    fontWeight: "700" as const,
    marginTop: 2,
  },
  netCarbsRow: {
    flexDirection: "row",
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    padding: 12,
  },
  netCarbsItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  netCarbsDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
  },
  netCarbsLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
  },
  netCarbsValue: {
    fontSize: 13,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  mealButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  mealButton: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    position: "relative",
  },
  mealIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  mealLabel: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  mealCarbs: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
  },
  mealAddIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  entriesList: {
    gap: 10,
  },
  entryCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  entryTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  entryMealIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  entryContent: {
    flex: 1,
  },
  entryName: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  entryServing: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  entryMacros: {
    flexDirection: "row",
    gap: 12,
  },
  entryMacro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  entryMacroText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
  },
  impactBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  impactText: {
    fontSize: 10,
    fontWeight: "700" as const,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.light.text,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tabActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  tabTextActive: {
    color: "#fff",
  },
  foodList: {
    maxHeight: 350,
  },
  foodItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  foodItemContent: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  foodItemServing: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  foodItemMacros: {
    alignItems: "flex-end",
  },
  foodItemCal: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  foodItemCarbs: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  customForm: {
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  macroInputRow: {
    flexDirection: "row",
    gap: 12,
  },
  macroInputItem: {
    flex: 1,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 20,
    marginBottom: 20,
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800" as const,
  },
});
