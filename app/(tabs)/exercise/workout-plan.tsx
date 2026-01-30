import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import {
  Plus,
  X,
  Clock,
  Flame,
  Check,
  Moon,
  ChevronDown,
  ChevronUp,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Calendar,
  RotateCcw,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useWorkoutPlan, DayOfWeek, DAYS_OF_WEEK, DAY_LABELS } from "@/providers/workoutPlan";
import { exercises, exerciseCategories, Exercise } from "@/mocks/exercises";

function ExercisePickerItem({
  exercise,
  isSelected,
  onToggle,
}: {
  exercise: Exercise;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Image source={{ uri: exercise.image }} style={styles.pickerImage} />
      <View style={styles.pickerInfo}>
        <Text style={styles.pickerTitle} numberOfLines={1}>
          {exercise.title}
        </Text>
        <View style={styles.pickerMeta}>
          <Clock size={12} color={Colors.light.textSecondary} />
          <Text style={styles.pickerMetaText}>{exercise.duration} min</Text>
          <Flame size={12} color={Colors.light.accent} />
          <Text style={styles.pickerMetaText}>{exercise.caloriesBurned} cal</Text>
        </View>
      </View>
      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected && <Check size={14} color="#fff" />}
      </View>
    </TouchableOpacity>
  );
}

