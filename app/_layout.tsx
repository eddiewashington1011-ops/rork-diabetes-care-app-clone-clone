import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator, StyleSheet } from "react-native";

import { EngagementProvider } from "@/providers/engagement";
import { CGMProvider } from "@/providers/cgm";
import { MealPlanProvider } from "@/providers/mealPlan";
import { GroceryListProvider } from "@/providers/groceryList";
import { RecipesProvider } from "@/providers/recipes";
import { WorkoutPlanProvider } from "@/providers/workoutPlan";
import { OnboardingProvider, useOnboarding } from "@/providers/onboarding";
import { AnalyticsProvider, useAnalytics } from "@/providers/analytics";
import { SubscriptionProvider } from "@/providers/subscription";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { trpc, trpcClient } from "@/lib/trpc";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { hasCompletedOnboarding, isLoading } = useOnboarding();
  const { trackScreenView } = useAnalytics();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === "onboarding";

    if (!hasCompletedOnboarding && !inOnboarding) {
      console.log("[layout] Redirecting to onboarding");
      router.replace("/onboarding");
    } else if (hasCompletedOnboarding && inOnboarding) {
      console.log("[layout] Onboarding complete, going to home");
      router.replace("/(tabs)/(home)");
    }
  }, [hasCompletedOnboarding, isLoading, segments, router]);

  useEffect(() => {
    if (segments.length > 0) {
      const screenName = segments.join("/");
      trackScreenView(screenName);
    }
  }, [segments, trackScreenView]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="onboarding"
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="paywall"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppErrorBoundary>
            <AnalyticsProvider>
              <OnboardingProvider>
                <SubscriptionProvider>
                  <EngagementProvider>
                    <CGMProvider>
                      <MealPlanProvider>
                        <GroceryListProvider>
                          <RecipesProvider>
                            <WorkoutPlanProvider>
                              <OnboardingGate>
                                <RootLayoutNav />
                              </OnboardingGate>
                            </WorkoutPlanProvider>
                          </RecipesProvider>
                        </GroceryListProvider>
                      </MealPlanProvider>
                    </CGMProvider>
                  </EngagementProvider>
                </SubscriptionProvider>
              </OnboardingProvider>
            </AnalyticsProvider>
          </AppErrorBoundary>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
  },
});
