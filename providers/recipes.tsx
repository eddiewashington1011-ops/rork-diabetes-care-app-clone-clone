import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { generateObject } from "@rork-ai/toolkit-sdk";
import * as z from "zod";

import { recipes as baseRecipes, Recipe, ShortVideoPack } from "@/mocks/recipes";

export type RecipeSource = "base" | "saved" | "virtual";

export type CoachRecipe = Recipe & {
  source: RecipeSource;
  fiberG?: number;
  sugarG?: number;
  proteinG?: number;
  fatG?: number;
  glycemicLoad?: number;
  skillLevel?: "easy" | "medium" | "advanced";
  shortVideoPack?: ShortVideoPack;
};

type GetRecipesInput = {
  categoryId: string;
  query: string;
  offset: number;
  limit: number;
};

type RecipesState = {
  totalVirtualCount: number;
  savedRecipes: CoachRecipe[];
  isHydrating: boolean;
  lastError: string | null;

  getPage: (input: GetRecipesInput) => CoachRecipe[];
  getRecipeById: (id: string) => CoachRecipe | null;

  createRecipeWithAgent: (input: { goal: string; preferences: string }) => Promise<CoachRecipe>;
  ensureFullRecipe: (id: string) => Promise<CoachRecipe | null>;
  deleteSavedRecipe: (id: string) => Promise<void>;
  generateVideoPack: (id: string) => Promise<ShortVideoPack | null>;
};

const STORAGE_KEY = "diacare:saved_recipes:v1" as const;

const TOTAL_VIRTUAL = 8000;

const CATEGORIES = ["breakfast", "lunch", "dinner", "snacks", "desserts", "teas"] as const;

type CategoryId = (typeof CATEGORIES)[number];

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function hash32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)] as T;
}

function toCategoryFromIndex(index: number): CategoryId {
  const idx = index % CATEGORIES.length;
  return CATEGORIES[idx] ?? "dinner";
}

function buildVirtualId(index: number): string {
  return `v_${String(index).padStart(5, "0")}`;
}

function unsplashFor(id: string, keyword: string): string {
  const sig = hash32(id) % 1000;
  const q = encodeURIComponent(keyword);
  return `https://source.unsplash.com/featured/800x600?${q}&sig=${sig}`;
}

