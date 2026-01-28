import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Clock, Users, Flame, Wheat } from "lucide-react-native";
import Colors from "@/constants/colors";
import { recipes } from "@/mocks/recipes";

export default function RecipeDetailScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();

  const recipe = useMemo(() => recipes.find((r) => r.id === recipeId), [recipeId]);

  console.log("[RecipeDetail] open", { recipeId, found: Boolean(recipe) });

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Recipe not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      testID="recipe-detail"
    >
      <Image source={{ uri: recipe.image }} style={styles.heroImage} />

      <View style={styles.content}>
        <View style={styles.tagsRow} testID="recipe-tags">
          {recipe.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.title} testID="recipe-title">
          {recipe.title}
        </Text>
        <Text style={styles.description} testID="recipe-description">
          {recipe.description}
        </Text>

        {(recipe.origin || (recipe.teaPairings?.length ?? 0) > 0) && (
          <View style={styles.pairingCard} testID="recipe-pairing-card">
            {recipe.origin ? (
              <View style={styles.pairingRow}>
                <Text style={styles.pairingLabel}>Origin</Text>
                <Text style={styles.pairingValue}>{recipe.origin}</Text>
              </View>
            ) : null}

            {(recipe.teaPairings?.length ?? 0) > 0 ? (
              <View style={styles.pairingRow}>
                <Text style={styles.pairingLabel}>Tea pairing</Text>
                <Text style={styles.pairingValue} numberOfLines={2}>
                  {(recipe.teaPairings ?? []).join(" • ")}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: Colors.light.tintLight }]}>
              <Clock size={18} color={Colors.light.tint} />
            </View>
            <Text style={styles.statValue}>{recipe.prepTime + recipe.cookTime} min</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: Colors.light.accentLight }]}>
              <Users size={18} color={Colors.light.accent} />
            </View>
            <Text style={styles.statValue}>{recipe.servings}</Text>
            <Text style={styles.statLabel}>Servings</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: Colors.light.dangerLight }]}>
              <Flame size={18} color={Colors.light.danger} />
            </View>
            <Text style={styles.statValue}>{recipe.calories}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: Colors.light.successLight }]}>
              <Wheat size={18} color={Colors.light.success} />
            </View>
            <Text style={styles.statValue}>{recipe.carbsPerServing}g</Text>
            <Text style={styles.statLabel}>Carbs</Text>
          </View>
        </View>

        {(recipe.glycemicNotes?.length ?? 0) > 0 ? (
          <View style={styles.section} testID="recipe-glycemic-notes">
            <Text style={styles.sectionTitle}>Glucose-friendly notes</Text>
            {(recipe.glycemicNotes ?? []).map((note, index) => (
              <View key={String(index)} style={styles.noteRow}>
                <View style={[styles.bullet, { backgroundColor: Colors.light.gold }]} />
                <Text style={styles.noteText}>{note}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section} testID="recipe-ingredients">
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {recipe.ingredients.map((ingredient, index) => (
            <View key={String(index)} style={styles.ingredientRow}>
              <View style={styles.bullet} />
              <Text style={styles.ingredientText}>{ingredient}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section} testID="recipe-instructions">
          <Text style={styles.sectionTitle}>Instructions</Text>
          {recipe.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.instructionText}>{instruction}</Text>
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
    height: 260,
  },
  content: {
    padding: 20,
    marginTop: -24,
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: Colors.light.tintLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.tint,
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
  pairingCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 18,
  },
  pairingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 6,
  },
  pairingLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
  },
  pairingValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.text,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: "row",
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 16,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.tint,
    marginTop: 6,
  },
  ingredientText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 16,
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
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 22,
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
