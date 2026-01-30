import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function ExerciseLayout() {
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
          title: "Exercise",
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="[exerciseId]"
        options={{
          title: "Workout",
        }}
      />
      <Stack.Screen
        name="video-agent"
        options={{
          title: "Video Creator",
        }}
      />
      <Stack.Screen
        name="workout-plan"
        options={{
          title: "Workout Plan",
        }}
      />
    </Stack>
  );
}
