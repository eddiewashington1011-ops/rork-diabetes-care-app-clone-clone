import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, Flame, Wheat, Lightbulb, Pencil, RefreshCw, RotateCcw, X, Wand2, CheckCircle2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import { BottomCTA } from "@/components/BottomCTA";
import { mealTips, DayMealPlan, MealItem } from "@/mocks/mealPlans";
import { useMealPlan, MealSlot } from "@/providers/mealPlan";

type MealRowProps = {
  meal: MealItem;
  label: string;
  time: string;
  onEdit: () => void;
};

function MealRow({ meal, label, time, onEdit }: MealRowProps) {
  const router = useRouter();

  const onOpenRecipe = useCallback(() => {
    if (meal.recipeId) {
      router.push(`/(tabs)/recipes/${meal.recipeId}`);
    }
  }, [meal.recipeId, router]);

  return (
    <View style={styles.mealRow}>
      <TouchableOpacity
        style={styles.mealRowMain}
        onPress={onOpenRecipe}
        activeOpacity={meal.recipeId ? 0.7 : 1}
        testID={`meal-row-open-${meal.id}`}
      >
        <View style={styles.mealTimeCol}>
          <Text style={styles.mealLabel}>{label}</Text>
          <Text style={styles.mealTime}>{time}</Text>
        </View>
        <View style={styles.mealDetails}>
          <Text style={styles.mealName}>{meal.name}</Text>
          <View style={styles.mealMeta}>
            <Text style={styles.mealMetaText}>{meal.calories} cal</Text>
            <Text style={styles.mealMetaDivider}>•</Text>
            <Text style={styles.mealMetaText}>{meal.carbs}g carbs</Text>
          </View>
        </View>
        {meal.recipeId && <ChevronRight size={18} color={Colors.light.textSecondary} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.editIconButton}
        onPress={onEdit}
        activeOpacity={0.85}
        testID={`meal-row-edit-${meal.id}`}
      >
        <Pencil size={16} color={Colors.light.text} />
      </TouchableOpacity>
    </View>
  );
}

type DayCardProps = {
  dayPlan: DayMealPlan;
  isExpanded: boolean;
  onToggle: () => void;
  onEditSlot: (slot: MealSlot) => void;
};

function DayCard({ dayPlan, isExpanded, onToggle, onEditSlot }: DayCardProps) {
  const isToday = dayPlan.dayName === "Tuesday";

  return (
    <View style={[styles.dayCard, isToday && styles.dayCardToday]}>
      <TouchableOpacity style={styles.dayHeader} onPress={onToggle} testID={`meal-plan-day-toggle-${dayPlan.dayName}`}>
        <View>
          <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
            {dayPlan.dayName}
            {isToday && " (Today)"}
          </Text>
          <View style={styles.dayStats}>
            <View style={styles.dayStat}>
              <Flame size={12} color={Colors.light.accent} />
              <Text style={styles.dayStatText}>{dayPlan.totalCalories} cal</Text>
            </View>
            <View style={styles.dayStat}>
              <Wheat size={12} color={Colors.light.success} />
              <Text style={styles.dayStatText}>{dayPlan.totalCarbs}g carbs</Text>
            </View>
          </View>
        </View>
        <View style={[styles.expandIcon, isExpanded && styles.expandIconActive]}>
          <ChevronRight
            size={18}
            color={isExpanded ? "#fff" : Colors.light.textSecondary}
            style={{ transform: [{ rotate: isExpanded ? "90deg" : "0deg" }] }}
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.mealsContainer}>
          <MealRow meal={dayPlan.breakfast} label="Breakfast" time="7:30 AM" onEdit={() => onEditSlot("breakfast")} />
          <MealRow meal={dayPlan.morningSnack} label="Snack" time="10:00 AM" onEdit={() => onEditSlot("morningSnack")} />
          <MealRow meal={dayPlan.lunch} label="Lunch" time="12:30 PM" onEdit={() => onEditSlot("lunch")} />
          <MealRow meal={dayPlan.afternoonSnack} label="Snack" time="3:30 PM" onEdit={() => onEditSlot("afternoonSnack")} />
          <MealRow meal={dayPlan.dinner} label="Dinner" time="6:30 PM" onEdit={() => onEditSlot("dinner")} />
        </View>
      )}
    </View>
  );
}

