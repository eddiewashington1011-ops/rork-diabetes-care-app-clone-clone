import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function HomeLayout() {
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
          title: "Dia Care",
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="sugar-tips"
        options={{
          title: "Sugar Control",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="glucose"
        options={{
          title: "Glucose Log",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="reminders"
        options={{
          title: "Reminders",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="streaks"
        options={{
          title: "Streaks",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
