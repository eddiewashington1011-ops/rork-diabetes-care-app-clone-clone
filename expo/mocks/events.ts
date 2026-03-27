export interface DiabetesEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: "appointment" | "reminder" | "medication" | "checkup" | "community";
  icon: string;
  color: string;
  location?: string;
  notes?: string;
}

export const eventTypes = [
  { id: "all", name: "All Events", icon: "📅" },
  { id: "appointment", name: "Appointments", icon: "👨‍⚕️" },
  { id: "medication", name: "Medications", icon: "💊" },
  { id: "checkup", name: "Check-ups", icon: "🔬" },
  { id: "reminder", name: "Reminders", icon: "⏰" },
  { id: "community", name: "Community", icon: "👥" },
];

export const events: DiabetesEvent[] = [
  {
    id: "1",
    title: "Endocrinologist Appointment",
    description: "Quarterly check-up with Dr. Sarah Johnson",
    date: "2024-01-25",
    time: "10:00 AM",
    type: "appointment",
    icon: "👨‍⚕️",
    color: "#0D9488",
    location: "Diabetes Care Center, Suite 302",
    notes: "Bring recent blood sugar logs and medication list"
  },
  {
    id: "2",
    title: "Morning Insulin",
    description: "Take morning insulin dose with breakfast",
    date: "2024-01-23",
    time: "7:30 AM",
    type: "medication",
    icon: "💊",
    color: "#F59E0B"
  },
  {
    id: "3",
    title: "Blood Sugar Check",
    description: "Post-lunch glucose monitoring",
    date: "2024-01-23",
    time: "2:00 PM",
    type: "reminder",
    icon: "🩸",
    color: "#EF4444"
  },
  {
    id: "4",
    title: "HbA1c Lab Test",
    description: "Quarterly A1C blood test",
    date: "2024-01-28",
    time: "8:00 AM",
    type: "checkup",
    icon: "🔬",
    color: "#8B5CF6",
    location: "Central Lab, Building A",
    notes: "Fasting required - no food after midnight"
  },
  {
    id: "5",
    title: "Diabetes Support Group",
    description: "Monthly community meeting and discussion",
    date: "2024-01-30",
    time: "6:00 PM",
    type: "community",
    icon: "👥",
    color: "#10B981",
    location: "Community Health Center, Room 105",
    notes: "This month's topic: Managing Holiday Meals"
  },
  {
    id: "6",
    title: "Evening Medication",
    description: "Take evening metformin with dinner",
    date: "2024-01-23",
    time: "6:30 PM",
    type: "medication",
    icon: "💊",
    color: "#F59E0B"
  },
  {
    id: "7",
    title: "Eye Exam",
    description: "Annual diabetic eye screening",
    date: "2024-02-05",
    time: "11:00 AM",
    type: "checkup",
    icon: "👁️",
    color: "#8B5CF6",
    location: "Vision Care Associates",
    notes: "Dilated exam - bring sunglasses, arrange transportation"
  },
  {
    id: "8",
    title: "Foot Care Check",
    description: "Quarterly podiatrist visit",
    date: "2024-02-12",
    time: "3:00 PM",
    type: "appointment",
    icon: "🦶",
    color: "#0D9488",
    location: "Foot & Ankle Clinic"
  },
  {
    id: "9",
    title: "Nutrition Consultation",
    description: "Follow-up with registered dietitian",
    date: "2024-02-08",
    time: "2:00 PM",
    type: "appointment",
    icon: "🥗",
    color: "#0D9488",
    location: "Wellness Center, Suite 205",
    notes: "Bring 3-day food diary"
  },
  {
    id: "10",
    title: "Diabetes Walk Event",
    description: "Annual charity walk for diabetes awareness",
    date: "2024-02-15",
    time: "9:00 AM",
    type: "community",
    icon: "🚶",
    color: "#10B981",
    location: "Riverside Park",
    notes: "5K walk/run - registration at 8:00 AM"
  }
];
