import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { generateObject } from "@rork-ai/toolkit-sdk";
import * as z from "zod";

import { recipes, Recipe } from "@/mocks/recipes";
import { DayMealPlan, MealItem, weeklyMealPlan as defaultWeeklyMealPlan } from "@/mocks/mealPlans";

export type MealSlot = "breakfast" | "morningSnack" | "lunch" | "afternoonSnack" | "dinner";

type MealPlanState = {
  weekPlan: DayMealPlan[];
  isHydrating: boolean;
  lastError: string | null;

  setMeal: (input: { dayName: string; slot: MealSlot; meal: MealItem }) => Promise<void>;
  setWeekPlan: (input: { weekPlan: DayMealPlan[] }) => Promise<void>;
  resetToDefault: () => Promise<void>;

  getCandidatesForSlot: (slot: MealSlot) => MealItem[];
  swapMealWithAgent: (input: { dayName: string; slot: MealSlot; preferencesText: string }) => Promise<void>;

  createPersonalPlanWithCoach: (input: {
    goal: string;
    cookingSkill: "easy" | "medium" | "advanced";
    cookingTimeMinutes: number;
    dietaryStyle: string;
    dislikesOrAllergies: string;
    targetCarbsPerDayG: number;
    notes: string;
  }) => Promise<void>;
};

const STORAGE_KEY = "diacare:meal_plan:v1" as const;

const QUICK_SNACKS: MealItem[] = [
  { id: "snk_almonds", name: "Handful of Almonds", calories: 80, carbs: 3, protein: 3 },
  { id: "snk_greek_yogurt", name: "Plain Greek Yogurt (3/4 cup)", calories: 120, carbs: 8, protein: 16 },
  { id: "snk_cottage", name: "Cottage Cheese (1/2 cup)", calories: 110, carbs: 5, protein: 14 },
  { id: "snk_hummus", name: "Cucumber + Hummus", calories: 100, carbs: 8, protein: 3 },
  { id: "snk_berries", name: "Mixed Berries (1 cup)", calories: 60, carbs: 14, protein: 1 },
  { id: "snk_eggs", name: "Hard Boiled Eggs (2)", calories: 140, carbs: 1, protein: 12 },
];

function pickSnackByName(name: string | undefined): MealItem | null {
  if (!name) return null;
  const needle = name.trim().toLowerCase();
  return QUICK_SNACKS.find((s) => s.name.trim().toLowerCase() === needle) ?? null;
}

function safeInt(n: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.round(n));
}