function virtualStub(index: number): CoachRecipe {
  const id = buildVirtualId(index);
  const rng = mulberry32(hash32(id));
  const category = toCategoryFromIndex(index);

  const adjectives = [
    "Glucose-Steady",
    "Mediterranean",
    "Fiber-Forward",
    "Protein-Packed",
    "Low-GI",
    "Heart-Healthy",
    "Zesty",
    "Crisp",
    "Cozy",
    "Fresh",
    "Smoky",
    "Herby",
  ] as const;

  const mains = [
    "Salmon",
    "Chicken",
    "Turkey",
    "Lentil",
    "Chickpea",
    "Tofu",
    "Greek Yogurt",
    "Egg",
    "Shrimp",
    "Cauliflower",
    "Quinoa",
    "Mushroom",
    "Zucchini",
    "Berry",
  ] as const;

  const styles = [
    "Bowl",
    "Skillet",
    "Sheet Pan",
    "Salad",
    "Soup",
    "Wraps",
    "Stir-Fry",
    "Bake",
    "Tacos",
    "Parfait",
    "Smoothie",
    "Tea",
  ] as const;

  const tagPool = [
    "no-added-sugar",
    "high-fiber",
    "heart-healthy",
    "dash",
    "mediterranean",
    "low-sodium",
    "meal-prep",
    "high-protein",
    "plant-forward",
    "gluten-free",
    "keto-friendly",
  ] as const;

  const adj = pick(rng, adjectives);
  const main = pick(rng, mains);
  const style = category === "teas" ? "Tea" : pick(rng, styles);

  const title = `${adj} ${main} ${style}`.replace(/\s+/g, " ").trim();
  const description =
    "Diabetes-friendly, no added sugar, balanced macros — designed to keep spikes calm without feeling restrictive.";

  const prepTime = clampInt(5 + rng() * 20, 5, 35);
  const cookTime = category === "teas" ? clampInt(0 + rng() * 12, 0, 15) : clampInt(6 + rng() * 28, 6, 45);
  const servings = clampInt(1 + rng() * 3, 1, 4);

  const caloriesBase = category === "snacks" || category === "teas" ? 80 : category === "breakfast" ? 320 : 420;
  const calories = clampInt(caloriesBase + (rng() - 0.5) * 180, 10, 820);

  const carbsBase = category === "teas" ? 0 : category === "desserts" ? 18 : category === "snacks" ? 10 : 24;
  const carbsPerServing = clampInt(carbsBase + (rng() - 0.5) * 14, 0, 60);

  const proteinG = clampInt(10 + rng() * 30, 0, 55);
  const fatG = clampInt(6 + rng() * 22, 0, 40);
  const fiberG = clampInt(4 + rng() * 10, 0, 18);
  const sugarG = clampInt(0 + rng() * 7, 0, 18);
  const glycemicLoad = clampInt(Math.max(1, Math.round((carbsPerServing - fiberG) * 0.4)), 1, 30);

  const skillLevel: NonNullable<CoachRecipe["skillLevel"]> = rng() < 0.6 ? "easy" : rng() < 0.9 ? "medium" : "advanced";

  const tags = Array.from({ length: 4 })
    .map(() => pick(rng, tagPool))
    .filter((t, i, arr) => arr.indexOf(t) === i);

  const imageKeyword = category === "teas" ? "tea" : category === "desserts" ? "healthy dessert" : title;

  return {
    id,
    source: "virtual",
    title,
    description,
    image: unsplashFor(id, imageKeyword),
    prepTime,
    cookTime,
    servings,
    calories,
    carbsPerServing,
    category,
    ingredients: ["Tap ‘Generate full recipe’ to get ingredients + steps."],
    instructions: ["This recipe is a preview. Generate the full version to cook it."],
    tags,
    fiberG,
    sugarG,
    proteinG,
    fatG,
    glycemicLoad,
    skillLevel,
    origin: "DiaCare Virtual Cookbook",
    glycemicNotes: [
      "No added sugars; focus on fiber + protein.",
      "Adjust portions to match your carb target.",
    ],
  };
}

function asCoachRecipeFromBase(r: Recipe): CoachRecipe {
  const seed = hash32(r.id);
  const rng = mulberry32(seed);

  const proteinG = clampInt(r.tags.includes("high-protein") ? 28 : 16 + rng() * 18, 0, 60);
  const fatG = clampInt(8 + rng() * 18, 0, 45);
  const fiberG = clampInt(r.tags.includes("fiber") || r.tags.includes("high-fiber") ? 10 : 4 + rng() * 8, 0, 18);
  const sugarG = clampInt(r.category === "desserts" ? 8 + rng() * 10 : 1 + rng() * 6, 0, 20);
  const glycemicLoad = clampInt(Math.max(1, Math.round((r.carbsPerServing - fiberG) * 0.4)), 1, 30);

  return {
    ...r,
    source: "base",
    fiberG,
    sugarG,
    proteinG,
    fatG,
    glycemicLoad,
    skillLevel: "easy",
  };
}

const AgentRecipeSchema = z
  .object({
    title: z.string().min(4).max(80),
    description: z.string().min(10).max(220),
    category: z.enum(["breakfast", "lunch", "dinner", "snacks", "desserts", "teas"]),
    prepTime: z.number().int().min(0).max(90),
    cookTime: z.number().int().min(0).max(180),
    servings: z.number().int().min(1).max(8),
    calories: z.number().int().min(0).max(1200),
    carbsPerServing: z.number().int().min(0).max(120),
    fiberG: z.number().int().min(0).max(40),
    sugarG: z.number().int().min(0).max(40),
    proteinG: z.number().int().min(0).max(90),
    fatG: z.number().int().min(0).max(90),
    glycemicLoad: z.number().int().min(0).max(50),
    skillLevel: z.enum(["easy", "medium", "advanced"]),
    tags: z.array(z.string().min(2).max(24)).min(3).max(10),
    ingredients: z.array(z.string().min(2).max(120)).min(6).max(20),
    instructions: z.array(z.string().min(4).max(240)).min(6).max(16),
    glycemicNotes: z.array(z.string().min(4).max(180)).min(2).max(6),
  })
  .strict();

