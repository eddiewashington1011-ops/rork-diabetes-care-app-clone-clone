import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, Flame, Wheat, Lightbulb } from "lucide-react-native";
import Colors from "@/constants/colors";
import { BottomCTA } from "@/components/BottomCTA";
import { weeklyMealPlan, mealTips, DayMealPlan, MealItem } from "@/mocks/mealPlans";

function MealRow({ meal, label, time }: { meal: MealItem; label: string; time: string }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.mealRow}
      onPress={() => {
        if (meal.recipeId) {
          router.push(`/(tabs)/recipes/${meal.recipeId}`);
        }
      }}
      activeOpacity={meal.recipeId ? 0.7 : 1}
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
  );
}

function DayCard({ dayPlan, isExpanded, onToggle }: { dayPlan: DayMealPlan; isExpanded: boolean; onToggle: () => void }) {
  const isToday = dayPlan.dayName === "Tuesday";

  return (
    <View style={[styles.dayCard, isToday && styles.dayCardToday]}>
      <TouchableOpacity style={styles.dayHeader} onPress={onToggle}>
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
          <MealRow meal={dayPlan.breakfast} label="Breakfast" time="7:30 AM" />
          <MealRow meal={dayPlan.morningSnack} label="Snack" time="10:00 AM" />
          <MealRow meal={dayPlan.lunch} label="Lunch" time="12:30 PM" />
          <MealRow meal={dayPlan.afternoonSnack} label="Snack" time="3:30 PM" />
          <MealRow meal={dayPlan.dinner} label="Dinner" time="6:30 PM" />
        </View>
      )}
    </View>
  );
}

export default function MealPlanScreen() {
  const router = useRouter();
  const [expandedDay, setExpandedDay] = useState<string>("Tuesday");

  const onBrowse = useCallback(() => {
    console.log("[meal-plan] bottom cta pressed");
    router.push("/(tabs)/recipes");
  }, [router]);

  return (
    <View style={styles.screen} testID="meal-plan-screen">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} testID="meal-plan-scroll">
      <View style={styles.tipCard}>
        <View style={styles.tipHeader}>
          <Lightbulb size={18} color={Colors.light.accent} />
          <Text style={styles.tipTitle}>Daily Tip</Text>
        </View>
        <Text style={styles.tipText}>
          {mealTips[Math.floor(Math.random() * mealTips.length)]}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>This Week&apos;s Plan</Text>

      <View style={styles.weekContainer}>
        {weeklyMealPlan.map((dayPlan) => (
          <DayCard
            key={dayPlan.dayName}
            dayPlan={dayPlan}
            isExpanded={expandedDay === dayPlan.dayName}
            onToggle={() =>
              setExpandedDay(expandedDay === dayPlan.dayName ? "" : dayPlan.dayName)
            }
          />
        ))}
      </View>

      <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomCTA
        title="Browse cookbook"
        subtitle="Swap meals with diabetes-friendly picks"
        onPress={onBrowse}
        testID="meal-plan-bottom-cta"
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
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
  bottomSpacer: {
    height: 140,
  },
});
