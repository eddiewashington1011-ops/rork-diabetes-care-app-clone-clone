import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Dimensions,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Search, Clock, X, Sparkles, WifiOff, ChefHat, Grid3X3, List } from "lucide-react-native";
import Colors from "@/constants/colors";
import { BottomCTA } from "@/components/BottomCTA";
import { recipeCategories } from "@/mocks/recipes";
import { useRecipes, CoachRecipe } from "@/providers/recipes";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_GAP) / 2;

function RecipeCardGrid({ recipe, onPress }: { recipe: CoachRecipe; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: recipe.image }} style={styles.gridImage} />
      <View style={styles.gridOverlay}>
        <View style={styles.gridCarbBadge}>
          <Text style={styles.gridCarbText}>{recipe.carbsPerServing}g</Text>
        </View>
      </View>
      <View style={styles.gridContent}>
        <Text style={styles.gridTitle} numberOfLines={2}>{recipe.title}</Text>
        <View style={styles.gridMeta}>
          <Clock size={12} color={Colors.light.textSecondary} />
          <Text style={styles.gridMetaText}>{recipe.prepTime + recipe.cookTime} min</Text>
          <Text style={styles.gridMetaDot}>•</Text>
          <Text style={styles.gridMetaText}>{recipe.calories} cal</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function RecipeCardList({ recipe, onPress }: { recipe: CoachRecipe; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.listCard} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: recipe.image }} style={styles.listImage} />
      <View style={styles.listContent}>
        <View style={styles.listHeader}>
          <View style={styles.listCategoryTag}>
            <Text style={styles.listCategoryText}>{recipe.category}</Text>
          </View>
          <View style={styles.listCarbBadge}>
            <Text style={styles.listCarbText}>{recipe.carbsPerServing}g carbs</Text>
          </View>
        </View>
        <Text style={styles.listTitle} numberOfLines={1}>{recipe.title}</Text>
        <Text style={styles.listDesc} numberOfLines={1}>{recipe.description}</Text>
        <View style={styles.listMeta}>
          <Clock size={12} color={Colors.light.textSecondary} />
          <Text style={styles.listMetaText}>{recipe.prepTime + recipe.cookTime} min</Text>
          <Text style={styles.listMetaDot}>•</Text>
          <Text style={styles.listMetaText}>{recipe.calories} cal</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function QuickPickCard({ recipe, onPress }: { recipe: CoachRecipe; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: recipe.image }} style={styles.quickImage} />
      <View style={styles.quickOverlay}>
        <View style={styles.quickBadge}>
          <Text style={styles.quickBadgeText}>{recipe.carbsPerServing}g</Text>
        </View>
        <View style={styles.quickBottom}>
          <Text style={styles.quickTitle} numberOfLines={2}>{recipe.title}</Text>
          <Text style={styles.quickMeta}>{recipe.prepTime + recipe.cookTime} min</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RecipesScreen() {
  const router = useRouter();
  const { coach } = useLocalSearchParams<{ coach?: string }>();
  const { getPage, totalVirtualCount, createRecipeWithAgent, isHydrating, lastError } = useRecipes();

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [coachOpen, setCoachOpen] = useState<boolean>(false);
  const [coachGoal, setCoachGoal] = useState<string>("Blood sugar control");
  const [coachPrefs, setCoachPrefs] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    if (coach === "1") {
      console.log("[cookbook] coach param detected - opening Dia modal");
      setCoachOpen(true);
      if (typeof router.setParams === "function") {
        router.setParams({ coach: "0" });
      }
    }
  }, [coach, router]);

  const onOpenCoach = useCallback(() => {
    console.log("[cookbook] bottom cta pressed - open coach");
    setCoachOpen(true);
  }, []);

  const topRecipes = useMemo(() => {
    return getPage({ categoryId: activeCategory, query: searchQuery, offset: 0, limit: 120 });
  }, [activeCategory, getPage, searchQuery]);

  const quickPicks = useMemo(() => {
    return getPage({ categoryId: "all", query: "", offset: 0, limit: 12 })
      .sort((a, b) => a.carbsPerServing - b.carbsPerServing)
      .slice(0, 6);
  }, [getPage]);

  const openRecipe = useCallback(
    (id: string) => {
      router.push(`/(tabs)/recipes/${id}`);
    },
    [router],
  );

  const onGenerate = useCallback(async () => {
    if (isGenerating) {
      console.log("[cookbook] onGenerate: already generating, skipping");
      return;
    }
    setIsGenerating(true);
    console.log("[cookbook] coach generate pressed", { coachGoal, coachPrefsLen: coachPrefs.length });

    try {
      const created = await createRecipeWithAgent({ goal: coachGoal, preferences: coachPrefs });
      console.log("[cookbook] recipe created successfully", { id: created.id, title: created.title });
      setCoachOpen(false);
      setCoachPrefs("");
      setTimeout(() => {
        openRecipe(created.id);
      }, 50);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error("[cookbook] onGenerate failed", { error: errorMessage });
      Alert.alert("Could not generate recipe", errorMessage.length > 100 ? errorMessage.slice(0, 100) + "..." : errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [coachGoal, coachPrefs, createRecipeWithAgent, isGenerating, openRecipe]);

  const renderGridItem = useCallback(({ item }: { item: CoachRecipe }) => (
    <RecipeCardGrid recipe={item} onPress={() => openRecipe(item.id)} />
  ), [openRecipe]);

  const renderListItem = useCallback(({ item }: { item: CoachRecipe }) => (
    <RecipeCardList recipe={item} onPress={() => openRecipe(item.id)} />
  ), [openRecipe]);

  const allRecipes = useMemo(() => {
    return topRecipes;
  }, [topRecipes]);

  return (
    <View style={styles.container} testID="cookbook-screen">
      <View style={styles.header} testID="cookbook-header">
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <ChefHat size={24} color={Colors.light.tint} />
            <View>
              <Text style={styles.headerTitle}>Cookbook</Text>
              <Text style={styles.headerSubtitle}>{totalVirtualCount.toLocaleString()}+ recipes</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => setCoachOpen(true)}
            activeOpacity={0.85}
            testID="cookbook-open-coach"
          >
            <Sparkles size={16} color="#fff" />
            <Text style={styles.aiButtonText}>Ask Dia</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Search size={18} color={Colors.light.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes…"
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

      {searchQuery.length === 0 && activeCategory === "all" && quickPicks.length > 0 && (
        <View style={styles.quickSection}>
          <View style={styles.quickHeader}>
            <Text style={styles.quickHeaderTitle}>Quick Picks</Text>
            <Text style={styles.quickHeaderSub}>Lowest carbs</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickScroll}
          >
            {quickPicks.map((recipe) => (
              <QuickPickCard
                key={recipe.id}
                recipe={recipe}
                onPress={() => openRecipe(recipe.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.toolbar}>
        <Text style={styles.resultsText}>
          {allRecipes.length} recipes
        </Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === "grid" && styles.viewButtonActive]}
            onPress={() => setViewMode("grid")}
          >
            <Grid3X3 size={18} color={viewMode === "grid" ? Colors.light.tint : Colors.light.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === "list" && styles.viewButtonActive]}
            onPress={() => setViewMode("list")}
          >
            <List size={18} color={viewMode === "list" ? Colors.light.tint : Colors.light.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {isHydrating ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Loading cookbook…</Text>
        </View>
      ) : allRecipes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyText}>No recipes found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          {lastError ? <Text style={styles.errorHint}>{lastError}</Text> : null}
        </View>
      ) : viewMode === "grid" ? (
        <FlatList
          data={allRecipes}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
          testID="cookbook-grid"
        />
      ) : (
        <FlatList
          data={allRecipes}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          testID="cookbook-list"
        />
      )}

      <Modal
        visible={coachOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCoachOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCoachOpen(false)}
          testID="cookbook-coach-overlay"
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()} testID="cookbook-coach-modal">
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
              {lastError && (lastError.toLowerCase().includes("offline") || lastError.toLowerCase().includes("network") || lastError.toLowerCase().includes("ngrok")) && (
                <View style={styles.offlineBanner} testID="cookbook-coach-offline-banner">
                  <WifiOff size={16} color="#fff" />
                  <Text style={styles.offlineBannerText}>Dia is offline</Text>
                  <Text style={styles.offlineBannerSub}>Recipes will be generated locally (still delicious!)</Text>
                </View>
              )}

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
                onPress={() => {
                  console.log("[cookbook] generate button pressed", { isGenerating });
                  if (!isGenerating) {
                    onGenerate();
                  }
                }}
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

              {lastError && !lastError.toLowerCase().includes("offline") && !lastError.toLowerCase().includes("network") && !lastError.toLowerCase().includes("ngrok") ? (
                <Text style={styles.modalErrorText}>{lastError}</Text>
              ) : null}
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>

      <BottomCTA
        title="Generate recipe"
        subtitle="Tell Dia what you're craving"
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
  header: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.light.background,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  aiButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700" as const,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    maxHeight: 48,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    gap: 8,
    flexDirection: "row",
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
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
    fontSize: 13,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
  },
  categoryChipTextActive: {
    color: "#fff",
  },
  quickSection: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  quickHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  quickHeaderTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  quickHeaderSub: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
  },
  quickScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  quickCard: {
    width: 130,
    height: 160,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: Colors.light.surface,
  },
  quickImage: {
    width: "100%",
    height: "100%",
  },
  quickOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 10,
    justifyContent: "space-between",
  },
  quickBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  quickBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700" as const,
  },
  quickBottom: {
    gap: 2,
  },
  quickTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700" as const,
    lineHeight: 17,
  },
  quickMeta: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "600" as const,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resultsText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: Colors.light.surface,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  viewButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewButtonActive: {
    backgroundColor: Colors.light.background,
  },
  gridContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: CARD_GAP,
  },
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gridImage: {
    width: "100%",
    height: 110,
  },
  gridOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  gridCarbBadge: {
    backgroundColor: Colors.light.success,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gridCarbText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700" as const,
  },
  gridContent: {
    padding: 10,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.text,
    lineHeight: 17,
    marginBottom: 6,
    minHeight: 34,
  },
  gridMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  gridMetaText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: "500" as const,
  },
  gridMetaDot: {
    color: Colors.light.textSecondary,
    fontSize: 11,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 12,
  },
  listCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  listImage: {
    width: 100,
    height: 100,
  },
  listContent: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  listCategoryTag: {
    backgroundColor: Colors.light.tintLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  listCategoryText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.light.tint,
    textTransform: "capitalize",
  },
  listCarbBadge: {
    backgroundColor: Colors.light.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  listCarbText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.light.success,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  listDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  listMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  listMetaText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: "500" as const,
  },
  listMetaDot: {
    color: Colors.light.textSecondary,
    fontSize: 11,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600" as const,
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
    flex: 1,
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
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
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: "#f59e0b",
    marginHorizontal: -18,
    marginTop: -14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    marginBottom: 12,
  },
  offlineBannerText: {
    fontSize: 14,
    fontWeight: "800" as const,
    color: "#fff",
  },
  offlineBannerSub: {
    width: "100%",
    fontSize: 12,
    fontWeight: "600" as const,
    color: "rgba(255,255,255,0.85)",
    marginTop: -4,
  },
});
