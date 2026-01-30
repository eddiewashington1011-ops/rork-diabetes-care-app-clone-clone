import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

type OnboardingState = {
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  currentStep: number;
  diabetesType: "type1" | "type2" | "prediabetes" | "gestational" | null;
  goals: string[];
  notificationsEnabled: boolean;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
  setStep: (step: number) => void;
  setDiabetesType: (type: OnboardingState["diabetesType"]) => void;
  toggleGoal: (goal: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  resetOnboarding: () => Promise<void>;
};

const STORAGE_KEY = "diacare:onboarding:v1";

export const [OnboardingProvider, useOnboarding] = createContextHook<OnboardingState>(() => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [diabetesType, setDiabetesType] = useState<OnboardingState["diabetesType"]>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setHasCompletedOnboarding(parsed.completed ?? false);
          setDiabetesType(parsed.diabetesType ?? null);
          setGoals(parsed.goals ?? []);
          setNotificationsEnabled(parsed.notificationsEnabled ?? false);
          console.log("[onboarding] Loaded state", parsed);
        }
      } catch (e) {
        console.error("[onboarding] Failed to load state", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persistState = useCallback(async (state: {
    completed: boolean;
    diabetesType: OnboardingState["diabetesType"];
    goals: string[];
    notificationsEnabled: boolean;
  }) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      console.log("[onboarding] Persisted state", state);
    } catch (e) {
      console.error("[onboarding] Failed to persist state", e);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    console.log("[onboarding] Completing onboarding", { diabetesType, goals, notificationsEnabled });
    setHasCompletedOnboarding(true);
    await persistState({
      completed: true,
      diabetesType,
      goals,
      notificationsEnabled,
    });
  }, [diabetesType, goals, notificationsEnabled, persistState]);

  const skipOnboarding = useCallback(async () => {
    console.log("[onboarding] Skipping onboarding");
    setHasCompletedOnboarding(true);
    await persistState({
      completed: true,
      diabetesType: null,
      goals: [],
      notificationsEnabled: false,
    });
  }, [persistState]);

  const resetOnboarding = useCallback(async () => {
    console.log("[onboarding] Resetting onboarding");
    setHasCompletedOnboarding(false);
    setCurrentStep(0);
    setDiabetesType(null);
    setGoals([]);
    setNotificationsEnabled(false);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const toggleGoal = useCallback((goal: string) => {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }, []);

  const value: OnboardingState = useMemo(
    () => ({
      hasCompletedOnboarding,
      isLoading,
      currentStep,
      diabetesType,
      goals,
      notificationsEnabled,
      completeOnboarding,
      skipOnboarding,
      setStep: setCurrentStep,
      setDiabetesType,
      toggleGoal,
      setNotificationsEnabled,
      resetOnboarding,
    }),
    [
      hasCompletedOnboarding,
      isLoading,
      currentStep,
      diabetesType,
      goals,
      notificationsEnabled,
      completeOnboarding,
      skipOnboarding,
      toggleGoal,
      resetOnboarding,
    ]
  );

  return value;
});
