import React, { useCallback, useMemo, useState, useEffect } from "react";
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
import { Clock, Users, Flame, Wheat, Sparkles, Trash2, Video, Camera, Hash, MessageSquare, Play, Copy, Check, ImageIcon, RefreshCw } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useRecipes } from "@/providers/recipes";
import * as Clipboard from "expo-clipboard";
import { categorizeIngredients, getIngredientImagePrompt } from "@/lib/ingredientCategories";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const { getRecipeById, ensureFullRecipe, deleteSavedRecipe, generateVideoPack } = useRecipes();

  const [isExpanding, setIsExpanding] = useState<boolean>(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [ingredientImages, setIngredientImages] = useState<Record<string, string>>({});
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());
  const [isGeneratingAllImages, setIsGeneratingAllImages] = useState<boolean>(false);

  const recipe = useMemo(() => getRecipeById(recipeId), [getRecipeById, recipeId]);

  const categorizedIngredients = useMemo(() => {
    if (!recipe) return [];
    return categorizeIngredients(recipe.ingredients);
  }, [recipe]);

  useEffect(() => {
    const loadStoredImages = async () => {
      if (!recipeId) return;
      try {
        const stored = await AsyncStorage.getItem(`ingredient_images_${recipeId}`);
        if (stored) {
          setIngredientImages(JSON.parse(stored));
        }
      } catch (err) {
        console.log("[RecipeDetail] Failed to load stored images", err);
      }
    };
    loadStoredImages();
  }, [recipeId]);

  const saveImagesToStorage = useCallback(async (images: Record<string, string>) => {
    if (!recipeId) return;
    try {
      await AsyncStorage.setItem(`ingredient_images_${recipeId}`, JSON.stringify(images));
    } catch (err) {
      console.log("[RecipeDetail] Failed to save images", err);
    }
  }, [recipeId]);

  const generateIngredientImage = useCallback(async (ingredientName: string) => {
    if (generatingImages.has(ingredientName)) return;
    
    console.log("[RecipeDetail] Generating image for:", ingredientName);
    setGeneratingImages(prev => new Set(prev).add(ingredientName));
    
    try {
      const prompt = getIngredientImagePrompt(ingredientName);
      const response = await fetch("https://toolkit.rork.com/images/generate/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, size: "1024x1024" }),
      });
      
      if (!response.ok) throw new Error("Failed to generate image");
      
      const data = await response.json();
      const imageUri = `data:${data.image.mimeType};base64,${data.image.base64Data}`;
      
      setIngredientImages(prev => {
        const updated = { ...prev, [ingredientName]: imageUri };
        saveImagesToStorage(updated);
        return updated;
      });
    } catch (err) {
      console.log("[RecipeDetail] Failed to generate image:", err);
    } finally {
      setGeneratingImages(prev => {
        const next = new Set(prev);
        next.delete(ingredientName);
        return next;
      });
    }
  }, [generatingImages, saveImagesToStorage]);

  const generateAllMissingImages = useCallback(async () => {
    if (isGeneratingAllImages) return;
    setIsGeneratingAllImages(true);
    
    const allIngredients: string[] = [];
    categorizedIngredients.forEach(cat => {
      cat.ingredients.forEach(ing => {
        if (!ingredientImages[ing.name]) {
          allIngredients.push(ing.name);
        }
      });
    });
    
    console.log("[RecipeDetail] Generating images for:", allIngredients.length, "ingredients");
    
    for (const name of allIngredients) {
      await generateIngredientImage(name);
    }
    
    setIsGeneratingAllImages(false);
    Alert.alert("Done!", "All ingredient images have been generated.");
  }, [categorizedIngredients, ingredientImages, isGeneratingAllImages, generateIngredientImage]);

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
    } catch {
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

  const onGenerateVideoPack = useCallback(async () => {
    if (!recipe || isGeneratingVideo) return;
    if (recipe.source === "virtual") {
      Alert.alert("Generate recipe first", "Please generate the full recipe before creating a video pack.");
      return;
    }

    console.log("[RecipeDetail] generate video pack pressed", { recipeId: recipe.id });
    setIsGeneratingVideo(true);
    try {
      const pack = await generateVideoPack(recipe.id);
      if (pack) {
        Alert.alert("Video Pack Ready!", "Your TikTok/Reels content has been generated.");
      } else {
        Alert.alert("Generation failed", "Dia may be offline. Please try again.");
      }
    } catch {
      Alert.alert("Couldn't generate", "Please try again in a moment.");
    } finally {
      setIsGeneratingVideo(false);
    }
  }, [generateVideoPack, isGeneratingVideo, recipe]);

  const onOpenVideoAgent = useCallback(() => {
    if (!recipe) return;
    console.log("[RecipeDetail] open video agent", { recipeId: recipe.id });
    router.push({ pathname: "/(tabs)/recipes/video-agent", params: { recipeId: recipe.id } } as never);
  }, [recipe, router]);

  const copyToClipboard = useCallback(async (text: string, index: number) => {
    await Clipboard.setStringAsync(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  }, []);

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
          <View style={styles.ingredientsSectionHeader}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <TouchableOpacity
              style={styles.generateAllButton}
              onPress={generateAllMissingImages}
              disabled={isGeneratingAllImages}
              activeOpacity={0.8}
            >
              {isGeneratingAllImages ? (
                <ActivityIndicator size="small" color={Colors.light.tint} />
              ) : (
                <ImageIcon size={16} color={Colors.light.tint} />
              )}
              <Text style={styles.generateAllText}>
                {isGeneratingAllImages ? "Generating..." : "Generate Images"}
              </Text>
            </TouchableOpacity>
          </View>
          
          {categorizedIngredients.map((category) => (
            <View key={category.id} style={styles.categorySection}>
              <View style={[styles.categoryHeader, { borderLeftColor: category.color }]}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryCount}>{category.ingredients.length}</Text>
              </View>
              <View style={styles.ingredientsGrid}>
                {category.ingredients.map((ingredient, idx) => (
                  <TouchableOpacity
                    key={`${category.id}-${idx}`}
                    style={styles.ingredientCard}
                    onPress={() => generateIngredientImage(ingredient.name)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.ingredientImageContainer, { borderColor: category.color + '40' }]}>
                      {ingredientImages[ingredient.name] ? (
                        <Image
                          source={{ uri: ingredientImages[ingredient.name] }}
                          style={styles.ingredientImage}
                          resizeMode="cover"
                        />
                      ) : generatingImages.has(ingredient.name) ? (
                        <ActivityIndicator size="small" color={category.color} />
                      ) : (
                        <View style={styles.placeholderImage}>
                          <ImageIcon size={20} color={Colors.light.textSecondary} />
                        </View>
                      )}
                      {ingredientImages[ingredient.name] && (
                        <TouchableOpacity
                          style={styles.refreshImageButton}
                          onPress={() => generateIngredientImage(ingredient.name)}
                          disabled={generatingImages.has(ingredient.name)}
                        >
                          <RefreshCw size={10} color="#fff" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.ingredientCardText} numberOfLines={2}>
                      {ingredient.original}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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

        {/* Video Pack Section */}
        <View style={styles.videoPackSection} testID="video-pack-section">
          <View style={styles.videoPackHeader}>
            <View style={styles.videoPackTitleRow}>
              <Video size={20} color={Colors.light.coral} />
              <Text style={styles.videoPackTitle}>Short Video Pack</Text>
            </View>
            <Text style={styles.videoPackSubtitle}>TikTok • Reels • Shorts ready</Text>
          </View>

          {!recipe.shortVideoPack ? (
            <View style={styles.videoButtonsRow}>
              <TouchableOpacity
                style={styles.generateVideoButton}
                onPress={onGenerateVideoPack}
                activeOpacity={0.9}
                disabled={isGeneratingVideo || recipe.source === "virtual"}
                testID="generate-video-pack"
              >
                {isGeneratingVideo ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Video size={18} color="#fff" />
                )}
                <Text style={styles.generateVideoButtonText}>
                  {isGeneratingVideo ? "Generating..." : "Quick Generate"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.videoAgentButton}
                onPress={onOpenVideoAgent}
                activeOpacity={0.9}
                disabled={recipe.source === "virtual"}
                testID="open-video-agent"
              >
                <Sparkles size={18} color={Colors.light.coral} />
                <Text style={styles.videoAgentButtonText}>AI Creator</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.videoPackContent}>
              {/* Video Script */}
              <TouchableOpacity
                style={styles.videoPackCard}
                onPress={() => toggleSection("script")}
                activeOpacity={0.8}
              >
                <View style={styles.videoPackCardHeader}>
                  <View style={styles.videoPackCardIcon}>
                    <Play size={16} color={Colors.light.coral} />
                  </View>
                  <Text style={styles.videoPackCardTitle}>Video Script</Text>
                  <Text style={styles.videoPackCardBadge}>{recipe.shortVideoPack.videoScript.length} scenes</Text>
                </View>
                {expandedSection === "script" && (
                  <View style={styles.videoPackCardBody}>
                    {recipe.shortVideoPack.videoScript.map((scene, idx) => (
                      <View key={idx} style={styles.scriptItem}>
                        <Text style={styles.scriptTimecode}>{scene.timecode}</Text>
                        <Text style={styles.scriptContent}>{scene.content}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>

              {/* Storyboard */}
              <TouchableOpacity
                style={styles.videoPackCard}
                onPress={() => toggleSection("storyboard")}
                activeOpacity={0.8}
              >
                <View style={styles.videoPackCardHeader}>
                  <View style={styles.videoPackCardIcon}>
                    <Camera size={16} color={Colors.light.sapphire} />
                  </View>
                  <Text style={styles.videoPackCardTitle}>Shot List</Text>
                  <Text style={styles.videoPackCardBadge}>{recipe.shortVideoPack.verticalStoryboard.length} shots</Text>
                </View>
                {expandedSection === "storyboard" && (
                  <View style={styles.videoPackCardBody}>
                    {recipe.shortVideoPack.verticalStoryboard.map((shot, idx) => (
                      <View key={idx} style={styles.storyboardShot}>
                        <View style={styles.shotHeader}>
                          <Text style={styles.shotNumber}>Shot {shot.shotNumber}</Text>
                          <Text style={styles.shotDuration}>{shot.duration}</Text>
                        </View>
                        <Text style={styles.shotAngle}>{shot.angle}</Text>
                        <Text style={styles.shotAction}>{shot.action}</Text>
                        <View style={styles.shotMeta}>
                          <Text style={styles.shotText}>📝 {shot.onScreenText}</Text>
                          <Text style={styles.shotSound}>🔊 {shot.soundCue}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>

              {/* Video Prompts */}
              <TouchableOpacity
                style={styles.videoPackCard}
                onPress={() => toggleSection("prompts")}
                activeOpacity={0.8}
              >
                <View style={styles.videoPackCardHeader}>
                  <View style={styles.videoPackCardIcon}>
                    <Sparkles size={16} color={Colors.light.gold} />
                  </View>
                  <Text style={styles.videoPackCardTitle}>AI Video Prompts</Text>
                  <Text style={styles.videoPackCardBadge}>Runway/Sora</Text>
                </View>
                {expandedSection === "prompts" && (
                  <View style={styles.videoPackCardBody}>
                    {recipe.shortVideoPack.videoGenerationPrompts.map((prompt, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.promptItem}
                        onPress={() => copyToClipboard(prompt, idx)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.promptText}>{prompt}</Text>
                        <View style={styles.copyButton}>
                          {copiedIndex === idx ? (
                            <Check size={14} color={Colors.light.success} />
                          ) : (
                            <Copy size={14} color={Colors.light.textSecondary} />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                    <View style={styles.heroPromptCard}>
                      <Text style={styles.heroPromptLabel}>🎬 Hero Shot Prompt</Text>
                      <TouchableOpacity
                        onPress={() => copyToClipboard(recipe.shortVideoPack?.finalHeroShotPrompt ?? "", 999)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.heroPromptText}>{recipe.shortVideoPack.finalHeroShotPrompt}</Text>
                        <View style={styles.copyButtonInline}>
                          {copiedIndex === 999 ? (
                            <Check size={14} color={Colors.light.success} />
                          ) : (
                            <Copy size={14} color={Colors.light.coral} />
                          )}
                          <Text style={styles.copyText}>{copiedIndex === 999 ? "Copied!" : "Copy prompt"}</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Captions & Hashtags */}
              <TouchableOpacity
                style={styles.videoPackCard}
                onPress={() => toggleSection("captions")}
                activeOpacity={0.8}
              >
                <View style={styles.videoPackCardHeader}>
                  <View style={styles.videoPackCardIcon}>
                    <MessageSquare size={16} color={Colors.light.success} />
                  </View>
                  <Text style={styles.videoPackCardTitle}>Captions & Hashtags</Text>
                </View>
                {expandedSection === "captions" && (
                  <View style={styles.videoPackCardBody}>
                    <Text style={styles.captionsLabel}>Auto Captions</Text>
                    {recipe.shortVideoPack.autoCaptions.map((caption, idx) => (
                      <View key={idx} style={styles.captionItem}>
                        <Text style={styles.captionText}>{caption}</Text>
                      </View>
                    ))}
                    <View style={styles.ctaCard}>
                      <Text style={styles.ctaLabel}>CTA</Text>
                      <Text style={styles.ctaText}>{recipe.shortVideoPack.cta}</Text>
                    </View>
                    <View style={styles.hashtagsContainer}>
                      <View style={styles.hashtagsHeader}>
                        <Hash size={14} color={Colors.light.sapphire} />
                        <Text style={styles.hashtagsLabel}>Hashtags</Text>
                      </View>
                      <View style={styles.hashtagsWrap}>
                        {recipe.shortVideoPack.hashtags.map((tag, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.hashtagChip}
                            onPress={() => copyToClipboard(tag, 1000 + idx)}
                          >
                            <Text style={styles.hashtagText}>{tag}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TouchableOpacity
                        style={styles.copyAllHashtags}
                        onPress={() => copyToClipboard(recipe.shortVideoPack?.hashtags.join(" ") ?? "", 2000)}
                      >
                        {copiedIndex === 2000 ? (
                          <Check size={14} color={Colors.light.success} />
                        ) : (
                          <Copy size={14} color={Colors.light.sapphire} />
                        )}
                        <Text style={styles.copyAllText}>{copiedIndex === 2000 ? "Copied all!" : "Copy all hashtags"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
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
  ingredientsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  generateAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.tintLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  generateAllText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.tint,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 12,
    borderLeftWidth: 3,
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.text,
    flex: 1,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ingredientsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  ingredientCard: {
    width: "31%",
    minWidth: 95,
    alignItems: "center",
  },
  ingredientImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: Colors.light.surface,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 6,
  },
  ingredientImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    alignItems: "center",
    justifyContent: "center",
  },
  refreshImageButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  ingredientCardText: {
    fontSize: 11,
    color: Colors.light.text,
    textAlign: "center",
    lineHeight: 14,
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
  videoPackSection: {
    marginBottom: 24,
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  videoPackHeader: {
    marginBottom: 16,
  },
  videoPackTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  videoPackTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  videoPackSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
    marginLeft: 28,
  },
  videoButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  generateVideoButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.coral,
    paddingVertical: 14,
    borderRadius: 14,
  },
  generateVideoButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800" as const,
  },
  videoAgentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.coralLight,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.coral,
  },
  videoAgentButtonText: {
    color: Colors.light.coral,
    fontSize: 14,
    fontWeight: "800" as const,
  },
  videoPackContent: {
    gap: 12,
  },
  videoPackCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
  },
  videoPackCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  videoPackCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.light.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  videoPackCardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  videoPackCardBadge: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  videoPackCardBody: {
    padding: 14,
    paddingTop: 0,
    gap: 10,
  },
  scriptItem: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  scriptTimecode: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.light.coral,
    width: 80,
  },
  scriptContent: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  storyboardShot: {
    backgroundColor: Colors.light.surface,
    borderRadius: 10,
    padding: 12,
  },
  shotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  shotNumber: {
    fontSize: 13,
    fontWeight: "800" as const,
    color: Colors.light.sapphire,
  },
  shotDuration: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shotAngle: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.light.gold,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  shotAction: {
    fontSize: 13,
    color: Colors.light.text,
    marginBottom: 8,
  },
  shotMeta: {
    gap: 4,
  },
  shotText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  shotSound: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  promptItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.light.surface,
    padding: 12,
    borderRadius: 10,
  },
  promptText: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.text,
    lineHeight: 18,
  },
  copyButton: {
    padding: 4,
  },
  heroPromptCard: {
    backgroundColor: Colors.light.coral + "15",
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.light.coral + "30",
  },
  heroPromptLabel: {
    fontSize: 12,
    fontWeight: "800" as const,
    color: Colors.light.coral,
    marginBottom: 8,
  },
  heroPromptText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 10,
  },
  copyButtonInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  copyText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.coral,
  },
  captionsLabel: {
    fontSize: 12,
    fontWeight: "800" as const,
    color: Colors.light.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  captionItem: {
    backgroundColor: Colors.light.surface,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.success,
  },
  captionText: {
    fontSize: 13,
    color: Colors.light.text,
  },
  ctaCard: {
    backgroundColor: Colors.light.tintLight,
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  ctaLabel: {
    fontSize: 10,
    fontWeight: "800" as const,
    color: Colors.light.tint,
    textTransform: "uppercase" as const,
    marginBottom: 4,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.tint,
  },
  hashtagsContainer: {
    marginTop: 12,
  },
  hashtagsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  hashtagsLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.sapphire,
  },
  hashtagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  hashtagChip: {
    backgroundColor: Colors.light.sapphire + "15",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hashtagText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.sapphire,
  },
  copyAllHashtags: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: Colors.light.sapphire + "10",
    borderRadius: 10,
  },
  copyAllText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.sapphire,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 40,
  },
});
