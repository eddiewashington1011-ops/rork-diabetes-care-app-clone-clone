import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Calendar, Clock, MapPin, FileText } from "lucide-react-native";
import Colors from "@/constants/colors";
import { events } from "@/mocks/events";

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const event = events.find((e) => e.id === eventId);

  if (!event) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.heroSection, { backgroundColor: event.color + "15" }]}>
        <Text style={styles.heroIcon}>{event.icon}</Text>
        <View style={[styles.typeBadge, { backgroundColor: event.color }]}>
          <Text style={styles.typeText}>{event.type}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.description}>{event.description}</Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: Colors.light.tintLight }]}>
              <Calendar size={18} color={Colors.light.tint} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(event.date)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: Colors.light.accentLight }]}>
              <Clock size={18} color={Colors.light.accent} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{event.time}</Text>
            </View>
          </View>

          {event.location && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={[styles.detailIcon, { backgroundColor: Colors.light.successLight }]}>
                  <MapPin size={18} color={Colors.light.success} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{event.location}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {event.notes && (
          <View style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <FileText size={18} color={Colors.light.text} />
              <Text style={styles.notesTitle}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{event.notes}</Text>
          </View>
        )}

        <View style={styles.reminderSection}>
          <Text style={styles.reminderTitle}>Reminder Tips</Text>
          <View style={styles.reminderList}>
            {event.type === "appointment" && (
              <>
                <ReminderItem text="Set a reminder 1 day before" />
                <ReminderItem text="Prepare any documents or test results to bring" />
                <ReminderItem text="Write down questions to ask your doctor" />
              </>
            )}
            {event.type === "medication" && (
              <>
                <ReminderItem text="Set daily alarms for consistent timing" />
                <ReminderItem text="Keep medications visible and accessible" />
                <ReminderItem text="Track when you take each dose" />
              </>
            )}
            {event.type === "checkup" && (
              <>
                <ReminderItem text="Check if fasting is required" />
                <ReminderItem text="Bring your insurance information" />
                <ReminderItem text="Note any symptoms to discuss" />
              </>
            )}
            {event.type === "community" && (
              <>
                <ReminderItem text="Check the event schedule" />
                <ReminderItem text="Consider topics you'd like to discuss" />
                <ReminderItem text="Bring a notebook for helpful tips" />
              </>
            )}
            {event.type === "reminder" && (
              <>
                <ReminderItem text="Set multiple reminders if needed" />
                <ReminderItem text="Keep your supplies ready" />
                <ReminderItem text="Log your readings for patterns" />
              </>
            )}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </View>
    </ScrollView>
  );
}

function ReminderItem({ text }: { text: string }) {
  return (
    <View style={styles.reminderItem}>
      <View style={styles.reminderBullet} />
      <Text style={styles.reminderText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 40,
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  typeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    textTransform: "capitalize",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  detailsCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 8,
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 8,
  },
  notesCard: {
    backgroundColor: Colors.light.tintLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  notesTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
  },
  notesText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  reminderSection: {
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    padding: 16,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 14,
  },
  reminderList: {
    gap: 10,
  },
  reminderItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  reminderBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.tint,
    marginTop: 6,
  },
  reminderText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 40,
  },
});
