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

export interface WorkoutPlan {
  [key: string]: WorkoutPlanDay;
}

const STORAGE_KEY = "workout_plan";

const DAYS_OF_WEEK: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const getDefaultPlan = (): WorkoutPlan => {
  const plan: WorkoutPlan = {};
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

export const [WorkoutPlanProvider, useWorkoutPlan] = createContextHook(() => {
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan>(getDefaultPlan());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setWorkoutPlan(parsed);
      }
    } catch (error) {
      console.log("[workoutPlan] Error loading plan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePlan = async (plan: WorkoutPlan) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
      console.log("[workoutPlan] Plan saved successfully");
    } catch (error) {
      console.log("[workoutPlan] Error saving plan:", error);
    }
  };

  const addExerciseToDay = useCallback((day: DayOfWeek, exerciseId: string) => {
    console.log("[workoutPlan] Adding exercise to day:", { day, exerciseId });
    setWorkoutPlan((prev) => {
      const dayPlan = prev[day];
      if (dayPlan.exerciseIds.includes(exerciseId)) {
        return prev;
      }
      const updated = {
        ...prev,
        [day]: {
          ...dayPlan,
          exerciseIds: [...dayPlan.exerciseIds, exerciseId],
          restDay: false,
        },
      };
      savePlan(updated);
      return updated;
    });
  }, []);

  const removeExerciseFromDay = useCallback((day: DayOfWeek, exerciseId: string) => {
    console.log("[workoutPlan] Removing exercise from day:", { day, exerciseId });
    setWorkoutPlan((prev) => {
      const dayPlan = prev[day];
      const updated = {
        ...prev,
        [day]: {
          ...dayPlan,
          exerciseIds: dayPlan.exerciseIds.filter((id) => id !== exerciseId),
        },
      };
      savePlan(updated);
      return updated;
    });
  }, []);

  const toggleRestDay = useCallback((day: DayOfWeek) => {
    console.log("[workoutPlan] Toggling rest day:", { day });
    setWorkoutPlan((prev) => {
      const dayPlan = prev[day];
      const updated = {
        ...prev,
        [day]: {
          ...dayPlan,
          restDay: !dayPlan.restDay,
          exerciseIds: !dayPlan.restDay ? [] : dayPlan.exerciseIds,
        },
      };
      savePlan(updated);
      return updated;
    });
  }, []);

  const clearDay = useCallback((day: DayOfWeek) => {
    console.log("[workoutPlan] Clearing day:", { day });
    setWorkoutPlan((prev) => {
      const updated = {
        ...prev,
        [day]: {
          ...prev[day],
          exerciseIds: [],
          restDay: false,
        },
      };
      savePlan(updated);
      return updated;
    });
  }, []);

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
    return workoutPlan[today];
  }, [workoutPlan]);

  const todayExercises = useMemo(() => {
    const today = getCurrentDayOfWeek();
    return getExercisesForDay(today);
  }, [getExercisesForDay]);

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
  };
});
