import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, Clock, Flame, X, Globe, Leaf, CupSoda } from "lucide-react-native";
import Colors from "@/constants/colors";
import { BottomCTA } from "@/components/BottomCTA";
import { recipes, recipeCategories, Recipe } from "@/mocks/recipes";

function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
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
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const onPlan = useCallback(() => {
    console.log("[cookbook] bottom cta pressed");
    router.push("/(tabs)/meal-plan");
  }, [router]);

  const filteredRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return recipes.filter((recipe) => {
      const matchesCategory =
        activeCategory === "all" ||
        recipe.category === activeCategory ||
        (activeCategory === "world-best" && recipe.tags.includes("world-best")) ||
        (activeCategory === "teas" && recipe.category === "teas");

      const matchesSearch =
        q.length === 0 ||
        recipe.title.toLowerCase().includes(q) ||
        recipe.description.toLowerCase().includes(q) ||
        (recipe.origin ?? "").toLowerCase().includes(q) ||
        (recipe.teaPairings ?? []).some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const worldBestPick = useMemo(() => {
    const picks = recipes
      .filter((r) => r.tags.includes("world-best"))
      .sort((a, b) => a.carbsPerServing - b.carbsPerServing);
    return picks[0] ?? null;
  }, []);

  const teasPick = useMemo(() => {
    const picks = recipes
      .filter((r) => r.category === "teas")
      .sort((a, b) => a.carbsPerServing - b.carbsPerServing);
    return picks[0] ?? null;
  }, []);

  return (
    <View style={styles.container} testID="cookbook-screen">
      <View style={styles.hero} testID="cookbook-hero">
        <View style={styles.heroTopRow}>
          <View style={styles.heroTitleWrap}>
            <Text style={styles.heroEyebrow}>Cookbook</Text>
            <Text style={styles.heroTitle}>World-class recipes for steady glucose</Text>
          </View>
          <View style={styles.heroIconBadge}>
            <Globe size={18} color={Colors.light.sapphire} />
          </View>
        </View>

        <View style={styles.heroChipsRow}>
          <View style={styles.heroChip}>
            <Leaf size={14} color={Colors.light.success} />
            <Text style={styles.heroChipText}>Low added sugar</Text>
          </View>
          <View style={styles.heroChip}>
            <CupSoda size={14} color={Colors.light.gold} />
            <Text style={styles.heroChipText}>Tea pairings</Text>
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
        {filteredRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyText}>No recipes found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        ) : (
          filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onPress={() => router.push(`/(tabs)/recipes/${recipe.id}`)}
            />
          ))
        )}
      </ScrollView>

      <BottomCTA
        title="Plan your week"
        subtitle="Jump into Meal Planner"
        onPress={onPlan}
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
});
