import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

export type MacroNutrients = {
  calories: number;
  carbs: number;
  fiber: number;
  sugar: number;
  protein: number;
  fat: number;
  saturatedFat: number;
  sodium: number;
};

export type FoodEntry = {
  id: string;
  name: string;
  brand?: string;
  servingSize: string;
  servings: number;
  macros: MacroNutrients;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  timestamp: string;
  barcode?: string;
  isCustom?: boolean;
  glucoseImpact?: "low" | "medium" | "high";
  notes?: string;
};

export type DailyNutritionGoals = {
  calories: number;
  carbs: number;
  fiber: number;
  protein: number;
  fat: number;
  sodium: number;
};

export type DailySummary = {
  date: string;
  entries: FoodEntry[];
  totals: MacroNutrients;
  goals: DailyNutritionGoals;
  glucoseReadingsCount: number;
  averageGlucose: number | null;
};

type FoodLogState = {
  entries: FoodEntry[];
  dailyGoals: DailyNutritionGoals;
  isLoading: boolean;
  recentFoods: FoodEntry[];
  favoriteFoods: string[];

  addEntry: (entry: Omit<FoodEntry, "id" | "timestamp">) => Promise<FoodEntry>;
  updateEntry: (id: string, updates: Partial<FoodEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getDailySummary: (date?: string) => DailySummary;
  getWeeklySummary: () => DailySummary[];
  setDailyGoals: (goals: Partial<DailyNutritionGoals>) => Promise<void>;
  toggleFavorite: (foodId: string) => Promise<void>;
  searchFoods: (query: string) => FoodEntry[];
  getGlucoseImpact: (carbs: number, fiber: number) => "low" | "medium" | "high";
  calculateNetCarbs: (carbs: number, fiber: number) => number;
};

const STORAGE_KEYS = {
  entries: "diacare:food_entries:v1",
  goals: "diacare:nutrition_goals:v1",
  favorites: "diacare:favorite_foods:v1",
} as const;

const DEFAULT_GOALS: DailyNutritionGoals = {
  calories: 2000,
  carbs: 130,
  fiber: 25,
  protein: 50,
  fat: 65,
  sodium: 2300,
};

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function getDateString(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

function createEmptyMacros(): MacroNutrients {
  return {
    calories: 0,
    carbs: 0,
    fiber: 0,
    sugar: 0,
    protein: 0,
    fat: 0,
    saturatedFat: 0,
    sodium: 0,
  };
}

function sumMacros(entries: FoodEntry[]): MacroNutrients {
  return entries.reduce((acc, entry) => {
    const mult = entry.servings;
    return {
      calories: acc.calories + entry.macros.calories * mult,
      carbs: acc.carbs + entry.macros.carbs * mult,
      fiber: acc.fiber + entry.macros.fiber * mult,
      sugar: acc.sugar + entry.macros.sugar * mult,
      protein: acc.protein + entry.macros.protein * mult,
      fat: acc.fat + entry.macros.fat * mult,
      saturatedFat: acc.saturatedFat + entry.macros.saturatedFat * mult,
      sodium: acc.sodium + entry.macros.sodium * mult,
    };
  }, createEmptyMacros());
}

export const [FoodLogProvider, useFoodLog] = createContextHook<FoodLogState>(() => {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [dailyGoals, setDailyGoalsState] = useState<DailyNutritionGoals>(DEFAULT_GOALS);
  const [favoriteFoods, setFavoriteFoods] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      console.log("[foodLog] Hydrating...");
      const [rawEntries, rawGoals, rawFavorites] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.entries),
        AsyncStorage.getItem(STORAGE_KEYS.goals),
        AsyncStorage.getItem(STORAGE_KEYS.favorites),
      ]);

      if (!mounted) return;

      setEntries(safeParseJson<FoodEntry[]>(rawEntries, []));
      setDailyGoalsState({ ...DEFAULT_GOALS, ...safeParseJson<DailyNutritionGoals>(rawGoals, DEFAULT_GOALS) });
      setFavoriteFoods(safeParseJson<string[]>(rawFavorites, []));
      
      hydratedRef.current = true;
      setIsLoading(false);
      console.log("[foodLog] Hydrated");
    })();

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries.slice(0, 1000))).catch((e) =>
      console.error("[foodLog] Failed to persist entries", e)
    );
  }, [entries]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(dailyGoals)).catch((e) =>
      console.error("[foodLog] Failed to persist goals", e)
    );
  }, [dailyGoals]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favoriteFoods)).catch((e) =>
      console.error("[foodLog] Failed to persist favorites", e)
    );
  }, [favoriteFoods]);

  const getGlucoseImpact = useCallback((carbs: number, fiber: number): "low" | "medium" | "high" => {
    const netCarbs = carbs - fiber;
    if (netCarbs <= 10) return "low";
    if (netCarbs <= 25) return "medium";
    return "high";
  }, []);

  const calculateNetCarbs = useCallback((carbs: number, fiber: number): number => {
    return Math.max(0, carbs - fiber);
  }, []);

  const addEntry = useCallback(async (entryData: Omit<FoodEntry, "id" | "timestamp">): Promise<FoodEntry> => {
    const entry: FoodEntry = {
      ...entryData,
      id: uid("food"),
      timestamp: new Date().toISOString(),
      glucoseImpact: entryData.glucoseImpact ?? getGlucoseImpact(entryData.macros.carbs, entryData.macros.fiber),
    };

    console.log("[foodLog] addEntry", { name: entry.name, carbs: entry.macros.carbs });
    setEntries((prev) => [entry, ...prev]);
    return entry;
  }, [getGlucoseImpact]);

  const updateEntry = useCallback(async (id: string, updates: Partial<FoodEntry>): Promise<void> => {
    console.log("[foodLog] updateEntry", { id, updates: Object.keys(updates) });
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  }, []);

  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    console.log("[foodLog] deleteEntry", { id });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const getDailySummary = useCallback((date?: string): DailySummary => {
    const targetDate = date ?? getDateString();
    const dayEntries = entries.filter((e) => e.timestamp.startsWith(targetDate));
    
    return {
      date: targetDate,
      entries: dayEntries,
      totals: sumMacros(dayEntries),
      goals: dailyGoals,
      glucoseReadingsCount: 0,
      averageGlucose: null,
    };
  }, [entries, dailyGoals]);

  const getWeeklySummary = useCallback((): DailySummary[] => {
    const summaries: DailySummary[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      summaries.push(getDailySummary(getDateString(date)));
    }
    
    return summaries;
  }, [getDailySummary]);

  const setDailyGoals = useCallback(async (goals: Partial<DailyNutritionGoals>): Promise<void> => {
    console.log("[foodLog] setDailyGoals", goals);
    setDailyGoalsState((prev) => ({ ...prev, ...goals }));
  }, []);

  const toggleFavorite = useCallback(async (foodId: string): Promise<void> => {
    console.log("[foodLog] toggleFavorite", { foodId });
    setFavoriteFoods((prev) =>
      prev.includes(foodId) ? prev.filter((id) => id !== foodId) : [...prev, foodId]
    );
  }, []);

  const searchFoods = useCallback((query: string): FoodEntry[] => {
    if (!query.trim()) return [];
    const needle = query.toLowerCase();
    return entries.filter((e) =>
      e.name.toLowerCase().includes(needle) ||
      (e.brand?.toLowerCase().includes(needle) ?? false)
    ).slice(0, 20);
  }, [entries]);

  const recentFoods = useMemo(() => {
    const seen = new Set<string>();
    const recent: FoodEntry[] = [];
    
    for (const entry of entries) {
      const key = entry.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        recent.push(entry);
      }
      if (recent.length >= 10) break;
    }
    
    return recent;
  }, [entries]);

  const value: FoodLogState = useMemo(() => ({
    entries,
    dailyGoals,
    isLoading,
    recentFoods,
    favoriteFoods,
    addEntry,
    updateEntry,
    deleteEntry,
    getDailySummary,
    getWeeklySummary,
    setDailyGoals,
    toggleFavorite,
    searchFoods,
    getGlucoseImpact,
    calculateNetCarbs,
  }), [
    entries, dailyGoals, isLoading, recentFoods, favoriteFoods,
    addEntry, updateEntry, deleteEntry, getDailySummary, getWeeklySummary,
    setDailyGoals, toggleFavorite, searchFoods, getGlucoseImpact, calculateNetCarbs,
  ]);

  return value;
});