const VideoPackSchema = z.object({
  videoScript: z.array(z.object({
    timecode: z.string().describe("Time range like [00:00-00:03]"),
    content: z.string().describe("What happens or is shown during this time"),
  })).min(6).max(12),
  verticalStoryboard: z.array(z.object({
    shotNumber: z.number().int().min(1).max(12),
    duration: z.string().describe("Duration like 2-3s"),
    angle: z.string().describe("Camera angle: overhead, close-up, slow pan, hand-held"),
    action: z.string().describe("What is being shown"),
    onScreenText: z.string().describe("Text overlay for the shot"),
    soundCue: z.string().describe("Sound: sizzle, chop, pour, music hit, etc."),
  })).min(8).max(12),
  videoGenerationPrompts: z.array(z.string().min(50).max(400)).min(8).max(12),
  finalHeroShotPrompt: z.string().min(80).max(500),
  autoCaptions: z.array(z.string().min(10).max(60)).min(5).max(8),
  cta: z.string().min(10).max(60),
  hashtags: z.array(z.string().min(3).max(30)).min(5).max(10),
});

function buildVideoPackPrompt(): string {
  return (
    "You are an expert short-form video content creator specializing in diabetes-friendly cooking content for TikTok, Instagram Reels, and YouTube Shorts. " +
    "Create engaging 30-60 second vertical video scripts (9:16 aspect ratio) that are fast-paced, visually appetizing, and educational. " +
    "Rules: Front-load visual appeal in first 3 seconds. Never show raw sugar, soda, candy, white bread. Always display net carbs, protein, fiber. " +
    "Use food porn cinematography. Assume viewer attention span = 1.5 seconds. Make diabetes food look BETTER than restaurant food. " +
    "Video prompts must be suitable for AI video generators like Runway, Pika, Sora, Luma."
  );
}

