import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function EventsLayout() {
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
          title: "Events",
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="[eventId]"
        options={{
          title: "Event Details",
        }}
      />
    </Stack>
  );
}
