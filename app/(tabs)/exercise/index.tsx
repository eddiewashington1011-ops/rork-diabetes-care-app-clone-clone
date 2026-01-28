import React, { useCallback, useMemo, useState } from "react";
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
import { Clock, Flame, ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import { BottomCTA } from "@/components/BottomCTA";
import { exercises, exerciseCategories, Exercise } from "@/mocks/exercises";

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

  const todayWorkout = useMemo(() => exercises[0] ?? null, []);

  const onStart = useCallback(() => {
    console.log("[exercise] bottom cta pressed", { hasWorkout: Boolean(todayWorkout) });
    if (!todayWorkout) {
      Alert.alert("No workout available", "Please try again later.");
      return;
    }
    router.push(`/(tabs)/exercise/${todayWorkout.id}`);
  }, [router, todayWorkout]);

  const filteredExercises =
    activeCategory === "all"
      ? exercises
      : exercises.filter((e) => e.category === activeCategory);

  return (
    <View style={styles.container} testID="exercise-screen">
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
        title="Start today’s workout"
        subtitle={todayWorkout ? todayWorkout.title : "Pick a session"}
        onPress={onStart}
        disabled={!todayWorkout}
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
    fontWeight: "700",
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
    fontWeight: "600",
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
    fontWeight: "600",
  },
  categoryBadge: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    textTransform: "capitalize",
  },
  exerciseTitle: {
    fontSize: 15,
    fontWeight: "700",
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
    fontWeight: "500",
  },
  chevron: {
    marginLeft: "auto",
  },
});
