import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

import { recipes } from "@/mocks/recipes";
import type { Recipe } from "@/mocks/recipes";
import type { DayMealPlan, MealItem } from "@/mocks/mealPlans";
import { useMealPlan } from "@/providers/mealPlan";

export type GroceryStatus = "have" | "shop";

export type GrocerySectionId = "produce" | "proteins" | "grains" | "dairy" | "pantry" | "spices" | "other";

export type GroceryItem = {
  key: string;
  label: string;
  count: number;
  status: GroceryStatus;
  section: GrocerySectionId;
  source: "recipe" | "meal";
};

type GroceryListState = {
  items: GroceryItem[];
  sections: { id: GrocerySectionId; title: string; items: GroceryItem[] }[];
  isHydrating: boolean;
  lastError: string | null;
  servings: number;

  setServings: (count: number) => Promise<void>;
  setStatus: (input: { key: string; status: GroceryStatus }) => Promise<void>;
  toggleHave: (key: string) => Promise<void>;
  resetAllToShop: () => Promise<void>;
};

const STORAGE_KEY = "diacare:grocery_list:v1" as const;

type StoredState = {
  statuses: Record<string, GroceryStatus>;
  servings: number;
};

const SECTION_TITLES: Record<GrocerySectionId, string> = {
  produce: "Produce",
  proteins: "Proteins",
  grains: "Grains",
  dairy: "Dairy / Alternatives",
  pantry: "Pantry",
  spices: "Spices",
  other: "Other",
};