function slotLabel(slot: MealSlot): string {
  if (slot === "breakfast") return "Breakfast";
  if (slot === "morningSnack") return "Snack";
  if (slot === "lunch") return "Lunch";
  if (slot === "afternoonSnack") return "Snack";
  return "Dinner";
}

function slotTime(slot: MealSlot): string {
  if (slot === "breakfast") return "7:30 AM";
  if (slot === "morningSnack") return "10:00 AM";
  if (slot === "lunch") return "12:30 PM";
  if (slot === "afternoonSnack") return "3:30 PM";
  return "6:30 PM";
}

export default function MealPlanScreen() {
  const router = useRouter();
  const { weekPlan, isHydrating, lastError, resetToDefault, setMeal, getCandidatesForSlot, swapMealWithAgent, createPersonalPlanWithCoach } = useMealPlan();

  const [expandedDay, setExpandedDay] = useState<string>("Tuesday");

  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [editorDayName, setEditorDayName] = useState<string>("Tuesday");
  const [editorSlot, setEditorSlot] = useState<MealSlot>("breakfast");
  const [preferencesText, setPreferencesText] = useState<string>("");
  const [agentBusy, setAgentBusy] = useState<boolean>(false);

  const [coachOpen, setCoachOpen] = useState<boolean>(false);
  const [coachBusy, setCoachBusy] = useState<boolean>(false);

  const [coachGoal, setCoachGoal] = useState<string>("Blood sugar control");
  const [coachCookingSkill, setCoachCookingSkill] = useState<"easy" | "medium" | "advanced">("easy");
  const [coachCookingTimeMinutes, setCoachCookingTimeMinutes] = useState<string>("20");
  const [coachDietaryStyle, setCoachDietaryStyle] = useState<string>("");
  const [coachAllergies, setCoachAllergies] = useState<string>("");
  const [coachTargetCarbs, setCoachTargetCarbs] = useState<string>("120");
  const [coachNotes, setCoachNotes] = useState<string>("");

  const currentDay = useMemo(() => weekPlan.find((d) => d.dayName === editorDayName) ?? null, [editorDayName, weekPlan]);
  const currentMeal = useMemo(() => {
    if (!currentDay) return null;
    return currentDay[editorSlot] as MealItem;
  }, [currentDay, editorSlot]);

  const candidates = useMemo(() => getCandidatesForSlot(editorSlot), [editorSlot, getCandidatesForSlot]);

  const openEditor = useCallback(
    (dayName: string, slot: MealSlot) => {
      console.log("[meal-plan] openEditor", { dayName, slot });
      setEditorDayName(dayName);
      setEditorSlot(slot);
      setEditorOpen(true);
    },
    [],
  );

  const closeEditor = useCallback(() => {
    console.log("[meal-plan] closeEditor");
    setEditorOpen(false);
    setPreferencesText("");
    setAgentBusy(false);
  }, []);

  const onBrowse = useCallback(() => {
    console.log("[meal-plan] bottom cta pressed");
    router.push("/(tabs)/recipes");
  }, [router]);

  const openCoach = useCallback(() => {
    console.log("[meal-plan] openCoach");
    setCoachOpen(true);
  }, []);

  const closeCoach = useCallback(() => {
    console.log("[meal-plan] closeCoach");
    setCoachOpen(false);
    setCoachBusy(false);
  }, []);

  const onRunCoach = useCallback(async () => {
    console.log("[meal-plan] onRunCoach:pressed", {
      coachGoal,
      coachCookingSkill,
      coachCookingTimeMinutes,
      coachDietaryStyle,
      coachAllergies,
      coachTargetCarbs,
      hasNotes: coachNotes.trim().length > 0,
    });

    const cookingTime = Number(coachCookingTimeMinutes);
    const targetCarbs = Number(coachTargetCarbs);

    if (!Number.isFinite(cookingTime) || cookingTime <= 0 || cookingTime > 180) {
      Alert.alert("Check cooking time", "Enter a number between 1 and 180 minutes.");
      return;
    }
    if (!Number.isFinite(targetCarbs) || targetCarbs <= 0 || targetCarbs > 400) {
      Alert.alert("Check carbs target", "Enter a realistic target between 1 and 400 grams per day.");
      return;
    }

    try {
      setCoachBusy(true);
      await createPersonalPlanWithCoach({
        goal: coachGoal,
        cookingSkill: coachCookingSkill,
        cookingTimeMinutes: Math.round(cookingTime),
        dietaryStyle: coachDietaryStyle,
        dislikesOrAllergies: coachAllergies,
        targetCarbsPerDayG: Math.round(targetCarbs),
        notes: coachNotes,
      });
      closeCoach();
      Alert.alert("Plan ready", "Your personalized weekly meal plan has been created.");
    } catch {
      Alert.alert("Coach couldn’t build a plan", "Please try again in a moment.");
    } finally {
      setCoachBusy(false);
    }
  }, [coachAllergies, coachCookingSkill, coachCookingTimeMinutes, coachDietaryStyle, coachGoal, coachNotes, coachTargetCarbs, createPersonalPlanWithCoach, closeCoach]);


  const onReset = useCallback(() => {
    Alert.alert("Reset meal plan?", "This will overwrite your edits for the week.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          void resetToDefault();
        },
      },
    ]);
  }, [resetToDefault]);

  const onAgentSwap = useCallback(async () => {
    try {
      setAgentBusy(true);
      await swapMealWithAgent({ dayName: editorDayName, slot: editorSlot, preferencesText });
    } finally {
      setAgentBusy(false);
    }
  }, [editorDayName, editorSlot, preferencesText, swapMealWithAgent]);

  return (
    <View style={styles.screen} testID="meal-plan-screen">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} testID="meal-plan-scroll">
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Lightbulb size={18} color={Colors.light.accent} />
            <Text style={styles.tipTitle}>Daily Tip</Text>
          </View>
          <Text style={styles.tipText}>{mealTips[Math.floor(Math.random() * mealTips.length)]}</Text>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>This Week&apos;s Plan</Text>
          <View style={styles.sectionActions}>
            <TouchableOpacity style={[styles.sectionActionBtn, styles.sectionActionPrimary]} onPress={openCoach} activeOpacity={0.85} testID="meal-plan-open-coach">
              <Wand2 size={16} color="#fff" />
              <Text style={[styles.sectionActionText, styles.sectionActionTextPrimary]}>Interview with Dia</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sectionActionBtn} onPress={onReset} activeOpacity={0.85} testID="meal-plan-reset">
              <RotateCcw size={16} color={Colors.light.text} />
              <Text style={styles.sectionActionText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {lastError ? (
          <View style={styles.inlineError} testID="meal-plan-last-error">
            <Text style={styles.inlineErrorText}>{lastError}</Text>
          </View>
        ) : null}

        {isHydrating ? (
          <View style={styles.loadingWrap} testID="meal-plan-loading">
            <ActivityIndicator />
            <Text style={styles.loadingText}>Loading your plan…</Text>
          </View>
        ) : (
          <View style={styles.weekContainer}>
            {weekPlan.map((dayPlan) => (
              <DayCard
                key={dayPlan.dayName}
                dayPlan={dayPlan}
                isExpanded={expandedDay === dayPlan.dayName}
                onToggle={() => setExpandedDay(expandedDay === dayPlan.dayName ? "" : dayPlan.dayName)}
                onEditSlot={(slot) => openEditor(dayPlan.dayName, slot)}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomCTA
        title="Browse cookbook"
        subtitle="Edit any meal in your week, or ask the Coach to swap it"
        onPress={onBrowse}
        testID="meal-plan-bottom-cta"
      />

      <Modal visible={editorOpen} transparent animationType="slide" onRequestClose={closeEditor}>
        <View style={styles.modalBackdrop} testID="meal-plan-editor-modal">
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{editorDayName} • {slotLabel(editorSlot)}</Text>
                <Text style={styles.modalSubtitle}>{slotTime(editorSlot)} • {currentMeal?.calories ?? 0} cal • {currentMeal?.carbs ?? 0}g carbs</Text>
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={closeEditor} activeOpacity={0.85} testID="meal-plan-editor-close">
                <X size={18} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.agentBox}>
              <Text style={styles.agentTitle}>Swap with Dia</Text>
              <Text style={styles.agentHint}>Tell Dia what you want (e.g. “vegetarian”, “quick 10 min”, “higher protein”, “lower carbs”).</Text>
              <TextInput
                value={preferencesText}
                onChangeText={setPreferencesText}
                placeholder="Your preferences…"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.agentInput}
                multiline
                testID="meal-plan-preferences-input"
              />

              <TouchableOpacity
                style={[styles.agentSwapBtn, agentBusy && styles.agentSwapBtnDisabled]}
                onPress={onAgentSwap}
                activeOpacity={0.85}
                disabled={agentBusy}
                testID="meal-plan-agent-swap"
              >
                {agentBusy ? <ActivityIndicator color="#fff" /> : <RefreshCw size={16} color="#fff" />}
                <Text style={styles.agentSwapText}>{agentBusy ? "Swapping…" : "Swap meal"}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.pickerTitle}>Or pick manually</Text>
            <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false} testID="meal-plan-candidate-list">
              {candidates.map((c) => {
                const selected = currentMeal?.name === c.name;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.candidateRow, selected && styles.candidateRowSelected]}
                    onPress={() => {
                      console.log("[meal-plan] setMeal:manual", { dayName: editorDayName, slot: editorSlot, name: c.name });
                      void setMeal({ dayName: editorDayName, slot: editorSlot, meal: c });
                      closeEditor();
                    }}
                    activeOpacity={0.85}
                    testID={`meal-plan-candidate-${c.id}`}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.candidateName}>{c.name}</Text>
                      <Text style={styles.candidateMeta}>{c.calories} cal • {c.carbs}g carbs</Text>
                    </View>
                    {c.recipeId ? <ChevronRight size={18} color={Colors.light.textSecondary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={coachOpen} transparent animationType="slide" onRequestClose={closeCoach}>
        <Pressable style={styles.modalBackdrop} onPress={closeCoach} testID="meal-plan-coach-modal">
          <Pressable style={styles.coachModalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Dia</Text>
                <Text style={styles.modalSubtitle}>Answer a few questions — I’ll build your weekly plan.</Text>
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={closeCoach} activeOpacity={0.85} testID="meal-plan-coach-close">
                <X size={18} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.coachScroll} showsVerticalScrollIndicator={false} testID="meal-plan-coach-scroll">
              <Text style={styles.coachSectionTitle}>1) What’s your main goal?</Text>
              <View style={styles.choiceRow}>
                {(["Weight loss", "Blood sugar control", "Muscle gain", "Heart health"] as const).map((g) => {
                  const active = coachGoal === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.choiceChip, active && styles.choiceChipActive]}
                      onPress={() => setCoachGoal(g)}
                      activeOpacity={0.85}
                      testID={`coach-goal-${g.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.coachSectionTitle}>2) Cooking comfort level</Text>
              <View style={styles.choiceRow}>
                {(["easy", "medium", "advanced"] as const).map((lvl) => {
                  const active = coachCookingSkill === lvl;
                  return (
                    <TouchableOpacity
                      key={lvl}
                      style={[styles.choiceChip, active && styles.choiceChipActive]}
                      onPress={() => setCoachCookingSkill(lvl)}
                      activeOpacity={0.85}
                      testID={`coach-skill-${lvl}`}
                    >
                      <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>{lvl}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.coachSectionTitle}>3) Max cooking time per meal (minutes)</Text>
              <TextInput
                value={coachCookingTimeMinutes}
                onChangeText={setCoachCookingTimeMinutes}
                placeholder="20"
                keyboardType="number-pad"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.coachInput}
                testID="coach-cooking-time"
              />

              <Text style={styles.coachSectionTitle}>4) Dietary style (optional)</Text>
              <TextInput
                value={coachDietaryStyle}
                onChangeText={setCoachDietaryStyle}
                placeholder="e.g. Mediterranean, vegetarian, halal"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.coachInput}
                testID="coach-dietary-style"
              />

              <Text style={styles.coachSectionTitle}>5) Dislikes / allergies (optional)</Text>
              <TextInput
                value={coachAllergies}
                onChangeText={setCoachAllergies}
                placeholder="e.g. shellfish, peanuts, mushrooms"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.coachInput}
                testID="coach-allergies"
              />

              <Text style={styles.coachSectionTitle}>6) Target carbs per day (grams)</Text>
              <TextInput
                value={coachTargetCarbs}
                onChangeText={setCoachTargetCarbs}
                placeholder="120"
                keyboardType="number-pad"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.coachInput}
                testID="coach-target-carbs"
              />

              <Text style={styles.coachSectionTitle}>7) Anything else you want? (optional)</Text>
              <TextInput
                value={coachNotes}
                onChangeText={setCoachNotes}
                placeholder="e.g. high-protein breakfasts, no fish on weekdays"
                placeholderTextColor={Colors.light.textSecondary}
                style={[styles.coachInput, styles.coachNotesInput]}
                multiline
                testID="coach-notes"
              />

              <View style={{ height: 14 }} />
            </ScrollView>

            <TouchableOpacity
              style={[styles.coachCta, coachBusy && styles.coachCtaDisabled]}
              onPress={() => {
                console.log("[meal-plan] coach-generate-plan:onPress", { coachBusy });
                if (!coachBusy) {
                  onRunCoach();
                }
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={coachBusy}
              activeOpacity={0.85}
              accessibilityRole="button"
              testID="coach-generate-plan"
            >
              {coachBusy ? <ActivityIndicator color="#fff" /> : <CheckCircle2 size={18} color="#fff" />}
              <Text style={styles.coachCtaText}>{coachBusy ? "Building your plan…" : "Create my meal plan"}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
    padding: 20,
  },
  tipCard: {
    backgroundColor: Colors.light.accentLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.accent,
  },
  tipText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 16,
  },
  weekContainer: {
    gap: 12,
  },
  dayCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dayCardToday: {
    borderWidth: 2,
    borderColor: Colors.light.tint,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  dayName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 6,
  },
  dayNameToday: {
    color: Colors.light.tint,
  },
  dayStats: {
    flexDirection: "row",
    gap: 16,
  },
  dayStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dayStatText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },
  expandIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  expandIconActive: {
    backgroundColor: Colors.light.tint,
  },
  mealsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 2,
  },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  mealRowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  editIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    marginLeft: 8,
  },
  mealTimeCol: {
    width: 70,
  },
  mealLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.tint,
    marginBottom: 2,
  },
  mealTime: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  mealDetails: {
    flex: 1,
    paddingHorizontal: 12,
  },
  mealName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  mealMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  mealMetaText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  mealMetaDivider: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginHorizontal: 6,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionActionPrimary: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  sectionActionTextPrimary: {
    color: "#fff",
  },
  sectionActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.text,
  },
  inlineError: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.light.dangerLight,
    borderWidth: 1,
    borderColor: Colors.light.danger,
    marginBottom: 12,
  },
  inlineErrorText: {
    fontSize: 13,
    color: Colors.light.danger,
    fontWeight: "600",
  },
  loadingWrap: {
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: "600",
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
    maxHeight: "86%",
  },
  coachModalCard: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    maxHeight: "92%",
  },
  coachScroll: {
    maxHeight: 420,
  },
  coachSectionTitle: {
    fontSize: 13,
    fontWeight: "800" as const,
    color: Colors.light.text,
    marginTop: 12,
    marginBottom: 8,
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  choiceChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  choiceChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  choiceChipText: {
    fontSize: 12,
    fontWeight: "800" as const,
    color: Colors.light.text,
    textTransform: "capitalize",
  },
  choiceChipTextActive: {
    color: "#fff",
  },
  coachInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: "600" as const,
  },
  coachNotesInput: {
    minHeight: 86,
    textAlignVertical: "top" as const,
  },
  coachCta: {
    marginTop: 12,
    backgroundColor: Colors.light.sapphire,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  coachCtaDisabled: {
    opacity: 0.7,
  },
  coachCtaText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900" as const,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.light.text,
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
  },
  agentBox: {
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 14,
  },
  agentTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 6,
  },
  agentHint: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.textSecondary,
    fontWeight: "600",
    marginBottom: 10,
  },
  agentInput: {
    minHeight: 54,
    borderRadius: 14,
    padding: 12,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },
  agentSwapBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    borderRadius: 14,
  },
  agentSwapBtnDisabled: {
    opacity: 0.7,
  },
  agentSwapText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  pickerTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 10,
  },
  pickerList: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
    backgroundColor: Colors.light.surface,
  },
  candidateRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  candidateRowSelected: {
    backgroundColor: Colors.light.accentLight,
  },
  candidateName: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 4,
  },
  candidateMeta: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 140,
  },
});