function buildFallbackVideoPack(recipe: CoachRecipe): ShortVideoPack {
  return {
    videoScript: [
      { timecode: "[00:00-00:03]", content: `Hook: Show the finished ${recipe.title} in a stunning hero shot` },
      { timecode: "[00:03-00:08]", content: "Display ingredients spread across counter with text overlay showing nutrition" },
      { timecode: "[00:08-00:15]", content: "Quick cuts of prep work - chopping, measuring, mixing" },
      { timecode: "[00:15-00:25]", content: "Main cooking action with sizzling sounds and steam" },
      { timecode: "[00:25-00:35]", content: "Plating the dish with garnishes" },
      { timecode: "[00:35-00:45]", content: "Final reveal with fork/bite shot and nutrition facts overlay" },
    ],
    verticalStoryboard: [
      { shotNumber: 1, duration: "2-3s", angle: "overhead", action: "Hero shot of finished dish", onScreenText: recipe.title, soundCue: "Music hit" },
      { shotNumber: 2, duration: "3-4s", angle: "slow pan", action: "Ingredients spread out", onScreenText: `${recipe.carbsPerServing}g carbs per serving`, soundCue: "Upbeat music" },
      { shotNumber: 3, duration: "2-3s", angle: "close-up", action: "Chopping vegetables", onScreenText: "Fresh ingredients", soundCue: "Chopping sounds" },
      { shotNumber: 4, duration: "3-4s", angle: "eye-level", action: "Adding to pan", onScreenText: "Diabetes-friendly", soundCue: "Sizzle" },
      { shotNumber: 5, duration: "2-3s", angle: "close-up", action: "Stirring/cooking", onScreenText: "No added sugar", soundCue: "Cooking sounds" },
      { shotNumber: 6, duration: "3-4s", angle: "overhead", action: "Plating the dish", onScreenText: `${recipe.calories} calories`, soundCue: "Music build" },
      { shotNumber: 7, duration: "2-3s", angle: "45-degree", action: "Adding garnish", onScreenText: "High fiber", soundCue: "Soft placement" },
      { shotNumber: 8, duration: "3-4s", angle: "close-up", action: "Fork taking bite", onScreenText: "Try this recipe!", soundCue: "Music finale" },
    ],
    videoGenerationPrompts: [
      `Cinematic overhead shot of ${recipe.title}, steam rising, professional food photography lighting, 9:16 vertical format`,
      `Fresh ingredients spread on marble counter, ${recipe.ingredients.slice(0, 3).join(", ")}, soft natural lighting, vertical format`,
      `Close-up of hands chopping vegetables on wooden cutting board, shallow depth of field, satisfying cooking video style`,
      `Eye-level shot of ingredients being added to hot pan, steam and sizzle visible, dramatic kitchen lighting`,
      `Close-up of wooden spoon stirring in pan, steam rising, warm color tones, professional food video`,
      `Overhead view of plating food onto white ceramic dish, careful precise movements, clean background`,
      `45-degree angle of garnishing dish with fresh herbs, soft focus background, restaurant quality presentation`,
      `Macro close-up of fork lifting perfect bite, steam visible, slow motion feel, appetizing food porn aesthetic`,
    ],
    finalHeroShotPrompt: `Professional food photography of ${recipe.title}, perfectly plated on elegant dish, soft diffused lighting from side, shallow depth of field with blurred background, garnished with fresh herbs, steam gently rising, warm inviting color palette, 9:16 vertical aspect ratio, restaurant quality presentation, makes viewer hungry`,
    autoCaptions: [
      `${recipe.title} - only ${recipe.carbsPerServing}g carbs!`,
      "Perfect for blood sugar control",
      "No added sugars in this recipe",
      `${recipe.calories} calories per serving`,
      `Ready in ${recipe.prepTime + recipe.cookTime} minutes`,
      "Diabetes-friendly comfort food",
    ],
    cta: "Save this recipe and follow for more diabetes-friendly meals!",
    hashtags: ["#diabetesfriendly", "#lowcarb", "#healthyrecipes", "#bloodsugar", "#diabetesawareness", "#healthyeating", "#mealprep", "#lowgi"],
  };
}

async function agentGenerateVideoPack(recipe: CoachRecipe): Promise<{ videoPack: ShortVideoPack; isOffline: boolean; errorMessage?: string }> {
  const system = buildVideoPackPrompt();
  const userPrompt =
    `${system}\n\n` +
    `Recipe: ${recipe.title}\n` +
    `Description: ${recipe.description}\n` +
    `Category: ${recipe.category}\n` +
    `Nutrition: ${recipe.calories} cal, ${recipe.carbsPerServing}g carbs, ${recipe.proteinG ?? 0}g protein, ${recipe.fiberG ?? 0}g fiber\n` +
    `Ingredients: ${recipe.ingredients.slice(0, 8).join(", ")}\n` +
    `Instructions: ${recipe.instructions.slice(0, 6).join(". ")}\n\n` +
    "Generate a complete SHORT VIDEO PACK for this diabetes-friendly recipe. " +
    "Include: videoScript (time-coded 30-60s), verticalStoryboard (8-12 shots), videoGenerationPrompts (one per shot for AI video tools), " +
    "finalHeroShotPrompt (cinematic food shot), autoCaptions (5-8 educational captions), cta, and hashtags.";

  console.log("[recipes] agentGenerateVideoPack: calling generateObject", { title: recipe.title });

  try {
    const res = await generateObject({
      messages: [{ role: "user", content: userPrompt }],
      schema: VideoPackSchema,
    });

    console.log("[recipes] agentGenerateVideoPack: got response", { shots: res.verticalStoryboard.length });

    return {
      videoPack: {
        videoScript: res.videoScript,
        verticalStoryboard: res.verticalStoryboard,
        videoGenerationPrompts: res.videoGenerationPrompts,
        finalHeroShotPrompt: res.finalHeroShotPrompt,
        autoCaptions: res.autoCaptions,
        cta: res.cta,
        hashtags: res.hashtags,
      },
      isOffline: false,
    };
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    const isOffline = isNetworkOrOfflineError(errorMessage);
    console.error("[recipes] agentGenerateVideoPack: AI call failed; using fallback", { error: errorMessage, isOffline });
    return {
      videoPack: buildFallbackVideoPack(recipe),
      isOffline: true,
      errorMessage: isOffline ? "Dia is offline" : errorMessage,
    };
  }
}

