import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function RecipesLayout() {
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
          title: "Cookbook",
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="[recipeId]"
        options={{
          title: "Recipe",
        }}
      />
    </Stack>
  );
}
