import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { generateObject } from "@rork-ai/toolkit-sdk";
import * as z from "zod";

import { recipes as baseRecipes, Recipe } from "@/mocks/recipes";

export type RecipeSource = "base" | "saved" | "virtual";

export type CoachRecipe = Recipe & {
  source: RecipeSource;
  fiberG?: number;
  sugarG?: number;
  proteinG?: number;
  fatG?: number;
  glycemicLoad?: number;
  skillLevel?: "easy" | "medium" | "advanced";
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

async function agentGenerateRecipe(input: { goal: string; preferences: string }): Promise<Omit<CoachRecipe, "id" | "image" | "source">> {
  const system = buildAgentSystemPrompt();
  const user =
    `Goal: ${input.goal || "blood sugar control"}\n` +
    `Preferences: ${input.preferences || "(none)"}\n` +
    "Constraints: no added sugar; limit refined carbs; include fiber; keep sodium reasonable. " +
    "Output must include calories, carbsPerServing, fiberG, sugarG, proteinG, fatG, glycemicLoad.";

  try {
    const res = await generateObject({
      messages: [
        { role: "assistant", content: system },
        { role: "user", content: user },
      ],
      schema: AgentRecipeSchema,
    });

    return {
      title: res.title,
      description: res.description,
      category: res.category,
      prepTime: res.prepTime,
      cookTime: res.cookTime,
      servings: res.servings,
      calories: res.calories,
      carbsPerServing: res.carbsPerServing,
      ingredients: res.ingredients,
      instructions: res.instructions,
      tags: res.tags,
      glycemicNotes: res.glycemicNotes,
      fiberG: res.fiberG,
      sugarG: res.sugarG,
      proteinG: res.proteinG,
      fatG: res.fatG,
      glycemicLoad: res.glycemicLoad,
      skillLevel: res.skillLevel,
      origin: "Dia",
    };
  } catch (e) {
    console.error("[recipes] agentGenerateRecipe: AI call failed; using offline fallback", { e });
    return localFallbackRecipe(input);
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

      const generated = await agentGenerateRecipe(input);
      if ((generated.origin ?? "").toLowerCase().includes("offline")) {
        setLastError("Dia is offline right now — I made a quick recipe anyway.");
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

      console.log("[recipes] createRecipeWithAgent:done", { id, title: full.title });
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

      try {
        const generated = await agentGenerateRecipe({
          goal: "blood sugar control",
          preferences: `Generate a full recipe based on this idea: ${existing.title}. Keep category: ${existing.category}.`,
        });

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

        console.log("[recipes] ensureFullRecipe:done", { id });
        return full;
      } catch (e) {
        console.error("[recipes] ensureFullRecipe:failed", { e });
        setLastError("Dia had trouble expanding this recipe. Please try again.");
        return existing;
      }
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
    }),
    [createRecipeWithAgent, deleteSavedRecipe, ensureFullRecipe, getPage, getRecipeById, isHydrating, lastError, savedRecipes],
  );

  return value;
});