function buildAgentSystemPrompt(): string {
  return (
    "You are Dia — a friendly diabetes lifestyle coach inside a mobile health app. You sound like a supportive best friend: warm, encouraging, and plain-spoken (not clinical). " +
    "Your job is to help the user cook meals that feel normal and satisfying while staying diabetes-friendly. " +
    "Food rules: low glycemic load, no added sugar, moderate carbs, high fiber, heart-healthy (DASH/Mediterranean), reasonable sodium, balanced macros. " +
    "Write realistic home-cooking recipes with simple steps, smart substitutions, and quick tips that explain why it’s blood-sugar friendly. " +
    "Always include complete nutrition facts and an estimated glycemic load."
  );
}

function localFallbackRecipe(input: { goal: string; preferences: string }): Omit<CoachRecipe, "id" | "image" | "source"> {
  const seed = hash32(`${input.goal}::${input.preferences}`);
  const rng = mulberry32(seed);

  const category = pick(rng, CATEGORIES);
  const titleBase = virtualStub(clampInt(seed % TOTAL_VIRTUAL, 0, TOTAL_VIRTUAL - 1)).title;
  const prefs = input.preferences.trim();
  const title = prefs.length > 0 ? `${titleBase} (${prefs.slice(0, 32)})` : titleBase;

  const calories = clampInt(280 + rng() * 420, 120, 980);
  const carbsPerServing = clampInt(12 + rng() * 34, 0, 80);
  const fiberG = clampInt(6 + rng() * 10, 0, 30);
  const sugarG = clampInt(1 + rng() * 6, 0, 20);
  const proteinG = clampInt(18 + rng() * 28, 0, 75);
  const fatG = clampInt(8 + rng() * 20, 0, 55);
  const glycemicLoad = clampInt(Math.max(1, Math.round((carbsPerServing - fiberG) * 0.5)), 1, 40);

  const description =
    "A cozy, diabetes-friendly recipe with balanced carbs + protein to help keep glucose steady — without sacrificing flavor.";

  const tags = ["no-added-sugar", "high-fiber", "high-protein", "mediterranean", "meal-prep"].slice(
    0,
    clampInt(3 + rng() * 3, 3, 6),
  );

  const ingredients = [
    "1 cup non-starchy veggies (spinach, peppers, zucchini)",
    "1 tbsp extra-virgin olive oil",
    "1/2 cup cooked high-fiber base (lentils/quinoa/beans)",
    "4–6 oz lean protein (chicken, tofu, salmon)",
    "1 tbsp lemon juice or vinegar",
    "Herbs + spices (garlic, paprika, black pepper)",
    "Salt (light) + optional chili flakes",
  ];

  const instructions = [
    "Prep your veggies and protein; pat protein dry for better browning.",
    "Warm olive oil in a pan over medium heat; sauté veggies 4–6 minutes until tender-crisp.",
    "Add protein and spices; cook until done (or warmed through if pre-cooked).",
    "Stir in the high-fiber base; splash with lemon/vinegar to brighten.",
    "Taste and adjust with herbs, pepper, and a small pinch of salt.",
    "Serve with extra veggies on the side to keep the meal volume high and the carbs steady.",
  ];

  const glycemicNotes = [
    "Fiber slows carb absorption — keep the veggie + legumes generous.",
    "Protein + healthy fats can soften glucose spikes.",
    "If you’re sensitive to carbs, reduce the grain/beans portion and add more vegetables.",
  ];

  const skillLevel: NonNullable<CoachRecipe["skillLevel"]> = rng() < 0.7 ? "easy" : rng() < 0.92 ? "medium" : "advanced";

  return {
    title,
    description,
    category,
    prepTime: clampInt(8 + rng() * 14, 0, 45),
    cookTime: clampInt(10 + rng() * 22, 0, 60),
    servings: clampInt(1 + rng() * 3, 1, 6),
    calories,
    carbsPerServing,
    fiberG,
    sugarG,
    proteinG,
    fatG,
    glycemicLoad,
    skillLevel,
    tags,
    ingredients,
    instructions,
    glycemicNotes,
    origin: "Dia (offline)",
  };
}

