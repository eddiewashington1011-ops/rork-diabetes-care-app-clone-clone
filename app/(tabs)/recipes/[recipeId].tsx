import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BottomCTA } from "@/components/BottomCTA";
import { Clock, Users, Flame, Wheat, Sparkles, Trash2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useRecipes } from "@/providers/recipes";

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const { getRecipeById, ensureFullRecipe, deleteSavedRecipe } = useRecipes();

  const [isExpanding, setIsExpanding] = useState<boolean>(false);

  const recipe = useMemo(() => getRecipeById(recipeId), [getRecipeById, recipeId]);

  console.log("[RecipeDetail] open", { recipeId, found: Boolean(recipe), source: recipe?.source });

  const onGenerateFull = useCallback(async () => {
    if (!recipe || recipe.source !== "virtual") return;
    if (isExpanding) return;

    console.log("[RecipeDetail] generate full pressed", { recipeId: recipe.id });
    setIsExpanding(true);
    try {
      const next = await ensureFullRecipe(recipe.id);
      if (next?.source === "saved") {
        Alert.alert("Ready to cook", "Full ingredients + steps generated.");
      }
    } catch (e) {
      Alert.alert("Couldn’t generate", "Please try again in a moment.");
    } finally {
      setIsExpanding(false);
    }
  }, [ensureFullRecipe, isExpanding, recipe]);

  const onDelete = useCallback(() => {
    if (!recipe || recipe.source !== "saved" || !recipe.id.startsWith("ai_")) return;

    Alert.alert("Delete recipe?", "This will remove it from your saved cookbook.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          console.log("[RecipeDetail] delete pressed", { id: recipe.id });
          void deleteSavedRecipe(recipe.id);
          router.back();
        },
      },
    ]);
  }, [deleteSavedRecipe, recipe, router]);

  const onAskDia = useCallback(() => {
    console.log("[RecipeDetail] ask dia pressed", { fromRecipeId: recipe?.id });
    router.push({ pathname: "/(tabs)/recipes", params: { coach: "1" } } as never);
  }, [recipe?.id, router]);

  if (!recipe) {
    return (
      <View style={styles.container} testID="recipe-not-found">
        <Text style={styles.errorText}>Recipe not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="recipe-detail-shell">
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

        <View style={styles.actionRow}>
          {recipe.source === "virtual" ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={onGenerateFull}
              activeOpacity={0.9}
              disabled={isExpanding}
              testID="recipe-generate-full"
            >
              {isExpanding ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Sparkles size={16} color="#fff" />
              )}
              <Text style={styles.actionButtonText}>{isExpanding ? "Generating…" : "Generate full recipe"}</Text>
            </TouchableOpacity>
          ) : null}

          {recipe.source === "saved" && recipe.id.startsWith("ai_") ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonGhost]}
              onPress={onDelete}
              activeOpacity={0.9}
              testID="recipe-delete"
            >
              <Trash2 size={16} color={Colors.light.danger} />
              <Text style={styles.actionButtonGhostText}>Delete</Text>
            </TouchableOpacity>
          ) : null}
        </View>

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

        <View style={styles.nutritionCard} testID="recipe-nutrition-card">
          <Text style={styles.nutritionTitle}>Nutrition (per serving)</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.calories}</Text>
              <Text style={styles.nutritionLabel}>Calories</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.carbsPerServing}g</Text>
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.fiberG ?? "—"}</Text>
              <Text style={styles.nutritionLabel}>Fiber (g)</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.sugarG ?? "—"}</Text>
              <Text style={styles.nutritionLabel}>Sugar (g)</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.proteinG ?? "—"}</Text>
              <Text style={styles.nutritionLabel}>Protein (g)</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.fatG ?? "—"}</Text>
              <Text style={styles.nutritionLabel}>Fat (g)</Text>
            </View>
          </View>

          <View style={styles.giRow}>
            <Text style={styles.giLabel}>Estimated Glycemic Load</Text>
            <Text style={styles.giValue}>{recipe.glycemicLoad ?? "—"}</Text>
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

      <BottomCTA
        title="Ask Dia"
        subtitle="Generate a new recipe"
        onPress={onAskDia}
        testID="recipe-ask-dia"
      />
    </View>
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
    fontWeight: "600" as const,
    color: Colors.light.tint,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
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
    fontWeight: "800" as const,
    letterSpacing: 0.3,
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
  },
  pairingValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.text,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionButtonPrimary: {
    flex: 1,
    backgroundColor: Colors.light.sapphire,
    borderColor: Colors.light.sapphire,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900" as const,
  },
  actionButtonGhost: {
    backgroundColor: Colors.light.background,
    borderColor: Colors.light.border,
  },
  actionButtonGhostText: {
    color: Colors.light.danger,
    fontSize: 14,
    fontWeight: "900" as const,
  },
  statsGrid: {
    flexDirection: "row",
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
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
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  nutritionCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 22,
  },
  nutritionTitle: {
    fontSize: 14,
    fontWeight: "900" as const,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  nutritionItem: {
    width: "30%",
    minWidth: 96,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: "900" as const,
    color: Colors.light.text,
  },
  nutritionLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "800" as const,
    color: Colors.light.textSecondary,
  },
  giRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  giLabel: {
    fontSize: 12,
    fontWeight: "900" as const,
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  giValue: {
    fontSize: 16,
    fontWeight: "900" as const,
    color: Colors.light.sapphire,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
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
    fontWeight: "700" as const,
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
