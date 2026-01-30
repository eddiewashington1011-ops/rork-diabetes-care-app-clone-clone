import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import {
  Plus,
  X,
  Stethoscope,
  Calendar,
  Phone,
  Mail,
  Building2,
  FileText,
  Share2,
  Clock,
  Video,
  AlertCircle,
  Trash2,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { useDoctorShare, Doctor, Appointment } from "@/providers/doctorShare";
import { AnimatedPressable, FadeIn } from "@/components/AnimatedPressable";

const APPOINTMENT_TYPES = [
  { key: "checkup" as const, label: "Checkup", icon: Stethoscope, color: Colors.light.tint },
  { key: "followup" as const, label: "Follow-up", icon: Calendar, color: Colors.light.sapphire },
  { key: "emergency" as const, label: "Emergency", icon: AlertCircle, color: Colors.light.danger },
  { key: "telehealth" as const, label: "Telehealth", icon: Video, color: Colors.light.success },
];

const REPORT_PERIODS = [
  { key: "7days" as const, label: "7 Days" },
  { key: "14days" as const, label: "14 Days" },
  { key: "30days" as const, label: "30 Days" },
  { key: "90days" as const, label: "90 Days" },
];

export default function DoctorsScreen() {
  const {
    doctors,
    appointments,
    addDoctor,
    deleteDoctor,
    scheduleAppointment,
    cancelAppointment,
    getUpcomingAppointments,
    shareReportWithDoctor,
    getReportsForDoctor,
  } = useDoctorShare();

  const [addDoctorModal, setAddDoctorModal] = useState(false);
  const [addAppointmentModal, setAddAppointmentModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<"7days" | "14days" | "30days" | "90days">("30days");

  const [doctorForm, setDoctorForm] = useState({
    name: "",
    specialty: "",
    email: "",
    phone: "",
    clinic: "",
    notes: "",
  });

  const [appointmentForm, setAppointmentForm] = useState({
    date: "",
    time: "",
    type: "checkup" as Appointment["type"],
    notes: "",
    reminder: true,
  });

  const upcomingAppointments = useMemo(() => getUpcomingAppointments(), [getUpcomingAppointments]);

  const resetDoctorForm = useCallback(() => {
    setDoctorForm({ name: "", specialty: "", email: "", phone: "", clinic: "", notes: "" });
  }, []);

  const resetAppointmentForm = useCallback(() => {
    setAppointmentForm({ date: "", time: "", type: "checkup", notes: "", reminder: true });
  }, []);

  const openAddDoctor = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    resetDoctorForm();
    setAddDoctorModal(true);
  }, [resetDoctorForm]);

  const openAddAppointment = useCallback((doctor: Doctor) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedDoctor(doctor);
    resetAppointmentForm();
    setAddAppointmentModal(true);
  }, [resetAppointmentForm]);

  const openShareModal = useCallback((doctor: Doctor) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedDoctor(doctor);
    setShareModal(true);
  }, []);

  const onSaveDoctor = useCallback(async () => {
    if (!doctorForm.name.trim()) {
      Alert.alert("Missing Info", "Please enter the doctor's name.");
      return;
    }

    await addDoctor({
      name: doctorForm.name.trim(),
      specialty: doctorForm.specialty.trim(),
      email: doctorForm.email.trim() || undefined,
      phone: doctorForm.phone.trim() || undefined,
      clinic: doctorForm.clinic.trim() || undefined,
      notes: doctorForm.notes.trim() || undefined,
    });

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setAddDoctorModal(false);
    resetDoctorForm();
  }, [addDoctor, doctorForm, resetDoctorForm]);

  const onSaveAppointment = useCallback(async () => {
    if (!selectedDoctor) return;

    if (!appointmentForm.date || !appointmentForm.time) {
      Alert.alert("Missing Info", "Please enter the date and time.");
      return;
    }

    await scheduleAppointment({
      doctorId: selectedDoctor.id,
      date: appointmentForm.date,
      time: appointmentForm.time,
      type: appointmentForm.type,
      notes: appointmentForm.notes.trim() || undefined,
      reminder: appointmentForm.reminder,
    });

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setAddAppointmentModal(false);
    resetAppointmentForm();
    setSelectedDoctor(null);
  }, [appointmentForm, scheduleAppointment, selectedDoctor, resetAppointmentForm]);

  const onShareReport = useCallback(async () => {
    if (!selectedDoctor) return;

    await shareReportWithDoctor(selectedDoctor.id, "comprehensive", selectedPeriod);
    setShareModal(false);
    setSelectedDoctor(null);
  }, [selectedDoctor, selectedPeriod, shareReportWithDoctor]);

  const onDeleteDoctor = useCallback((doctor: Doctor) => {
    Alert.alert(
      "Delete Doctor?",
      `This will remove ${doctor.name} and all their appointments.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteDoctor(doctor.id),
        },
      ]
    );
  }, [deleteDoctor]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "My Doctors",
          headerStyle: { backgroundColor: Colors.light.surface },
          headerTitleStyle: { fontWeight: "700" },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {upcomingAppointments.length > 0 && (
          <FadeIn>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
              <View style={styles.appointmentsList}>
                {upcomingAppointments.slice(0, 3).map((apt) => {
                  const doctor = doctors.find((d) => d.id === apt.doctorId);
                  const typeConfig = APPOINTMENT_TYPES.find((t) => t.key === apt.type);
                  const Icon = typeConfig?.icon ?? Calendar;

                  return (
                    <View key={apt.id} style={styles.appointmentCard}>
                      <View style={[styles.appointmentIcon, { backgroundColor: (typeConfig?.color ?? Colors.light.tint) + "20" }]}>
                        <Icon size={18} color={typeConfig?.color ?? Colors.light.tint} />
                      </View>
                      <View style={styles.appointmentContent}>
                        <Text style={styles.appointmentType}>{typeConfig?.label ?? apt.type}</Text>
                        <Text style={styles.appointmentDoctor}>{doctor?.name ?? "Unknown"}</Text>
                        <View style={styles.appointmentMeta}>
                          <Calendar size={12} color={Colors.light.textSecondary} />
                          <Text style={styles.appointmentMetaText}>{apt.date}</Text>
                          <Clock size={12} color={Colors.light.textSecondary} />
                          <Text style={styles.appointmentMetaText}>{apt.time}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => cancelAppointment(apt.id)}
                      >
                        <X size={14} color={Colors.light.danger} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          </FadeIn>
        )}

        <FadeIn delay={50}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Healthcare Team</Text>
            <TouchableOpacity style={styles.addButton} onPress={openAddDoctor}>
              <Plus size={16} color={Colors.light.tint} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {doctors.length === 0 ? (
            <View style={styles.emptyState}>
              <Stethoscope size={32} color={Colors.light.textSecondary} />
              <Text style={styles.emptyText}>No doctors added yet</Text>
              <Text style={styles.emptyHint}>Add your healthcare providers to share reports</Text>
              <AnimatedPressable style={styles.emptyButton} onPress={openAddDoctor}>
                <Plus size={16} color="#fff" />
                <Text style={styles.emptyButtonText}>Add Doctor</Text>
              </AnimatedPressable>
            </View>
          ) : (
            <View style={styles.doctorsList}>
              {doctors.map((doctor) => {
                const reportsCount = getReportsForDoctor(doctor.id).length;
                const doctorAppointments = appointments.filter((a) => a.doctorId === doctor.id && a.status === "scheduled");

                return (
                  <View key={doctor.id} style={styles.doctorCard}>
                    <View style={styles.doctorHeader}>
                      <View style={styles.doctorAvatar}>
                        <Text style={styles.doctorInitial}>{doctor.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.doctorInfo}>
                        <Text style={styles.doctorName}>{doctor.name}</Text>
                        {doctor.specialty && (
                          <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => onDeleteDoctor(doctor)}
                      >
                        <Trash2 size={16} color={Colors.light.danger} />
                      </TouchableOpacity>
                    </View>

                    {(doctor.clinic || doctor.phone || doctor.email) && (
                      <View style={styles.doctorDetails}>
                        {doctor.clinic && (
                          <View style={styles.detailRow}>
                            <Building2 size={14} color={Colors.light.textSecondary} />
                            <Text style={styles.detailText}>{doctor.clinic}</Text>
                          </View>
                        )}
                        {doctor.phone && (
                          <View style={styles.detailRow}>
                            <Phone size={14} color={Colors.light.textSecondary} />
                            <Text style={styles.detailText}>{doctor.phone}</Text>
                          </View>
                        )}
                        {doctor.email && (
                          <View style={styles.detailRow}>
                            <Mail size={14} color={Colors.light.textSecondary} />
                            <Text style={styles.detailText}>{doctor.email}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    <View style={styles.doctorStats}>
                      <View style={styles.statItem}>
                        <FileText size={14} color={Colors.light.sapphire} />
                        <Text style={styles.statText}>{reportsCount} reports shared</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Calendar size={14} color={Colors.light.tint} />
                        <Text style={styles.statText}>{doctorAppointments.length} upcoming</Text>
                      </View>
                    </View>

                    <View style={styles.doctorActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => openAddAppointment(doctor)}
                      >
                        <Calendar size={16} color={Colors.light.tint} />
                        <Text style={styles.actionText}>Schedule</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonPrimary]}
                        onPress={() => openShareModal(doctor)}
                      >
                        <Share2 size={16} color="#fff" />
                        <Text style={[styles.actionText, { color: "#fff" }]}>Share Report</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </FadeIn>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Doctor Modal */}
      <Modal visible={addDoctorModal} transparent animationType="slide" onRequestClose={() => setAddDoctorModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Doctor</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setAddDoctorModal(false)}>
                <X size={18} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Name*</Text>
              <TextInput
                value={doctorForm.name}
                onChangeText={(v) => setDoctorForm((p) => ({ ...p, name: v }))}
                placeholder="Dr. Smith"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Specialty</Text>
              <TextInput
                value={doctorForm.specialty}
                onChangeText={(v) => setDoctorForm((p) => ({ ...p, specialty: v }))}
                placeholder="Endocrinologist"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Clinic/Hospital</Text>
              <TextInput
                value={doctorForm.clinic}
                onChangeText={(v) => setDoctorForm((p) => ({ ...p, clinic: v }))}
                placeholder="City Medical Center"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                value={doctorForm.phone}
                onChangeText={(v) => setDoctorForm((p) => ({ ...p, phone: v }))}
                placeholder="(555) 123-4567"
                keyboardType="phone-pad"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                value={doctorForm.email}
                onChangeText={(v) => setDoctorForm((p) => ({ ...p, email: v }))}
                placeholder="doctor@clinic.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                value={doctorForm.notes}
                onChangeText={(v) => setDoctorForm((p) => ({ ...p, notes: v }))}
                placeholder="Any additional notes..."
                multiline
                placeholderTextColor={Colors.light.textSecondary}
                style={[styles.input, styles.textArea]}
              />

              <AnimatedPressable style={styles.saveButton} onPress={onSaveDoctor}>
                <Text style={styles.saveButtonText}>Save Doctor</Text>
              </AnimatedPressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Appointment Modal */}
      <Modal visible={addAppointmentModal} transparent animationType="slide" onRequestClose={() => setAddAppointmentModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Schedule Appointment</Text>
                <Text style={styles.modalSubtitle}>with {selectedDoctor?.name}</Text>
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={() => setAddAppointmentModal(false)}>
                <X size={18} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Appointment Type</Text>
              <View style={styles.typeGrid}>
                {APPOINTMENT_TYPES.map((type) => {
                  const active = appointmentForm.type === type.key;
                  const Icon = type.icon;
                  return (
                    <TouchableOpacity
                      key={type.key}
                      style={[styles.typeButton, active && { backgroundColor: type.color, borderColor: type.color }]}
                      onPress={() => setAppointmentForm((p) => ({ ...p, type: type.key }))}
                    >
                      <Icon size={18} color={active ? "#fff" : type.color} />
                      <Text style={[styles.typeText, active && { color: "#fff" }]}>{type.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Date (YYYY-MM-DD)*</Text>
              <TextInput
                value={appointmentForm.date}
                onChangeText={(v) => setAppointmentForm((p) => ({ ...p, date: v }))}
                placeholder="2024-03-15"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Time (HH:MM)*</Text>
              <TextInput
                value={appointmentForm.time}
                onChangeText={(v) => setAppointmentForm((p) => ({ ...p, time: v }))}
                placeholder="14:30"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                value={appointmentForm.notes}
                onChangeText={(v) => setAppointmentForm((p) => ({ ...p, notes: v }))}
                placeholder="Bring lab results..."
                multiline
                placeholderTextColor={Colors.light.textSecondary}
                style={[styles.input, styles.textArea]}
              />

              <AnimatedPressable style={styles.saveButton} onPress={onSaveAppointment}>
                <Text style={styles.saveButtonText}>Schedule Appointment</Text>
              </AnimatedPressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Share Report Modal */}
      <Modal visible={shareModal} transparent animationType="slide" onRequestClose={() => setShareModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Share Report</Text>
                <Text style={styles.modalSubtitle}>with {selectedDoctor?.name}</Text>
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={() => setShareModal(false)}>
                <X size={18} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Select Report Period</Text>
            <View style={styles.periodGrid}>
              {REPORT_PERIODS.map((period) => {
                const active = selectedPeriod === period.key;
                return (
                  <TouchableOpacity
                    key={period.key}
                    style={[styles.periodButton, active && styles.periodButtonActive]}
                    onPress={() => setSelectedPeriod(period.key)}
                  >
                    <Text style={[styles.periodText, active && styles.periodTextActive]}>{period.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.reportPreview}>
              <FileText size={24} color={Colors.light.tint} />
              <View style={styles.reportPreviewContent}>
                <Text style={styles.reportPreviewTitle}>Comprehensive Health Report</Text>
                <Text style={styles.reportPreviewDesc}>
                  Includes glucose data, nutrition summary, activity streaks, and insights
                </Text>
              </View>
            </View>

            <AnimatedPressable style={styles.shareButton} onPress={onShareReport}>
              <Share2 size={18} color="#fff" />
              <Text style={styles.shareButtonText}>Share Report</Text>
            </AnimatedPressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.tintLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.tint,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#fff",
  },
  appointmentsList: {
    gap: 10,
  },
  appointmentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  appointmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  appointmentContent: {
    flex: 1,
    marginLeft: 12,
  },
  appointmentType: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  appointmentDoctor: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  appointmentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  appointmentMetaText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: "600" as const,
  },
  cancelButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.light.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },
  doctorsList: {
    gap: 12,
  },
  doctorCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  doctorHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.light.tintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  doctorInitial: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.light.tint,
  },
  doctorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },
  doctorDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  doctorStats: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
  },
  doctorActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.background,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  actionButtonPrimary: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.light.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  typeText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  periodGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  periodButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  periodText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  periodTextActive: {
    color: "#fff",
  },
  reportPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 16,
  },
  reportPreviewContent: {
    flex: 1,
    marginLeft: 12,
  },
  reportPreviewTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  reportPreviewDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800" as const,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.sapphire,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 20,
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800" as const,
  },
});