function isNetworkOrOfflineError(error: string): boolean {
  const lowerError = error.toLowerCase();
  const offlinePatterns = [
    "offline",
    "network",
    "fetch",
    "timeout",
    "err_ngrok",
    "econnrefused",
    "enotfound",
    "socket",
    "connection",
    "unreachable",
    "failed to fetch",
    "load failed",
    "net::",
    "cors",
    "aborted",
  ];
  return offlinePatterns.some((p) => lowerError.includes(p));
}

async function agentGenerateRecipe(input: { goal: string; preferences: string }): Promise<{ recipe: Omit<CoachRecipe, "id" | "image" | "source">; isOffline: boolean; errorMessage?: string }> {
  console.log("[recipes] agentGenerateRecipe: starting", { goal: input.goal, prefsLen: input.preferences.length });
  
  const system = buildAgentSystemPrompt();
  
  const hasPreferences = input.preferences.trim().length > 0;
  const preferencesInstruction = hasPreferences
    ? `IMPORTANT - User's specific request: "${input.preferences}". You MUST create a recipe that matches this request exactly. If they ask for fish, use fish. If they ask for chicken, use chicken. If they want vegetarian, make it vegetarian. Their request is the top priority.`
    : "No specific preferences provided.";

  const userPrompt =
    `${system}\n\n` +
    `Goal: ${input.goal || "blood sugar control"}\n\n` +
    `${preferencesInstruction}\n\n` +
    "Constraints: no added sugar; limit refined carbs; include fiber; keep sodium reasonable. " +
    "IMPORTANT: Keep description under 180 characters (2 short sentences max). " +
    "Output must include calories, carbsPerServing, fiberG, sugarG, proteinG, fatG, glycemicLoad. " +
    "Generate a complete diabetes-friendly recipe that EXACTLY matches the user's request now.";

  console.log("[recipes] agentGenerateRecipe: calling generateObject");

  try {
    const res = await generateObject({
      messages: [
        { role: "user", content: userPrompt },
      ],
      schema: AgentRecipeSchema,
    });

    console.log("[recipes] agentGenerateRecipe: got response", { title: res?.title });

    if (!res || !res.title) {
      console.error("[recipes] agentGenerateRecipe: invalid response, using fallback");
      return {
        recipe: localFallbackRecipe(input),
        isOffline: true,
        errorMessage: "Invalid response from AI",
      };
    }

    return {
      recipe: {
        title: res.title.slice(0, 80),
        description: (res.description ?? "A delicious diabetes-friendly recipe.").slice(0, 220),
        category: res.category ?? "dinner",
        prepTime: res.prepTime ?? 15,
        cookTime: res.cookTime ?? 20,
        servings: res.servings ?? 2,
        calories: res.calories ?? 350,
        carbsPerServing: res.carbsPerServing ?? 25,
        ingredients: res.ingredients ?? ["See full recipe"],
        instructions: res.instructions ?? ["Follow the recipe steps"],
        tags: res.tags ?? ["diabetes-friendly"],
        glycemicNotes: res.glycemicNotes ?? ["Low glycemic load"],
        fiberG: res.fiberG ?? 5,
        sugarG: res.sugarG ?? 3,
        proteinG: res.proteinG ?? 20,
        fatG: res.fatG ?? 12,
        glycemicLoad: res.glycemicLoad ?? 10,
        skillLevel: res.skillLevel ?? "easy",
        origin: "Dia",
      },
      isOffline: false,
    };
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    const isOffline = isNetworkOrOfflineError(errorMessage);
    console.error("[recipes] agentGenerateRecipe: AI call failed; using offline fallback", { error: errorMessage, isOffline });
    return {
      recipe: localFallbackRecipe(input),
      isOffline: true,
      errorMessage: isOffline ? "Dia is offline" : errorMessage,
    };
  }
}

