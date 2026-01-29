import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, Clock, Flame, X, Globe, Leaf, CupSoda, Sparkles } from "lucide-react-native";
import Colors from "@/constants/colors";
import { BottomCTA } from "@/components/BottomCTA";
import { recipeCategories } from "@/mocks/recipes";
import { useRecipes, CoachRecipe } from "@/providers/recipes";

function RecipeCard({ recipe, onPress }: { recipe: CoachRecipe; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.recipeCard} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
      <View style={styles.recipeContent}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{recipe.category}</Text>
        </View>
        <Text style={styles.recipeTitle}>{recipe.title}</Text>
        <Text style={styles.recipeDesc} numberOfLines={2}>
          {recipe.description}
        </Text>
        <View style={styles.recipeMeta}>
          <View style={styles.metaItem}>
            <Clock size={14} color={Colors.light.textSecondary} />
            <Text style={styles.metaText}>{recipe.prepTime + recipe.cookTime} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Flame size={14} color={Colors.light.accent} />
            <Text style={styles.metaText}>{recipe.calories} cal</Text>
          </View>
          <View style={styles.carbBadge}>
            <Text style={styles.carbText}>{recipe.carbsPerServing}g carbs</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RecipesScreen() {
  const router = useRouter();
  const { getPage, totalVirtualCount, createRecipeWithAgent, isHydrating, lastError } = useRecipes();

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [coachOpen, setCoachOpen] = useState<boolean>(false);
  const [coachGoal, setCoachGoal] = useState<string>("Blood sugar control");
  const [coachPrefs, setCoachPrefs] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const onOpenCoach = useCallback(() => {
    console.log("[cookbook] bottom cta pressed - open coach");
    setCoachOpen(true);
  }, []);

  const topRecipes = useMemo(() => {
    return getPage({ categoryId: activeCategory, query: searchQuery, offset: 0, limit: 120 });
  }, [activeCategory, getPage, searchQuery]);

  const sectionedRecipes = useMemo(() => {
    if (activeCategory !== "all") return null;
    if (searchQuery.trim().length > 0) return null;

    const order = ["breakfast", "lunch", "dinner", "snacks", "desserts", "teas"] as const;

    const sections = order
      .map((categoryId) => {
        const items = getPage({ categoryId, query: "", offset: 0, limit: 18 });
        return { categoryId, items };
      })
      .filter((s) => s.items.length > 0);

    return sections;
  }, [activeCategory, getPage, searchQuery]);

  const worldBestPick = useMemo(() => {
    const picks = getPage({ categoryId: "world-best", query: "", offset: 0, limit: 24 }).sort(
      (a, b) => a.carbsPerServing - b.carbsPerServing,
    );
    return picks[0] ?? null;
  }, [getPage]);

  const teasPick = useMemo(() => {
    const picks = getPage({ categoryId: "teas", query: "", offset: 0, limit: 24 }).sort(
      (a, b) => a.carbsPerServing - b.carbsPerServing,
    );
    return picks[0] ?? null;
  }, [getPage]);

  const openRecipe = useCallback(
    (id: string) => {
      router.push(`/(tabs)/recipes/${id}`);
    },
    [router],
  );

  const onGenerate = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    console.log("[cookbook] coach generate pressed", { coachGoal, coachPrefsLen: coachPrefs.length });

    try {
      const created = await createRecipeWithAgent({ goal: coachGoal, preferences: coachPrefs });
      setCoachOpen(false);
      setCoachPrefs("");
      setTimeout(() => {
        openRecipe(created.id);
      }, 50);
    } catch {
      Alert.alert("Couldn’t generate recipe", "Please try again in a moment.");
    } finally {
      setIsGenerating(false);
    }
  }, [coachGoal, coachPrefs, createRecipeWithAgent, isGenerating, openRecipe]);

  return (
    <View style={styles.container} testID="cookbook-screen">
      <View style={styles.hero} testID="cookbook-hero">
        <View style={styles.heroTopRow}>
          <View style={styles.heroTitleWrap}>
            <Text style={styles.heroEyebrow}>Cookbook</Text>
            <Text style={styles.heroTitle}>Cookbook: 8,000+ diabetes-friendly recipes</Text>
          </View>
          <View style={styles.heroIconBadge}>
            <Globe size={18} color={Colors.light.sapphire} />
          </View>
        </View>

        <View style={styles.heroChipsRow}>
          <View style={styles.heroChip}>
            <Leaf size={14} color={Colors.light.success} />
            <Text style={styles.heroChipText}>No added sugar</Text>
          </View>
          <View style={styles.heroChip}>
            <CupSoda size={14} color={Colors.light.gold} />
            <Text style={styles.heroChipText}>Low glycemic load</Text>
          </View>
        </View>

        <View style={styles.heroCoachRow}>
          <TouchableOpacity
            style={styles.coachButton}
            onPress={() => setCoachOpen(true)}
            activeOpacity={0.9}
            testID="cookbook-open-coach"
          >
            <View style={styles.coachIcon}>
              <Sparkles size={16} color={Colors.light.sapphire} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.coachTitle}>Ask Dia</Text>
              <Text style={styles.coachSubtitle} numberOfLines={1}>
                Tell me what you’re craving — I’ll make it diabetes-friendly
              </Text>
            </View>
            <View style={styles.coachPill}>
              <Text style={styles.coachPillText}>AI</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.heroCountPill} testID="cookbook-total-count">
            <Text style={styles.heroCountText}>{totalVirtualCount.toLocaleString()}+</Text>
            <Text style={styles.heroCountSub}>recipes</Text>
          </View>
        </View>

        <View style={styles.heroCardsRow}>
          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => {
              if (!worldBestPick) return;
              router.push(`/(tabs)/recipes/${worldBestPick.id}`);
            }}
            activeOpacity={0.85}
            testID="cookbook-feature-worldbest"
          >
            <Image
              source={{
                uri:
                  worldBestPick?.image ??
                  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
              }}
              style={styles.featureImage}
            />
            <View style={styles.featureOverlay}>
              <Text style={styles.featureKicker}>Best of the world</Text>
              <Text style={styles.featureTitle} numberOfLines={2}>
                {worldBestPick?.title ?? "World Best Picks"}
              </Text>
              <Text style={styles.featureMeta} numberOfLines={1}>
                {(worldBestPick?.origin ?? "Global") +
                  " • " +
                  String(worldBestPick?.carbsPerServing ?? 0) +
                  "g carbs"}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.featureCard, styles.featureCardAlt]}
            onPress={() => {
              if (!teasPick) return;
              router.push(`/(tabs)/recipes/${teasPick.id}`);
            }}
            activeOpacity={0.85}
            testID="cookbook-feature-tea"
          >
            <Image
              source={{
                uri:
                  teasPick?.image ??
                  "https://images.unsplash.com/photo-1548611716-300e3f5b17f6?w=400",
              }}
              style={styles.featureImage}
            />
            <View style={styles.featureOverlay}>
              <Text style={styles.featureKicker}>Teas that hit</Text>
              <Text style={styles.featureTitle} numberOfLines={2}>
                {teasPick?.title ?? "Tea Pairings"}
              </Text>
              <Text style={styles.featureMeta} numberOfLines={1}>
                {String(teasPick?.carbsPerServing ?? 0) + "g carbs • no sugar"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer} testID="cookbook-search">
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.light.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes, origins, teas…"
            placeholderTextColor={Colors.light.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="cookbook-search-input"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} testID="cookbook-search-clear">
              <X size={18} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {recipeCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              activeCategory === category.id && styles.categoryChipActive,
            ]}
            onPress={() => setActiveCategory(category.id)}
            testID={`cookbook-category-${category.id}`}
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
        style={styles.recipesScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.recipesContainer}
        testID="cookbook-list"
      >
        {isHydrating ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={Colors.light.tint} />
            <Text style={styles.loadingText}>Loading cookbook…</Text>
          </View>
        ) : (sectionedRecipes?.length ?? 0) > 0 ? (
          sectionedRecipes?.map((section) => {
            const titleByCategory: Record<string, string> = {
              breakfast: "Breakfast",
              lunch: "Lunch",
              dinner: "Dinner",
              snacks: "Snacks",
              desserts: "Desserts",
              teas: "Teas",
            };

            return (
              <View key={section.categoryId} style={styles.sectionBlock} testID={`cookbook-section-${section.categoryId}`}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{titleByCategory[section.categoryId] ?? section.categoryId}</Text>
                  <Text style={styles.sectionSubtitle}>{section.items.length}+ picks</Text>
                </View>

                <View style={styles.sectionList}>
                  {section.items.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} onPress={() => openRecipe(recipe.id)} />
                  ))}
                </View>
              </View>
            );
          })
        ) : topRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyText}>No recipes found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            {lastError ? <Text style={styles.errorHint}>{lastError}</Text> : null}
          </View>
        ) : (
          topRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onPress={() => openRecipe(recipe.id)} />
          ))
        )}
      </ScrollView>

      <Modal
        visible={coachOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCoachOpen(false)}
      >
        <View style={styles.modalOverlay} testID="cookbook-coach-overlay">
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setCoachOpen(false)}
            testID="cookbook-coach-overlay-dismiss"
          />
          <View style={styles.modalCard} testID="cookbook-coach-modal">
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Dia</Text>
                <TouchableOpacity
                  onPress={() => setCoachOpen(false)}
                  style={styles.modalClose}
                  testID="cookbook-coach-close"
                >
                  <X size={18} color={Colors.light.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Goal</Text>
              <View style={styles.goalRow}>
                {["Blood sugar control", "Weight loss", "Heart health", "High protein"].map((g) => {
                  const active = coachGoal === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setCoachGoal(g)}
                      style={[styles.goalChip, active && styles.goalChipActive]}
                      testID={`cookbook-coach-goal-${g.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      <Text style={[styles.goalChipText, active && styles.goalChipTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.modalLabel, { marginTop: 12 }]}>Preferences</Text>
              <TextInput
                value={coachPrefs}
                onChangeText={setCoachPrefs}
                placeholder="e.g., 30g carbs max, vegetarian, spicy, 15 min prep, uses chicken…"
                placeholderTextColor={Colors.light.textSecondary}
                multiline
                style={styles.modalInput}
                testID="cookbook-coach-input"
              />

              <TouchableOpacity
                onPress={onGenerate}
                activeOpacity={0.9}
                style={[styles.modalButton, isGenerating && { opacity: 0.7 }]}
                disabled={isGenerating}
                testID="cookbook-coach-generate"
              >
                {isGenerating ? (
                  <View style={styles.modalButtonRow}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.modalButtonText}>Generating…</Text>
                  </View>
                ) : (
                  <Text style={styles.modalButtonText}>Generate recipe</Text>
                )}
              </TouchableOpacity>

              {lastError ? <Text style={styles.modalErrorText}>{lastError}</Text> : null}
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>

      <BottomCTA
        title="Generate recipe"
        subtitle="Tell Dia what you’re craving"
        onPress={onOpenCoach}
        testID="cookbook-bottom-cta"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  hero: {
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heroTitleWrap: {
    flex: 1,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Colors.light.sapphire,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.light.text,
    lineHeight: 28,
  },
  heroIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.light.sapphireLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  heroChipsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  heroCoachRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  coachButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: Colors.light.sapphireLight,
    borderWidth: 1,
    borderColor: "rgba(11, 58, 91, 0.14)",
  },
  coachIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(11, 58, 91, 0.12)",
  },
  coachTitle: {
    fontSize: 14,
    fontWeight: "900" as const,
    color: Colors.light.sapphire,
  },
  coachSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.textSecondary,
  },
  coachPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.light.sapphire,
  },
  coachPillText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900" as const,
    letterSpacing: 0.3,
  },
  heroCountPill: {
    width: 86,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCountText: {
    fontSize: 16,
    fontWeight: "900" as const,
    color: Colors.light.text,
  },
  heroCountSub: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: "800" as const,
    color: Colors.light.textSecondary,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  heroChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.textSecondary,
  },
  heroCardsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  featureCard: {
    flex: 1,
    height: 140,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: Colors.light.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  featureCardAlt: {
    transform: [{ translateY: 6 }],
  },
  featureImage: {
    width: "100%",
    height: "100%",
  },
  featureOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 28,
    paddingBottom: 12,
    backgroundColor: "rgba(11, 58, 91, 0.55)",
  },
  featureKicker: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 18,
    marginBottom: 3,
  },
  featureMeta: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.85)",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
  },
  categoryScroll: {
    maxHeight: 54,
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
  recipesScroll: {
    flex: 1,
  },
  recipesContainer: {
    padding: 20,
    paddingBottom: 140,
    gap: 16,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900" as const,
    color: Colors.light.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: "800" as const,
    color: Colors.light.textSecondary,
  },
  sectionList: {
    gap: 16,
  },
  recipeCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  recipeImage: {
    width: "100%",
    height: 160,
  },
  recipeContent: {
    padding: 16,
  },
  categoryTag: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.tintLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.tint,
    textTransform: "capitalize",
  },
  recipeTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 6,
  },
  recipeDesc: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  recipeMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
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
  carbBadge: {
    backgroundColor: Colors.light.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: "auto",
  },
  carbText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.success,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  errorHint: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.danger,
    textAlign: "center",
  },
  loadingState: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900" as const,
    color: Colors.light.text,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: "900" as const,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  goalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  goalChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  goalChipActive: {
    backgroundColor: Colors.light.sapphire,
    borderColor: Colors.light.sapphire,
  },
  goalChipText: {
    fontSize: 12,
    fontWeight: "800" as const,
    color: Colors.light.textSecondary,
  },
  goalChipTextActive: {
    color: "#fff",
  },
  modalInput: {
    minHeight: 88,
    maxHeight: 170,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    fontSize: 14,
    color: Colors.light.text,
  },
  modalButton: {
    marginTop: 14,
    backgroundColor: Colors.light.tint,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900" as const,
  },
  modalErrorText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.danger,
  },
});
