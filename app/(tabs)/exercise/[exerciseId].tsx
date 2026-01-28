import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Clock, Flame, AlertTriangle, Heart } from "lucide-react-native";
import Colors from "@/constants/colors";
import { exercises } from "@/mocks/exercises";

export default function ExerciseDetailScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const exercise = exercises.find((e) => e.id === exerciseId);

  if (!exercise) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Exercise not found</Text>
      </View>
    );
  }

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Image source={{ uri: exercise.image }} style={styles.heroImage} />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={[styles.intensityBadge, { backgroundColor: intensityStyle.bg }]}>
            <Text style={[styles.intensityText, { color: intensityStyle.color }]}>
              {exercise.intensity} Intensity
            </Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{exercise.category}</Text>
          </View>
        </View>

        <Text style={styles.title}>{exercise.title}</Text>
        <Text style={styles.description}>{exercise.description}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: Colors.light.tintLight }]}>
              <Clock size={20} color={Colors.light.tint} />
            </View>
            <Text style={styles.statValue}>{exercise.duration}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: Colors.light.accentLight }]}>
              <Flame size={20} color={Colors.light.accent} />
            </View>
            <Text style={styles.statValue}>{exercise.caloriesBurned}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heart size={18} color={Colors.light.tint} />
            <Text style={styles.sectionTitle}>Benefits for Diabetics</Text>
          </View>
          {exercise.benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <View style={styles.benefitBullet} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Do It</Text>
          {exercise.steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={styles.precautionsCard}>
          <View style={styles.precautionsHeader}>
            <AlertTriangle size={18} color={Colors.light.accent} />
            <Text style={styles.precautionsTitle}>Precautions</Text>
          </View>
          {exercise.precautions.map((precaution, index) => (
            <View key={index} style={styles.precautionRow}>
              <View style={styles.precautionBullet} />
              <Text style={styles.precautionText}>{precaution}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  heroImage: {
    width: "100%",
    height: 240,
  },
  content: {
    padding: 20,
    marginTop: -24,
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  intensityBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  intensityText: {
    fontSize: 13,
    fontWeight: "600",
  },
  categoryBadge: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    textTransform: "capitalize",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  benefitBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.success,
    marginTop: 6,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 14,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 22,
  },
  precautionsCard: {
    backgroundColor: Colors.light.accentLight,
    borderRadius: 16,
    padding: 16,
  },
  precautionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  precautionsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.accent,
  },
  precautionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  precautionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.accent,
    marginTop: 6,
  },
  precautionText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 19,
  },
  bottomSpacer: {
    height: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 40,
  },
});
