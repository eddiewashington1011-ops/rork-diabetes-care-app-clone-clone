import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { exercises, Exercise } from "@/mocks/exercises";

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface WorkoutPlanDay {
  day: DayOfWeek;
  exerciseIds: string[];
  restDay: boolean;
}

export interface WeekPlan {
  [key: string]: WorkoutPlanDay;
}

export interface WorkoutPlanData {
  weeks: { [weekKey: string]: WeekPlan };
  activeWeekKey: string;
}

const STORAGE_KEY = "workout_plan_v2";

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const getWeekKey = (date: Date): string => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay();
  const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  d.setDate(diff);
  return `${d.getFullYear()}-W${String(getWeekNumber(d)).padStart(2, "0")}`;
};

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const getWeekDateRange = (weekKey: string): { start: Date; end: Date } => {
  const [year, weekPart] = weekKey.split("-W");
  const weekNum = parseInt(weekPart, 10);
  const jan1 = new Date(parseInt(year, 10), 0, 1);
  const dayOfWeek = jan1.getDay() || 7;
  const daysToMonday = 1 - dayOfWeek;
  const firstMonday = new Date(jan1);
  firstMonday.setDate(jan1.getDate() + daysToMonday + (dayOfWeek <= 4 ? 0 : 7));
  const start = new Date(firstMonday);
  start.setDate(firstMonday.getDate() + (weekNum - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
};

const formatWeekRange = (weekKey: string): string => {
  const { start, end } = getWeekDateRange(weekKey);
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();
  const endDay = end.getDate();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
};

const getDefaultWeekPlan = (): WeekPlan => {
  const plan: WeekPlan = {};
  DAYS_OF_WEEK.forEach((day) => {
    plan[day] = {
      day,
      exerciseIds: [],
      restDay: day === "sunday",
    };
  });
  return plan;
};

const getCurrentDayOfWeek = (): DayOfWeek => {
  const dayIndex = new Date().getDay();
  const days: DayOfWeek[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[dayIndex];
};

const getDefaultPlanData = (): WorkoutPlanData => {
  const currentWeekKey = getWeekKey(new Date());
  return {
    weeks: {
      [currentWeekKey]: getDefaultWeekPlan(),
    },
    activeWeekKey: currentWeekKey,
  };
};

export const [WorkoutPlanProvider, useWorkoutPlan] = createContextHook(() => {
  const [planData, setPlanData] = useState<WorkoutPlanData>(getDefaultPlanData());
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(getWeekKey(new Date()));
  const [isLoading, setIsLoading] = useState(true);

  const currentWeekKey = useMemo(() => getWeekKey(new Date()), []);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: WorkoutPlanData = JSON.parse(stored);
          if (!parsed.weeks[currentWeekKey]) {
            parsed.weeks[currentWeekKey] = getDefaultWeekPlan();
          }
          setPlanData(parsed);
          setSelectedWeekKey(currentWeekKey);
        } else {
          const oldStored = await AsyncStorage.getItem("workout_plan");
          if (oldStored) {
            const oldPlan = JSON.parse(oldStored);
            const migrated: WorkoutPlanData = {
              weeks: { [currentWeekKey]: oldPlan },
              activeWeekKey: currentWeekKey,
            };
            setPlanData(migrated);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            console.log("[workoutPlan] Migrated old plan to new format");
          }
        }
      } catch (error) {
        console.log("[workoutPlan] Error loading plan:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [currentWeekKey]);

  const savePlan = async (data: WorkoutPlanData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log("[workoutPlan] Plan saved successfully");
    } catch (error) {
      console.log("[workoutPlan] Error saving plan:", error);
    }
  };

  const workoutPlan = useMemo(() => {
    return planData.weeks[selectedWeekKey] || getDefaultWeekPlan();
  }, [planData, selectedWeekKey]);

  const navigateWeek = useCallback((direction: "prev" | "next") => {
    setSelectedWeekKey((prevKey) => {
      const { start } = getWeekDateRange(prevKey);
      const newDate = new Date(start);
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
      const newKey = getWeekKey(newDate);
      
      setPlanData((prev) => {
        if (!prev.weeks[newKey]) {
          const updated = {
            ...prev,
            weeks: {
              ...prev.weeks,
              [newKey]: getDefaultWeekPlan(),
            },
          };
          savePlan(updated);
          return updated;
        }
        return prev;
      });
      
      return newKey;
    });
  }, []);

  const goToCurrentWeek = useCallback(() => {
    const current = getWeekKey(new Date());
    setSelectedWeekKey(current);
    
    setPlanData((prev) => {
      if (!prev.weeks[current]) {
        const updated = {
          ...prev,
          weeks: {
            ...prev.weeks,
            [current]: getDefaultWeekPlan(),
          },
        };
        savePlan(updated);
        return updated;
      }
      return prev;
    });
  }, []);

  const copyWeekTo = useCallback((targetWeekKey: string) => {
    console.log("[workoutPlan] Copying week from", selectedWeekKey, "to", targetWeekKey);
    setPlanData((prev) => {
      const sourcePlan = prev.weeks[selectedWeekKey] || getDefaultWeekPlan();
      const copiedPlan: WeekPlan = {};
      
      DAYS_OF_WEEK.forEach((day) => {
        copiedPlan[day] = {
          ...sourcePlan[day],
          exerciseIds: [...sourcePlan[day].exerciseIds],
        };
      });
      
      const updated = {
        ...prev,
        weeks: {
          ...prev.weeks,
          [targetWeekKey]: copiedPlan,
        },
      };
      savePlan(updated);
      return updated;
    });
  }, [selectedWeekKey]);

  const copyToNextWeek = useCallback(() => {
    const { start } = getWeekDateRange(selectedWeekKey);
    const nextWeekDate = new Date(start);
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    const nextWeekKey = getWeekKey(nextWeekDate);
    copyWeekTo(nextWeekKey);
  }, [selectedWeekKey, copyWeekTo]);

  const clearWeek = useCallback(() => {
    console.log("[workoutPlan] Clearing week:", selectedWeekKey);
    setPlanData((prev) => {
      const updated = {
        ...prev,
        weeks: {
          ...prev.weeks,
          [selectedWeekKey]: getDefaultWeekPlan(),
        },
      };
      savePlan(updated);
      return updated;
    });
  }, [selectedWeekKey]);

  const addExerciseToDay = useCallback((day: DayOfWeek, exerciseId: string) => {
    console.log("[workoutPlan] Adding exercise to day:", { day, exerciseId, week: selectedWeekKey });
    setPlanData((prev) => {
      const weekPlan = prev.weeks[selectedWeekKey] || getDefaultWeekPlan();
      const dayPlan = weekPlan[day];
      
      if (dayPlan.exerciseIds.includes(exerciseId)) {
        return prev;
      }
      
      const updated = {
        ...prev,
        weeks: {
          ...prev.weeks,
          [selectedWeekKey]: {
            ...weekPlan,
            [day]: {
              ...dayPlan,
              exerciseIds: [...dayPlan.exerciseIds, exerciseId],
              restDay: false,
            },
          },
        },
      };
      savePlan(updated);
      return updated;
    });
  }, [selectedWeekKey]);

  const removeExerciseFromDay = useCallback((day: DayOfWeek, exerciseId: string) => {
    console.log("[workoutPlan] Removing exercise from day:", { day, exerciseId, week: selectedWeekKey });
    setPlanData((prev) => {
      const weekPlan = prev.weeks[selectedWeekKey] || getDefaultWeekPlan();
      const dayPlan = weekPlan[day];
      
      const updated = {
        ...prev,
        weeks: {
          ...prev.weeks,
          [selectedWeekKey]: {
            ...weekPlan,
            [day]: {
              ...dayPlan,
              exerciseIds: dayPlan.exerciseIds.filter((id) => id !== exerciseId),
            },
          },
        },
      };
      savePlan(updated);
      return updated;
    });
  }, [selectedWeekKey]);

  const toggleRestDay = useCallback((day: DayOfWeek) => {
    console.log("[workoutPlan] Toggling rest day:", { day, week: selectedWeekKey });
    setPlanData((prev) => {
      const weekPlan = prev.weeks[selectedWeekKey] || getDefaultWeekPlan();
      const dayPlan = weekPlan[day];
      
      const updated = {
        ...prev,
        weeks: {
          ...prev.weeks,
          [selectedWeekKey]: {
            ...weekPlan,
            [day]: {
              ...dayPlan,
              restDay: !dayPlan.restDay,
              exerciseIds: !dayPlan.restDay ? [] : dayPlan.exerciseIds,
            },
          },
        },
      };
      savePlan(updated);
      return updated;
    });
  }, [selectedWeekKey]);

  const clearDay = useCallback((day: DayOfWeek) => {
    console.log("[workoutPlan] Clearing day:", { day, week: selectedWeekKey });
    setPlanData((prev) => {
      const weekPlan = prev.weeks[selectedWeekKey] || getDefaultWeekPlan();
      
      const updated = {
        ...prev,
        weeks: {
          ...prev.weeks,
          [selectedWeekKey]: {
            ...weekPlan,
            [day]: {
              ...weekPlan[day],
              exerciseIds: [],
              restDay: false,
            },
          },
        },
      };
      savePlan(updated);
      return updated;
    });
  }, [selectedWeekKey]);

  const getExercisesForDay = useCallback(
    (day: DayOfWeek): Exercise[] => {
      const dayPlan = workoutPlan[day];
      if (!dayPlan || dayPlan.restDay) return [];
      return dayPlan.exerciseIds
        .map((id) => exercises.find((e) => e.id === id))
        .filter((e): e is Exercise => e !== undefined);
    },
    [workoutPlan]
  );

  const todayPlan = useMemo(() => {
    const today = getCurrentDayOfWeek();
    const currentPlan = planData.weeks[currentWeekKey] || getDefaultWeekPlan();
    return currentPlan[today];
  }, [planData, currentWeekKey]);

  const todayExercises = useMemo(() => {
    const today = getCurrentDayOfWeek();
    const currentPlan = planData.weeks[currentWeekKey] || getDefaultWeekPlan();
    const dayPlan = currentPlan[today];
    if (!dayPlan || dayPlan.restDay) return [];
    return dayPlan.exerciseIds
      .map((id) => exercises.find((e) => e.id === id))
      .filter((e): e is Exercise => e !== undefined);
  }, [planData, currentWeekKey]);

  const getTotalDuration = useCallback(
    (day: DayOfWeek): number => {
      const dayExercises = getExercisesForDay(day);
      return dayExercises.reduce((acc, e) => acc + e.duration, 0);
    },
    [getExercisesForDay]
  );

  const getTotalCalories = useCallback(
    (day: DayOfWeek): number => {
      const dayExercises = getExercisesForDay(day);
      return dayExercises.reduce((acc, e) => acc + e.caloriesBurned, 0);
    },
    [getExercisesForDay]
  );

  const getWeeklyStats = useCallback((weekKey: string) => {
    const week = planData.weeks[weekKey] || getDefaultWeekPlan();
    let totalWorkouts = 0;
    let totalDuration = 0;
    let totalCalories = 0;
    let restDays = 0;

    DAYS_OF_WEEK.forEach((day) => {
      const dayPlan = week[day];
      if (dayPlan.restDay) {
        restDays++;
      } else {
        const dayExercises = dayPlan.exerciseIds
          .map((id) => exercises.find((e) => e.id === id))
          .filter((e): e is Exercise => e !== undefined);
        totalWorkouts += dayExercises.length;
        totalDuration += dayExercises.reduce((acc, e) => acc + e.duration, 0);
        totalCalories += dayExercises.reduce((acc, e) => acc + e.caloriesBurned, 0);
      }
    });

    return { totalWorkouts, totalDuration, totalCalories, restDays };
  }, [planData]);

  const isCurrentWeek = useMemo(() => {
    return selectedWeekKey === currentWeekKey;
  }, [selectedWeekKey, currentWeekKey]);

  const weekLabel = useMemo(() => {
    if (isCurrentWeek) return "This Week";
    const { start } = getWeekDateRange(selectedWeekKey);
    const { start: currentStart } = getWeekDateRange(currentWeekKey);
    const diff = Math.round((start.getTime() - currentStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (diff === 1) return "Next Week";
    if (diff === -1) return "Last Week";
    return formatWeekRange(selectedWeekKey);
  }, [selectedWeekKey, currentWeekKey, isCurrentWeek]);

  return {
    workoutPlan,
    isLoading,
    addExerciseToDay,
    removeExerciseFromDay,
    toggleRestDay,
    clearDay,
    getExercisesForDay,
    todayPlan,
    todayExercises,
    getTotalDuration,
    getTotalCalories,
    DAYS_OF_WEEK,
    DAY_LABELS,
    getCurrentDayOfWeek,
    selectedWeekKey,
    currentWeekKey,
    isCurrentWeek,
    weekLabel,
    navigateWeek,
    goToCurrentWeek,
    copyToNextWeek,
    clearWeek,
    getWeeklyStats,
    formatWeekRange,
  };
});
