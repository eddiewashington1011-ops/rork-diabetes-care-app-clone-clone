import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function MealPlanLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.surface,
        },
        headerTintColor: Colors.light.text,
        headerTitleStyle: {
          fontWeight: "600",
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Meal Planner",
          headerLargeTitle: true,
        }}
      />
    </Stack>
  );
}