export const [RecipesProvider, useRecipes] = createContextHook<RecipesState>(() => {
  const [savedRecipes, setSavedRecipes] = useState<CoachRecipe[]>([]);
  const [isHydrating, setIsHydrating] = useState<boolean>(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const hydratedOnceRef = useRef<boolean>(false);

  const base = useMemo<CoachRecipe[]>(() => baseRecipes.map(asCoachRecipeFromBase), []);

  const hydrate = useCallback(async () => {
    if (hydratedOnceRef.current) return;
    hydratedOnceRef.current = true;

    setIsHydrating(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        console.log("[recipes] hydrate: no saved recipes");
        setSavedRecipes([]);
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        console.warn("[recipes] hydrate: invalid shape; resetting");
        setSavedRecipes([]);
        return;
      }

      const next = parsed as CoachRecipe[];
      console.log("[recipes] hydrate: loaded", { count: next.length });
      setSavedRecipes(next);
    } catch (e) {
      console.error("[recipes] hydrate: failed", { e });
      setLastError("Could not load your saved recipes.");
      setSavedRecipes([]);
    } finally {
      setIsHydrating(false);
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const persist = useCallback(async (next: CoachRecipe[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      console.log("[recipes] persisted", { count: next.length });
    } catch (e) {
      console.error("[recipes] persist: failed", { e });
      setLastError("Could not save recipe changes. Please try again.");
    }
  }, []);

  const getRecipeById = useCallback(
    (id: string): CoachRecipe | null => {
      const fromSaved = savedRecipes.find((r) => r.id === id) ?? null;
      if (fromSaved) return fromSaved;

      const fromBase = base.find((r) => r.id === id) ?? null;
      if (fromBase) return fromBase;

      if (id.startsWith("v_")) {
        const n = Number(id.replace("v_", ""));
        if (!Number.isFinite(n)) return null;
        const index = clampInt(n, 0, TOTAL_VIRTUAL - 1);
        return virtualStub(index);
      }

      return null;
    },
    [base, savedRecipes],
  );

  const getPage = useCallback(
    (input: GetRecipesInput): CoachRecipe[] => {
      const q = input.query.trim().toLowerCase();

      const matchText = (r: CoachRecipe): boolean => {
        if (q.length === 0) return true;
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (r.origin ?? "").toLowerCase().includes(q) ||
          (r.tags ?? []).some((t) => t.toLowerCase().includes(q))
        );
      };

      const matchCategory = (r: CoachRecipe): boolean => {
        const categoryId = input.categoryId;
        if (categoryId === "all") return true;
        if (categoryId === "world-best") return r.tags.includes("world-best");
        if (categoryId === "teas") return r.category === "teas";
        return r.category === categoryId;
      };

      const baseAndSaved = [...savedRecipes, ...base].filter((r) => matchCategory(r) && matchText(r));

      const limit = clampInt(input.limit, 1, 80);
      const offset = clampInt(input.offset, 0, 100000);

      const virtualNeeded = Math.max(0, limit - baseAndSaved.length);
      const virtualStart = offset;

      const virtual: CoachRecipe[] = [];
      if (virtualNeeded > 0) {
        let i = virtualStart;
        while (virtual.length < virtualNeeded && i < TOTAL_VIRTUAL) {
          const stub = virtualStub(i);
          const okCategory = matchCategory(stub);
          const okQuery = q.length === 0 ? true : stub.title.toLowerCase().includes(q);
          if (okCategory && okQuery) {
            virtual.push(stub);
          }
          i += 1;
        }
      }

      return [...baseAndSaved.slice(offset, offset + limit), ...virtual].slice(0, limit);
    },
    [base, savedRecipes],
  );

  const deleteSavedRecipe = useCallback(
    async (id: string) => {
      setSavedRecipes((prev) => {
        const next = prev.filter((r) => r.id !== id);
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  const createRecipeWithAgent = useCallback(
    async (input: { goal: string; preferences: string }) => {
      console.log("[recipes] createRecipeWithAgent:start", input);
      setLastError(null);

      const { recipe: generated, isOffline, errorMessage } = await agentGenerateRecipe(input);
      
      if (isOffline) {
        const msg = errorMessage 
          ? `Dia is offline (${errorMessage.slice(0, 60)}${errorMessage.length > 60 ? '...' : ''}) — I made a quick recipe anyway.`
          : "Dia is offline right now — I made a quick recipe anyway.";
        setLastError(msg);
        console.log("[recipes] createRecipeWithAgent: using offline fallback", { errorMessage });
      }

      const id = `ai_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const image = unsplashFor(id, generated.title);

      const full: CoachRecipe = {
        ...(generated as CoachRecipe),
        id,
        image,
        source: "saved",
      };

      setSavedRecipes((prev) => {
        const next = [full, ...prev];
        void persist(next);
        return next;
      });

      console.log("[recipes] createRecipeWithAgent:done", { id, title: full.title, isOffline });
      return full;
    },
    [persist],
  );

  const ensureFullRecipe = useCallback(
    async (id: string) => {
      const existing = getRecipeById(id);
      if (!existing) return null;
      if (existing.source !== "virtual") return existing;

      console.log("[recipes] ensureFullRecipe:start", { id, title: existing.title });
      setLastError(null);

      const { recipe: generated, isOffline, errorMessage } = await agentGenerateRecipe({
        goal: "blood sugar control",
        preferences: `Generate a full recipe based on this idea: ${existing.title}. Keep category: ${existing.category}.`,
      });

      if (isOffline) {
        const msg = errorMessage
          ? `Dia had trouble expanding this recipe (${errorMessage.slice(0, 40)}...). Using fallback.`
          : "Dia had trouble expanding this recipe. Using fallback.";
        setLastError(msg);
        console.log("[recipes] ensureFullRecipe: using offline fallback", { errorMessage });
      }

      const full: CoachRecipe = {
        ...(generated as CoachRecipe),
        id,
        image: existing.image,
        source: "saved",
      };

      setSavedRecipes((prev) => {
        const next = [full, ...prev.filter((r) => r.id !== id)];
        void persist(next);
        return next;
      });

      console.log("[recipes] ensureFullRecipe:done", { id, isOffline });
      return full;
    },
    [getRecipeById, persist],
  );

  const generateVideoPack = useCallback(
    async (id: string): Promise<ShortVideoPack | null> => {
      const recipe = getRecipeById(id);
      if (!recipe) {
        console.error("[recipes] generateVideoPack: recipe not found", { id });
        return null;
      }

      if (recipe.shortVideoPack) {
        console.log("[recipes] generateVideoPack: already has video pack", { id });
        return recipe.shortVideoPack;
      }

      console.log("[recipes] generateVideoPack:start", { id, title: recipe.title });
      setLastError(null);

      const { videoPack, isOffline, errorMessage } = await agentGenerateVideoPack(recipe);

      if (isOffline) {
        const msg = errorMessage
          ? `Dia had trouble generating video pack (${errorMessage.slice(0, 40)}${errorMessage.length > 40 ? '...' : ''}). Using fallback.`
          : "Dia had trouble generating video pack. Using fallback.";
        setLastError(msg);
        console.log("[recipes] generateVideoPack: using offline fallback", { errorMessage });
      }

      const updated: CoachRecipe = {
        ...recipe,
        shortVideoPack: videoPack,
        source: "saved",
      };

      setSavedRecipes((prev) => {
        const next = [updated, ...prev.filter((r) => r.id !== id)];
        void persist(next);
        return next;
      });

      console.log("[recipes] generateVideoPack:done", { id, isOffline });
      return videoPack;
    },
    [getRecipeById, persist],
  );

  const value = useMemo<RecipesState>(
    () => ({
      totalVirtualCount: TOTAL_VIRTUAL,
      savedRecipes,
      isHydrating,
      lastError,
      getPage,
      getRecipeById,
      createRecipeWithAgent,
      ensureFullRecipe,
      deleteSavedRecipe,
      generateVideoPack,
    }),
    [createRecipeWithAgent, deleteSavedRecipe, ensureFullRecipe, generateVideoPack, getPage, getRecipeById, isHydrating, lastError, savedRecipes],
  );

  return value;
});