function normalizeMealItem(input: Partial<MealItem> & Pick<MealItem, "name" | "calories" | "carbs" | "protein">): MealItem {
  return {
    id: input.id ?? `meal_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    name: input.name,
    calories: input.calories,
    carbs: input.carbs,
    protein: input.protein,
    recipeId: input.recipeId,
  };
}

function recalcDayPlan(day: DayMealPlan): DayMealPlan {
  const totalCalories =
    day.breakfast.calories +
    day.morningSnack.calories +
    day.lunch.calories +
    day.afternoonSnack.calories +
    day.dinner.calories;

  const totalCarbs = day.breakfast.carbs + day.morningSnack.carbs + day.lunch.carbs + day.afternoonSnack.carbs + day.dinner.carbs;

  return {
    ...day,
    totalCalories,
    totalCarbs,
  };
}

function isSnackSlot(slot: MealSlot): boolean {
  return slot === "morningSnack" || slot === "afternoonSnack";
}

function slotToCategory(slot: MealSlot): Recipe["category"] | "snacks" {
  if (slot === "breakfast") return "breakfast";
  if (slot === "lunch") return "lunch";
  if (slot === "dinner") return "dinner";
  return "snacks";
}

function recipeToMealItem(r: Recipe, slot: MealSlot): MealItem {
  const proteinGuess = r.tags.includes("high-protein") ? 25 : Math.max(10, Math.round(r.calories / 20));
  return normalizeMealItem({
    id: `${slot}_recipe_${r.id}`,
    name: r.title,
    calories: r.calories,
    carbs: r.carbsPerServing,
    protein: proteinGuess,
    recipeId: r.id,
  });
}

function uniqueByName(items: MealItem[]): MealItem[] {
  const seen = new Set<string>();
  const out: MealItem[] = [];
  for (const item of items) {
    const key = item.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function buildCandidates(slot: MealSlot): MealItem[] {
  const category = slotToCategory(slot);
  if (category === "snacks") {
    const snackRecipes = recipes
      .filter((r) => r.category === "snacks")
      .slice(0, 12)
      .map((r) => recipeToMealItem(r, slot));

    return uniqueByName([...QUICK_SNACKS, ...snackRecipes]).slice(0, 16);
  }

  const fromRecipes = recipes
    .filter((r) => r.category === category)
    .slice(0, 30)
    .map((r) => recipeToMealItem(r, slot));

  return uniqueByName(fromRecipes).slice(0, 16);
}

const SwapSchema = z
  .object({
    recipeId: z.string().optional(),
    snackName: z.string().optional(),
    justification: z.string().min(1).max(280),
  })
  .strict();

const CoachPlanSchema = z
  .object({
    days: z
      .array(
        z
          .object({
            dayName: z.string().min(1),
            breakfastRecipeId: z.string().optional(),
            morningSnackRecipeId: z.string().optional(),
            morningSnackName: z.string().optional(),
            lunchRecipeId: z.string().optional(),
            afternoonSnackRecipeId: z.string().optional(),
            afternoonSnackName: z.string().optional(),
            dinnerRecipeId: z.string().optional(),
          })
          .strict(),
      )
      .min(7)
      .max(7),
    summary: z.string().min(1).max(320),
  })
  .strict();


async function agentPickSwap(input: {
  slot: MealSlot;
  currentMealName: string;
  preferencesText: string;
  candidates: MealItem[];
}): Promise<{ picked: MealItem; justification: string }> {
  const category = slotToCategory(input.slot);

  const candidatesForPrompt = input.candidates.map((c) => ({
    id: c.recipeId ?? c.id,
    name: c.name,
    calories: c.calories,
    carbs: c.carbs,
    protein: c.protein,
    type: c.recipeId ? "recipe" : "simple_snack",
  }));

  const system =
    "You are a diabetes lifestyle coach that helps users swap meals to match preferences while staying diabetes-friendly: no added sugar, low glycemic load, moderate carbs, high fiber, heart healthy (DASH/Mediterranean), low sodium, balanced macros. Pick ONE option from the provided candidates.";

  const user =
    `Task: Swap the user's ${category} to fit their preferences.\n` +
    `Current meal: ${input.currentMealName}\n` +
    `User preferences: ${input.preferencesText || "(none)"}\n` +
    `Candidates (pick exactly one): ${JSON.stringify(candidatesForPrompt)}\n` +
    `Rules: Pick an option with lower carbs when possible, prioritize higher fiber/protein, avoid added sugar, keep it realistic + easy to prep. Return recipeId if you picked a recipe, or snackName if you picked a simple snack name. Provide a short justification.`;

  const res = await generateObject({
    messages: [
      { role: "assistant", content: system },
      { role: "user", content: user },
    ],
    schema: SwapSchema,
  });

  const picked =
    (res.recipeId
      ? input.candidates.find((c) => (c.recipeId ?? "") === res.recipeId)
      : null) ??
    (res.snackName
      ? input.candidates.find((c) => c.name.trim().toLowerCase() === res.snackName?.trim().toLowerCase())
      : null) ??
    input.candidates[0];

  return { picked, justification: res.justification };
}

export const [MealPlanProvider, useMealPlan] = createContextHook<MealPlanState>(() => {
  const [weekPlan, setWeekPlan] = useState<DayMealPlan[]>(defaultWeeklyMealPlan);
  const [isHydrating, setIsHydrating] = useState<boolean>(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const hasHydratedOnceRef = useRef<boolean>(false);

  const hydrate = useCallback(async () => {
    if (hasHydratedOnceRef.current) return;
    hasHydratedOnceRef.current = true;

    setIsHydrating(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        console.log("[mealPlan] hydrate: no stored state");
        setWeekPlan(defaultWeeklyMealPlan);
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        console.warn("[mealPlan] hydrate: invalid stored shape; resetting");
        setWeekPlan(defaultWeeklyMealPlan);
        return;
      }

      const next = parsed as DayMealPlan[];
      console.log("[mealPlan] hydrate: loaded", { days: next.length });
      setWeekPlan(next);
    } catch (e) {
      console.error("[mealPlan] hydrate: failed", { e });
      setLastError("Could not load your meal plan. Resetting to default.");
      setWeekPlan(defaultWeeklyMealPlan);
    } finally {
      setIsHydrating(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const persist = useCallback(async (next: DayMealPlan[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      console.log("[mealPlan] persisted", { days: next.length });
    } catch (e) {
      console.error("[mealPlan] persist: failed", { e });
      setLastError("Could not save your changes. Please try again.");
    }
  }, []);

  const getCandidatesForSlot = useCallback((slot: MealSlot): MealItem[] => {
    return buildCandidates(slot);
  }, []);

  const setMeal = useCallback(
    async (input: { dayName: string; slot: MealSlot; meal: MealItem }) => {
      console.log("[mealPlan] setMeal", { dayName: input.dayName, slot: input.slot, meal: input.meal.name });

      setWeekPlan((prev) => {
        const next = prev.map((d) => {
          if (d.dayName !== input.dayName) return d;
          const updated: DayMealPlan = { ...d, [input.slot]: normalizeMealItem(input.meal) } as DayMealPlan;
          return recalcDayPlan(updated);
        });

        void persist(next);
        return next;
      });
    },
    [persist],
  );

  const setWeekPlanWhole = useCallback(
    async (input: { weekPlan: DayMealPlan[] }) => {
      console.log("[mealPlan] setWeekPlan", { days: input.weekPlan.length });
      setLastError(null);
      setWeekPlan(input.weekPlan);
      await persist(input.weekPlan);
    },
    [persist],
  );


  const resetToDefault = useCallback(async () => {
    console.log("[mealPlan] resetToDefault");
    setLastError(null);
    setWeekPlan(defaultWeeklyMealPlan);
    await persist(defaultWeeklyMealPlan);
  }, [persist]);

  const swapMealWithAgent = useCallback(
    async (input: { dayName: string; slot: MealSlot; preferencesText: string }) => {
      const candidates = buildCandidates(input.slot);

      const day = weekPlan.find((d) => d.dayName === input.dayName) ?? null;
      const currentMeal = day ? (day[input.slot] as MealItem) : null;
      const currentMealName = currentMeal?.name ?? "Unknown";

      console.log("[mealPlan] swapMealWithAgent:start", {
        dayName: input.dayName,
        slot: input.slot,
        currentMealName,
        preferencesText: input.preferencesText,
        candidates: candidates.length,
      });

      try {
        setLastError(null);
        const { picked, justification } = await agentPickSwap({
          slot: input.slot,
          currentMealName,
          preferencesText: input.preferencesText,
          candidates,
        });

        console.log("[mealPlan] swapMealWithAgent:result", {
          dayName: input.dayName,
          slot: input.slot,
          picked: picked.name,
          justification,
        });

        await setMeal({ dayName: input.dayName, slot: input.slot, meal: picked });
      } catch (e) {
        console.error("[mealPlan] swapMealWithAgent:failed", { e });

        const fallback = candidates[0] ??
          (isSnackSlot(input.slot)
            ? QUICK_SNACKS[0]
            : recipeToMealItem(recipes[0], input.slot));

        setLastError("Coach had trouble generating a swap. Picked a safe fallback you can change.");
        await setMeal({ dayName: input.dayName, slot: input.slot, meal: fallback });
      }
    },
    [setMeal, weekPlan],
  );

  const createPersonalPlanWithCoach = useCallback(
    async (input: {
      goal: string;
      cookingSkill: "easy" | "medium" | "advanced";
      cookingTimeMinutes: number;
      dietaryStyle: string;
      dislikesOrAllergies: string;
      targetCarbsPerDayG: number;
      notes: string;
    }) => {
      console.log("[mealPlan] createPersonalPlanWithCoach:start", input);

      const dayNames = weekPlan.map((d) => d.dayName);
      const breakfastPool = recipes.filter((r) => r.category === "breakfast").slice(0, 60).map((r) => ({ id: r.id, title: r.title, calories: r.calories, carbs: r.carbsPerServing, tags: r.tags }));
      const lunchPool = recipes.filter((r) => r.category === "lunch").slice(0, 60).map((r) => ({ id: r.id, title: r.title, calories: r.calories, carbs: r.carbsPerServing, tags: r.tags }));
      const dinnerPool = recipes.filter((r) => r.category === "dinner").slice(0, 60).map((r) => ({ id: r.id, title: r.title, calories: r.calories, carbs: r.carbsPerServing, tags: r.tags }));
      const snackPool = recipes.filter((r) => r.category === "snacks").slice(0, 60).map((r) => ({ id: r.id, title: r.title, calories: r.calories, carbs: r.carbsPerServing, tags: r.tags }));

      const system =
        "You are DiaCare Coach. Create a diabetes-friendly weekly meal plan (low glycemic load, no added sugars, moderate carbs, high fiber, heart healthy, low sodium, balanced macros). Pick recipes ONLY from the provided pools. For snack slots, you may choose a snack recipeId OR a simple snackName from the provided snackNames. Keep prep simple and align with user's goal and cooking constraints.";

      const user =
        `User goal: ${input.goal}\n` +
        `Cooking skill: ${input.cookingSkill}\n` +
        `Max cooking time per meal: ${safeInt(input.cookingTimeMinutes, 20)} minutes\n` +
        `Dietary style: ${input.dietaryStyle || "(none)"}\n` +
        `Dislikes/allergies: ${input.dislikesOrAllergies || "(none)"}\n` +
        `Target carbs/day: ${safeInt(input.targetCarbsPerDayG, 120)}g\n` +
        `Other notes: ${input.notes || "(none)"}\n` +
        `Days: ${JSON.stringify(dayNames)}\n` +
        `Breakfast pool: ${JSON.stringify(breakfastPool)}\n` +
        `Lunch pool: ${JSON.stringify(lunchPool)}\n` +
        `Dinner pool: ${JSON.stringify(dinnerPool)}\n` +
        `Snack recipe pool: ${JSON.stringify(snackPool)}\n` +
        `Snack names: ${JSON.stringify(QUICK_SNACKS.map((s) => s.name))}\n` +
        "Rules: Use variety across the week. Avoid repeating the same dinner more than 2x. Prefer lower carbs for snacks. Return exactly 7 days.";

      try {
        setLastError(null);
        const res = await generateObject({
          messages: [
            { role: "assistant", content: system },
            { role: "user", content: user },
          ],
          schema: CoachPlanSchema,
        });

        console.log("[mealPlan] createPersonalPlanWithCoach:generated", { summary: res.summary, days: res.days.length });

        const nextWeek = weekPlan.map((d) => {
          const pick = res.days.find((x) => x.dayName === d.dayName) ?? null;
          if (!pick) return d;

          const breakfastRecipe = recipes.find((r) => r.id === pick.breakfastRecipeId) ?? null;
          const lunchRecipe = recipes.find((r) => r.id === pick.lunchRecipeId) ?? null;
          const dinnerRecipe = recipes.find((r) => r.id === pick.dinnerRecipeId) ?? null;

          const msRecipe = recipes.find((r) => r.id === pick.morningSnackRecipeId) ?? null;
          const asRecipe = recipes.find((r) => r.id === pick.afternoonSnackRecipeId) ?? null;

          const msSnack = pickSnackByName(pick.morningSnackName);
          const asSnack = pickSnackByName(pick.afternoonSnackName);

          const breakfast = breakfastRecipe ? recipeToMealItem(breakfastRecipe, "breakfast") : d.breakfast;
          const lunch = lunchRecipe ? recipeToMealItem(lunchRecipe, "lunch") : d.lunch;
          const dinner = dinnerRecipe ? recipeToMealItem(dinnerRecipe, "dinner") : d.dinner;

          const morningSnack = msRecipe ? recipeToMealItem(msRecipe, "morningSnack") : (msSnack ? normalizeMealItem(msSnack) : d.morningSnack);
          const afternoonSnack = asRecipe ? recipeToMealItem(asRecipe, "afternoonSnack") : (asSnack ? normalizeMealItem(asSnack) : d.afternoonSnack);

          const updated: DayMealPlan = {
            ...d,
            breakfast,
            morningSnack,
            lunch,
            afternoonSnack,
            dinner,
          };

          return recalcDayPlan(updated);
        });

        await setWeekPlanWhole({ weekPlan: nextWeek });
      } catch (e) {
        console.error("[mealPlan] createPersonalPlanWithCoach:failed", { e });
        setLastError("Coach couldn't build a plan right now. Please try again.");
        throw e;
      }
    },
    [setWeekPlanWhole, weekPlan],
  );

  const value = useMemo<MealPlanState>(
    () => ({
      weekPlan,
      isHydrating,
      lastError,
      setMeal,
      setWeekPlan: setWeekPlanWhole,
      resetToDefault,
      getCandidatesForSlot,
      swapMealWithAgent,
      createPersonalPlanWithCoach,
    }),
    [createPersonalPlanWithCoach, getCandidatesForSlot, isHydrating, lastError, resetToDefault, setMeal, setWeekPlanWhole, swapMealWithAgent, weekPlan],
  );

  return value;
});
