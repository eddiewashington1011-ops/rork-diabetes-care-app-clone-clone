// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { EngagementProvider } from "@/providers/engagement";
import { MealPlanProvider } from "@/providers/mealPlan";
import { GroceryListProvider } from "@/providers/groceryList";
import { RecipesProvider } from "@/providers/recipes";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { trpc, trpcClient } from "@/lib/trpc";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
            <EngagementProvider>
              <MealPlanProvider>
                <GroceryListProvider>
                  <RecipesProvider>
                    <RootLayoutNav />
                  </RecipesProvider>
                </GroceryListProvider>
              </MealPlanProvider>
            </EngagementProvider>
          </AppErrorBoundary>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