function safeTrim(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function normalizeKey(raw: string): string {
  return safeTrim(raw).toLowerCase();
}

function splitIngredientLine(line: string): { qtyPrefix: string | null; name: string } {
  const trimmed = safeTrim(line);
  const m = trimmed.match(/^([\d/.,\s]+\s?[a-zA-Z]+\b)?\s*(.+)$/);
  if (!m) return { qtyPrefix: null, name: trimmed };
  const prefix = m[1] ? safeTrim(m[1]) : null;
  const name = safeTrim(m[2] ?? trimmed);
  return { qtyPrefix: prefix, name };
}

function categorizeIngredient(name: string): GrocerySectionId {
  const s = normalizeKey(name);

  const spices = [
    "salt",
    "pepper",
    "cumin",
    "paprika",
    "cinnamon",
    "turmeric",
    "chili",
    "red pepper",
    "garlic powder",
    "onion powder",
    "oregano",
    "basil",
    "thyme",
    "dill",
    "rosemary",
    "parsley",
    "mint",
    "seasoning",
    "spice",
  ];
  if (spices.some((k) => s.includes(k))) return "spices";

  const produce = [
    "avocado",
    "tomato",
    "cucumber",
    "lettuce",
    "spinach",
    "kale",
    "broccoli",
    "cauliflower",
    "asparagus",
    "pepper",
    "onion",
    "garlic",
    "lemon",
    "lime",
    "berries",
    "apple",
    "banana",
    "carrot",
    "celery",
    "zucchini",
    "mushroom",
    "herb",
    "cilantro",
  ];
  if (produce.some((k) => s.includes(k))) return "produce";

  const proteins = ["chicken", "turkey", "salmon", "shrimp", "tuna", "egg", "eggs", "cod", "beef", "tofu", "tempeh", "beans", "lentil", "yogurt", "cottage", "cheese"];
  if (proteins.some((k) => s.includes(k))) return "proteins";

  const dairy = ["milk", "yogurt", "cheese", "feta", "mozzarella", "cottage", "almond milk", "oat milk", "soy milk"];
  if (dairy.some((k) => s.includes(k))) return "dairy";

  const grains = ["quinoa", "rice", "oats", "bread", "tortilla", "pasta", "barley", "couscous", "whole wheat", "grain"];
  if (grains.some((k) => s.includes(k))) return "grains";

  const pantry = ["olive oil", "oil", "vinegar", "mustard", "hummus", "nuts", "almonds", "walnuts", "pecans", "chia", "flax", "broth", "stock", "canned", "tomato sauce", "salsa", "peanut butter", "almond butter"];
  if (pantry.some((k) => s.includes(k))) return "pantry";

  return "other";
}

function pickMealItems(weekPlan: DayMealPlan[]): MealItem[] {
  const out: MealItem[] = [];
  for (const day of weekPlan) {
    out.push(day.breakfast, day.morningSnack, day.lunch, day.afternoonSnack, day.dinner);
  }
  return out;
}

function recipeById(id: string | undefined): Recipe | null {
  if (!id) return null;
  const found = recipes.find((r) => r.id === id) ?? null;
  return found;
}

function buildBaseItems(weekPlan: DayMealPlan[]): Omit<GroceryItem, "status">[] {
  const meals = pickMealItems(weekPlan);

  const counts = new Map<string, { label: string; count: number; section: GrocerySectionId; source: GroceryItem["source"] }>();

  for (const meal of meals) {
    const r = recipeById(meal.recipeId);
    if (r) {
      for (const line of r.ingredients) {
        const parsed = splitIngredientLine(line);
        const label = parsed.name;
        const key = normalizeKey(label);
        const section = categorizeIngredient(label);
        const prev = counts.get(key);
        if (prev) {
          counts.set(key, { ...prev, count: prev.count + 1 });
        } else {
          counts.set(key, { label, count: 1, section, source: "recipe" });
        }
      }
    } else {
      const label = safeTrim(meal.name);
      if (!label) continue;
      const key = normalizeKey(label);
      const section = "other" as const;
      const prev = counts.get(key);
      if (prev) {
        counts.set(key, { ...prev, count: prev.count + 1 });
      } else {
        counts.set(key, { label, count: 1, section, source: "meal" });
      }
    }
  }

  const out: Omit<GroceryItem, "status">[] = [];
  for (const [key, v] of counts.entries()) {
    out.push({ key, label: v.label, count: v.count, section: v.section, source: v.source });
  }

  out.sort((a, b) => {
    if (a.section !== b.section) return a.section.localeCompare(b.section);
    return a.label.localeCompare(b.label);
  });

  return out;
}

export const [GroceryListProvider, useGroceryList] = createContextHook<GroceryListState>(() => {
  const [storedStatuses, setStoredStatuses] = useState<Record<string, GroceryStatus>>({});
  const [servings, setServingsState] = useState<number>(2);
  const [isHydrating, setIsHydrating] = useState<boolean>(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const hasHydratedOnceRef = useRef<boolean>(false);

  const mealPlanContext = useMealPlan();

  const weekPlan = useMemo<DayMealPlan[]>(() => {
    if (!mealPlanContext?.weekPlan) return [];
    return mealPlanContext.weekPlan;
  }, [mealPlanContext]);

  const hydrate = useCallback(async () => {
    if (hasHydratedOnceRef.current) return;
    hasHydratedOnceRef.current = true;

    setIsHydrating(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        console.log("[groceryList] hydrate: no stored state");
        setStoredStatuses({});
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      const cast = parsed as Partial<StoredState>;
      const statuses = typeof cast?.statuses === "object" && cast.statuses ? (cast.statuses as Record<string, GroceryStatus>) : {};
      const loadedServings = typeof cast?.servings === "number" ? cast.servings : 2;
      console.log("[groceryList] hydrate: loaded", { keys: Object.keys(statuses).length, servings: loadedServings });
      setStoredStatuses(statuses);
      setServingsState(loadedServings);
    } catch (e) {
      console.error("[groceryList] hydrate: failed", { e });
      setLastError("Could not load grocery list state.");
      setStoredStatuses({});
    } finally {
      setIsHydrating(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const persist = useCallback(async (next: Record<string, GroceryStatus>, nextServings: number) => {
    try {
      const payload: StoredState = { statuses: next, servings: nextServings };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      console.log("[groceryList] persisted", { keys: Object.keys(next).length, servings: nextServings });
    } catch (e) {
      console.error("[groceryList] persist: failed", { e });
      setLastError("Could not save grocery list changes. Please try again.");
    }
  }, []);

  const base = useMemo(() => {
    console.log("[groceryList] rebuild from weekPlan", { days: weekPlan.length });
    return buildBaseItems(weekPlan);
  }, [weekPlan]);

  const items = useMemo<GroceryItem[]>(() => {
    return base.map((b) => ({
      ...b,
      status: storedStatuses[b.key] ?? "shop",
    }));
  }, [base, storedStatuses]);

  const sections = useMemo(() => {
    const buckets = new Map<GrocerySectionId, GroceryItem[]>();
    for (const it of items) {
      const prev = buckets.get(it.section) ?? [];
      buckets.set(it.section, [...prev, it]);
    }

    const ordered: GrocerySectionId[] = ["produce", "proteins", "grains", "dairy", "pantry", "spices", "other"];

    return ordered
      .map((id) => ({ id, title: SECTION_TITLES[id], items: buckets.get(id) ?? [] }))
      .filter((s) => s.items.length > 0);
  }, [items]);

  const setServings = useCallback(
    async (count: number) => {
      const clamped = Math.max(1, Math.min(10, count));
      console.log("[groceryList] setServings", { count: clamped });
      setServingsState(clamped);
      setStoredStatuses((prev) => {
        void persist(prev, clamped);
        return prev;
      });
    },
    [persist],
  );

  const setStatus = useCallback(
    async (input: { key: string; status: GroceryStatus }) => {
      console.log("[groceryList] setStatus", input);
      setStoredStatuses((prev) => {
        const next = { ...prev, [input.key]: input.status };
        void persist(next, servings);
        return next;
      });
    },
    [persist, servings],
  );

  const toggleHave = useCallback(
    async (key: string) => {
      setStoredStatuses((prev) => {
        const current = prev[key] ?? "shop";
        const nextStatus: GroceryStatus = current === "have" ? "shop" : "have";
        const next = { ...prev, [key]: nextStatus };
        console.log("[groceryList] toggleHave", { key, from: current, to: nextStatus });
        void persist(next, servings);
        return next;
      });
    },
    [persist, servings],
  );

  const resetAllToShop = useCallback(async () => {
    console.log("[groceryList] resetAllToShop");
    setLastError(null);
    setStoredStatuses({});
    await persist({}, servings);
  }, [persist, servings]);

  return {
    items,
    sections,
    isHydrating,
    lastError,
    servings,
    setServings,
    setStatus,
    toggleHave,
    resetAllToShop,
  };
});
