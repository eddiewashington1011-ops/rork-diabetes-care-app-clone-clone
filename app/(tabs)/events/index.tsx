import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Clock, MapPin, ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import { BottomCTA } from "@/components/BottomCTA";
import { events, eventTypes, DiabetesEvent } from "@/mocks/events";

function EventCard({ event, onPress }: { event: DiabetesEvent; onPress: () => void }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const isUpcoming = new Date(event.date) >= new Date();

  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.dateColumn, { backgroundColor: event.color + "15" }]}>
        <Text style={[styles.dateText, { color: event.color }]}>{formatDate(event.date)}</Text>
        <Text style={styles.eventIcon}>{event.icon}</Text>
      </View>
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          {isUpcoming && (
            <View style={[styles.typeBadge, { backgroundColor: event.color + "20" }]}>
              <Text style={[styles.typeText, { color: event.color }]}>{event.type}</Text>
            </View>
          )}
        </View>
        <Text style={styles.eventDesc} numberOfLines={2}>
          {event.description}
        </Text>
        <View style={styles.eventMeta}>
          <View style={styles.metaItem}>
            <Clock size={13} color={Colors.light.textSecondary} />
            <Text style={styles.metaText}>{event.time}</Text>
          </View>
          {event.location && (
            <View style={styles.metaItem}>
              <MapPin size={13} color={Colors.light.textSecondary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {event.location.split(",")[0]}
              </Text>
            </View>
          )}
        </View>
      </View>
      <ChevronRight size={18} color={Colors.light.textSecondary} />
    </TouchableOpacity>
  );
}

export default function EventsScreen() {
  const router = useRouter();
  const [activeType, setActiveType] = useState("all");

  const onAdd = useCallback(() => {
    console.log("[events] bottom cta pressed");
    router.push("/(tabs)/(home)/reminders");
  }, [router]);

  const filteredEvents =
    activeType === "all"
      ? events
      : events.filter((e) => e.type === activeType);

  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const upcomingEvents = sortedEvents.filter(
    (e) => new Date(e.date) >= new Date()
  );

  return (
    <View style={styles.container} testID="events-screen">
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{upcomingEvents.length}</Text>
          <Text style={styles.summaryLabel}>Upcoming</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {upcomingEvents.filter((e) => e.type === "appointment").length}
          </Text>
          <Text style={styles.summaryLabel}>Appointments</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {upcomingEvents.filter((e) => e.type === "medication").length}
          </Text>
          <Text style={styles.summaryLabel}>Medications</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.typeScroll}
        contentContainerStyle={styles.typeContainer}
      >
        {eventTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeChip,
              activeType === type.id && styles.typeChipActive,
            ]}
            onPress={() => setActiveType(type.id)}
          >
            <Text style={styles.typeIcon}>{type.icon}</Text>
            <Text
              style={[
                styles.typeChipText,
                activeType === type.id && styles.typeChipTextActive,
              ]}
            >
              {type.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.eventsScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.eventsContainer}
        testID="events-list"
      >
        {sortedEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>No events found</Text>
            <Text style={styles.emptySubtext}>Try selecting a different category</Text>
          </View>
        ) : (
          sortedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => router.push(`/(tabs)/events/${event.id}`)}
            />
          ))
        )}
      </ScrollView>

      <BottomCTA
        title="Add reminder"
        subtitle="Medications, appointments, checkups"
        onPress={onAdd}
        testID="events-bottom-cta"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.surface,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.tint,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 4,
  },
  typeScroll: {
    maxHeight: 52,
    marginTop: 16,
  },
  typeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
    flexDirection: "row",
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  typeChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  typeIcon: {
    fontSize: 14,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  typeChipTextActive: {
    color: "#fff",
  },
  eventsScroll: {
    flex: 1,
  },
  eventsContainer: {
    padding: 20,
    paddingBottom: 140,
    gap: 12,
  },
  eventCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dateColumn: {
    width: 70,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    alignSelf: "stretch",
  },
  dateText: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  eventIcon: {
    fontSize: 22,
  },
  eventContent: {
    flex: 1,
    padding: 14,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  eventDesc: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: "row",
    gap: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
