import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Clock, Flame, ChevronRight, CalendarDays, Play, Moon } from "lucide-react-native";
import Colors from "@/constants/colors";
import { BottomCTA } from "@/components/BottomCTA";
import { exercises, exerciseCategories, Exercise } from "@/mocks/exercises";
import { useWorkoutPlan } from "@/providers/workoutPlan";

function ExerciseCard({ exercise, onPress }: { exercise: Exercise; onPress: () => void }) {
  const getIntensityStyle = () => {
    switch (exercise.intensity) {
      case "Low":
        return { bg: Colors.light.successLight, color: Colors.light.success };
      case "Medium":
        return { bg: Colors.light.accentLight, color: Colors.light.accent };
      case "High":
        return { bg: Colors.light.dangerLight, color: Colors.light.danger };
    }
  };

  const intensityStyle = getIntensityStyle();

  return (
    <TouchableOpacity style={styles.exerciseCard} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: exercise.image }} style={styles.exerciseImage} />
      <View style={styles.exerciseContent}>
        <View style={styles.topRow}>
          <View style={[styles.intensityBadge, { backgroundColor: intensityStyle.bg }]}>
            <Text style={[styles.intensityText, { color: intensityStyle.color }]}>
              {exercise.intensity}
            </Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{exercise.category}</Text>
          </View>
        </View>
        <Text style={styles.exerciseTitle}>{exercise.title}</Text>
        <Text style={styles.exerciseDesc} numberOfLines={2}>
          {exercise.description}
        </Text>
        <View style={styles.exerciseMeta}>
          <View style={styles.metaItem}>
            <Clock size={14} color={Colors.light.tint} />
            <Text style={styles.metaText}>{exercise.duration} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Flame size={14} color={Colors.light.accent} />
            <Text style={styles.metaText}>{exercise.caloriesBurned} cal</Text>
          </View>
          <ChevronRight size={18} color={Colors.light.textSecondary} style={styles.chevron} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ExerciseScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("all");
  const { todayExercises, todayPlan, DAY_LABELS, getCurrentDayOfWeek, getTotalDuration, getTotalCalories } = useWorkoutPlan();

  const today = getCurrentDayOfWeek();
  const todayLabel = DAY_LABELS[today];
  const hasTodayPlan = todayExercises.length > 0;
  const isRestDay = todayPlan?.restDay ?? false;

  const onStart = useCallback(() => {
    console.log("[exercise] bottom cta pressed", { hasTodayPlan, exerciseCount: todayExercises.length });
    if (!hasTodayPlan) {
      Alert.alert("No workout planned", "Set up your workout plan first.");
      return;
    }
    router.push(`/(tabs)/exercise/${todayExercises[0].id}`);
  }, [router, hasTodayPlan, todayExercises]);

  const filteredExercises =
    activeCategory === "all"
      ? exercises
      : exercises.filter((e) => e.category === activeCategory);

  return (
    <View style={styles.container} testID="exercise-screen">
      <TouchableOpacity
        style={styles.todayPlanCard}
        onPress={() => router.push("/(tabs)/exercise/workout-plan")}
        activeOpacity={0.8}
      >
        <View style={styles.todayPlanHeader}>
          <View style={styles.todayPlanLeft}>
            <View style={styles.todayBadge}>
              <CalendarDays size={16} color="#fff" />
            </View>
            <View>
              <Text style={styles.todayPlanTitle}>{todayLabel}&apos;s Workout</Text>
              {isRestDay ? (
                <Text style={styles.todayPlanSubtitle}>Rest Day - Take it easy!</Text>
              ) : hasTodayPlan ? (
                <Text style={styles.todayPlanSubtitle}>
                  {todayExercises.length} workout{todayExercises.length > 1 ? "s" : ""} • {getTotalDuration(today)} min • {getTotalCalories(today)} cal
                </Text>
              ) : (
                <Text style={styles.todayPlanSubtitle}>No workouts planned yet</Text>
              )}
            </View>
          </View>
          <ChevronRight size={20} color="rgba(255,255,255,0.7)" />
        </View>

        {isRestDay ? (
          <View style={styles.restDayBanner}>
            <Moon size={20} color={Colors.light.tint} />
            <Text style={styles.restDayBannerText}>Enjoy your rest day</Text>
          </View>
        ) : hasTodayPlan ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.todayExercisesScroll}
            contentContainerStyle={styles.todayExercisesContainer}
          >
            {todayExercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                style={styles.todayExerciseItem}
                onPress={() => router.push(`/(tabs)/exercise/${exercise.id}`)}
              >
                <Image source={{ uri: exercise.image }} style={styles.todayExerciseImage} />
                <View style={styles.todayExerciseOverlay}>
                  <Play size={16} color="#fff" fill="#fff" />
                </View>
                <Text style={styles.todayExerciseTitle} numberOfLines={1}>{exercise.title}</Text>
                <Text style={styles.todayExerciseMeta}>{exercise.duration} min</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <TouchableOpacity
            style={styles.setupPlanButton}
            onPress={() => router.push("/(tabs)/exercise/workout-plan")}
          >
            <Text style={styles.setupPlanText}>Set Up Your Plan</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <View style={styles.headerInfo}>
        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>💡</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Exercise & Diabetes</Text>
            <Text style={styles.infoText}>
              Regular physical activity helps improve insulin sensitivity and control blood sugar levels.
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {exerciseCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              activeCategory === category.id && styles.categoryChipActive,
            ]}
            onPress={() => setActiveCategory(category.id)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text
              style={[
                styles.categoryChipText,
                activeCategory === category.id && styles.categoryChipTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.exercisesScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.exercisesContainer}
        testID="exercise-list"
      >
        {filteredExercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onPress={() => router.push(`/(tabs)/exercise/${exercise.id}`)}
          />
        ))}
      </ScrollView>

      <BottomCTA
        title={isRestDay ? "It's a rest day" : "Start today's workout"}
        subtitle={isRestDay ? "Relax and recover" : hasTodayPlan ? todayExercises[0].title : "Set up your plan"}
        onPress={isRestDay ? () => router.push("/(tabs)/exercise/workout-plan") : onStart}
        disabled={!hasTodayPlan && !isRestDay}
        testID="exercise-bottom-cta"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  todayPlanCard: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: Colors.light.tint,
    borderRadius: 18,
    padding: 16,
  },
  todayPlanHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  todayPlanLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  todayBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  todayPlanTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
  todayPlanSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  todayExercisesScroll: {
    marginTop: 14,
    marginHorizontal: -4,
  },
  todayExercisesContainer: {
    paddingHorizontal: 4,
    gap: 10,
  },
  todayExerciseItem: {
    width: 100,
  },
  todayExerciseImage: {
    width: 100,
    height: 70,
    borderRadius: 10,
  },
  todayExerciseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  todayExerciseTitle: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#fff",
    marginTop: 6,
  },
  todayExerciseMeta: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  restDayBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 10,
    paddingVertical: 14,
  },
  restDayBannerText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.tint,
  },
  setupPlanButton: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  setupPlanText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#fff",
  },
  headerInfo: {
    padding: 20,
    paddingBottom: 8,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.tintLight,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  infoEmoji: {
    fontSize: 28,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.tint,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  categoryScroll: {
    maxHeight: 52,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
    flexDirection: "row",
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
  },
  categoryChipTextActive: {
    color: "#fff",
  },
  exercisesScroll: {
    flex: 1,
  },
  exercisesContainer: {
    padding: 20,
    paddingBottom: 140,
    gap: 16,
  },
  exerciseCard: {
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
  exerciseImage: {
    width: 110,
    height: 140,
  },
  exerciseContent: {
    flex: 1,
    padding: 14,
  },
  topRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  intensityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  intensityText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  categoryBadge: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    textTransform: "capitalize",
  },
  exerciseTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  exerciseDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  exerciseMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "500" as const,
  },
  chevron: {
    marginLeft: "auto",
  },
});