function DayCard({
  day,
  label,
  isToday,
  onAddExercise,
}: {
  day: DayOfWeek;
  label: string;
  isToday: boolean;
  onAddExercise: (day: DayOfWeek) => void;
}) {
  const {
    workoutPlan,
    getExercisesForDay,
    removeExerciseFromDay,
    toggleRestDay,
    getTotalDuration,
    getTotalCalories,
    isCurrentWeek,
  } = useWorkoutPlan();
  const [expanded, setExpanded] = useState(isToday && isCurrentWeek);

  const dayPlan = workoutPlan[day];
  const dayExercises = getExercisesForDay(day);
  const totalDuration = getTotalDuration(day);
  const totalCalories = getTotalCalories(day);

  const showToday = isToday && isCurrentWeek;

  return (
    <View style={[styles.dayCard, showToday && styles.dayCardToday]}>
      <TouchableOpacity
        style={styles.dayHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.dayHeaderLeft}>
          <View style={[styles.dayBadge, showToday && styles.dayBadgeToday]}>
            <Text style={[styles.dayBadgeText, showToday && styles.dayBadgeTextToday]}>
              {label.slice(0, 3)}
            </Text>
          </View>
          <View style={styles.dayInfo}>
            <Text style={[styles.dayLabel, showToday && styles.dayLabelToday]}>{label}</Text>
            {dayPlan.restDay ? (
              <Text style={styles.restDayText}>Rest Day</Text>
            ) : dayExercises.length > 0 ? (
              <Text style={styles.dayStats}>
                {dayExercises.length} workout{dayExercises.length > 1 ? "s" : ""} • {totalDuration} min • {totalCalories} cal
              </Text>
            ) : (
              <Text style={styles.noWorkoutText}>No workouts planned</Text>
            )}
          </View>
        </View>
        {expanded ? (
          <ChevronUp size={20} color={Colors.light.textSecondary} />
        ) : (
          <ChevronDown size={20} color={Colors.light.textSecondary} />
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.dayContent}>
          {dayPlan.restDay ? (
            <View style={styles.restDayCard}>
              <Moon size={24} color={Colors.light.tint} />
              <Text style={styles.restDayCardText}>This is a rest day</Text>
              <TouchableOpacity
                style={styles.cancelRestButton}
                onPress={() => toggleRestDay(day)}
              >
                <Text style={styles.cancelRestText}>Add workouts</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {dayExercises.map((exercise) => (
                <View key={exercise.id} style={styles.exerciseItem}>
                  <Image source={{ uri: exercise.image }} style={styles.exerciseItemImage} />
                  <View style={styles.exerciseItemInfo}>
                    <Text style={styles.exerciseItemTitle}>{exercise.title}</Text>
                    <Text style={styles.exerciseItemMeta}>
                      {exercise.duration} min • {exercise.caloriesBurned} cal
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeExerciseFromDay(day, exercise.id)}
                  >
                    <Trash2 size={16} color={Colors.light.danger} />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.dayActions}>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => onAddExercise(day)}
                >
                  <Plus size={16} color={Colors.light.tint} />
                  <Text style={styles.addButtonText}>Add Exercise</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.restButton}
                  onPress={() => toggleRestDay(day)}
                >
                  <Moon size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.restButtonText}>Set Rest Day</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

export default function WorkoutPlanScreen() {
  const {
    getCurrentDayOfWeek,
    addExerciseToDay,
    workoutPlan,
    selectedWeekKey,
    isCurrentWeek,
    weekLabel,
    navigateWeek,
    goToCurrentWeek,
    copyToNextWeek,
    clearWeek,
    getWeeklyStats,
    formatWeekRange,
  } = useWorkoutPlan();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  

  const today = getCurrentDayOfWeek();
  const weeklyStats = useMemo(() => getWeeklyStats(selectedWeekKey), [getWeeklyStats, selectedWeekKey]);

  const openExercisePicker = useCallback((day: DayOfWeek) => {
    setSelectedDay(day);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelectedDay(null);
  }, []);

  const handleToggleExercise = useCallback(
    (exerciseId: string) => {
      if (!selectedDay) return;
      const dayPlan = workoutPlan[selectedDay];
      if (dayPlan.exerciseIds.includes(exerciseId)) {
        return;
      }
      addExerciseToDay(selectedDay, exerciseId);
    },
    [selectedDay, addExerciseToDay, workoutPlan]
  );

  const filteredExercises = useMemo(() => {
    if (filterCategory === "all") return exercises;
    return exercises.filter((e) => e.category === filterCategory);
  }, [filterCategory]);

  const selectedExerciseIds = useMemo(() => {
    if (!selectedDay) return [];
    return workoutPlan[selectedDay]?.exerciseIds ?? [];
  }, [selectedDay, workoutPlan]);

  const handleCopyToNextWeek = useCallback(() => {
    Alert.alert(
      "Copy to Next Week",
      "This will copy all workouts from this week to next week. Any existing workouts next week will be replaced.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Copy",
          onPress: () => {
            copyToNextWeek();
          },
        },
      ]
    );
  }, [copyToNextWeek]);

  const handleClearWeek = useCallback(() => {
    Alert.alert(
      "Clear Week",
      "This will remove all workouts from this week. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            clearWeek();
          },
        },
      ]
    );
  }, [clearWeek]);

  return (
    <View style={styles.container}>
      <View style={styles.weekNavContainer}>
        <View style={styles.weekNav}>
          <TouchableOpacity
            style={styles.weekNavButton}
            onPress={() => navigateWeek("prev")}
            activeOpacity={0.7}
          >
            <ChevronLeft size={22} color={Colors.light.tint} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.weekLabelContainer}
            onPress={goToCurrentWeek}
            activeOpacity={0.7}
          >
            <Calendar size={16} color={Colors.light.tint} />
            <View style={styles.weekLabelText}>
              <Text style={styles.weekLabel}>{weekLabel}</Text>
              <Text style={styles.weekRange}>{formatWeekRange(selectedWeekKey)}</Text>
            </View>
            {!isCurrentWeek && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>Go to today</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.weekNavButton}
            onPress={() => navigateWeek("next")}
            activeOpacity={0.7}
          >
            <ChevronRight size={22} color={Colors.light.tint} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekActions}>
          <TouchableOpacity
            style={styles.weekActionButton}
            onPress={handleCopyToNextWeek}
            activeOpacity={0.7}
          >
            <Copy size={16} color={Colors.light.tint} />
            <Text style={styles.weekActionText}>Copy to next</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.weekActionButton, styles.weekActionButtonDanger]}
            onPress={handleClearWeek}
            activeOpacity={0.7}
          >
            <RotateCcw size={16} color={Colors.light.danger} />
            <Text style={[styles.weekActionText, styles.weekActionTextDanger]}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Weekly Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{weeklyStats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{weeklyStats.totalDuration}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{weeklyStats.totalCalories}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{weeklyStats.restDays}</Text>
            <Text style={styles.statLabel}>Rest Days</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {DAYS_OF_WEEK.map((day) => (
          <DayCard
            key={day}
            day={day}
            label={DAY_LABELS[day]}
            isToday={day === today}
            onAddExercise={openExercisePicker}
          />
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add Exercise to {selectedDay ? DAY_LABELS[selectedDay] : ""}
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContainer}
            >
              {exerciseCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.filterChip,
                    filterCategory === cat.id && styles.filterChipActive,
                  ]}
                  onPress={() => setFilterCategory(cat.id)}
                >
                  <Text style={styles.filterIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.filterText,
                      filterCategory === cat.id && styles.filterTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ExercisePickerItem
                  exercise={item}
                  isSelected={selectedExerciseIds.includes(item.id)}
                  onToggle={() => handleToggleExercise(item.id)}
                />
              )}
              contentContainerStyle={styles.pickerList}
              showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity style={styles.doneButton} onPress={closeModal}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
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
  weekNavContainer: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weekNavButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.tintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  weekLabelContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  weekLabelText: {
    alignItems: "center",
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
  },
  weekRange: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  todayBadge: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 4,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  weekActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  weekActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.light.tintLight,
  },
  weekActionButtonDanger: {
    backgroundColor: Colors.light.dangerLight,
  },
  weekActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.tint,
  },
  weekActionTextDanger: {
    color: Colors.light.danger,
  },
  statsCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 16,
    padding: 16,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  dayCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dayCardToday: {
    borderColor: Colors.light.tint,
    borderWidth: 2,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  dayHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dayBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadgeToday: {
    backgroundColor: Colors.light.tint,
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
  },
  dayBadgeTextToday: {
    color: "#fff",
  },
  dayInfo: {
    marginLeft: 12,
    flex: 1,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
  },
  dayLabelToday: {
    color: Colors.light.tint,
  },
  dayStats: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  noWorkoutText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontStyle: "italic",
  },
  restDayText: {
    fontSize: 12,
    color: Colors.light.tint,
    marginTop: 2,
    fontWeight: "500",
  },
  dayContent: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  restDayCard: {
    backgroundColor: Colors.light.tintLight,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  restDayCardText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: "500",
  },
  cancelRestButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
  },
  cancelRestText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  exerciseItemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  exerciseItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  exerciseItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  exerciseItemMeta: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.light.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },
  dayActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  addButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.light.tintLight,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.tint,
  },
  restButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.light.background,
  },
  restButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  filterScroll: {
    maxHeight: 50,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  filterIcon: {
    fontSize: 12,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  filterTextActive: {
    color: "#fff",
  },
  pickerList: {
    padding: 16,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  pickerItemSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tintLight,
  },
  pickerImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  pickerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  pickerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pickerMetaText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginRight: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  doneButton: {
    margin: 16,
    marginTop: 8,
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
