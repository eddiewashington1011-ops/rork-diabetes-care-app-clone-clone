export interface SugarTip {
  id: string;
  title: string;
  description: string;
  type: "lower" | "raise" | "maintain";
  icon: string;
  details: string[];
}

export const sugarTips: SugarTip[] = [
  {
    id: "1",
    title: "Take a 15-Minute Walk",
    description: "Light exercise helps muscles use glucose for energy",
    type: "lower",
    icon: "🚶",
    details: [
      "Walk at a comfortable pace",
      "Best done 30 minutes after eating",
      "Can lower blood sugar by 10-20 mg/dL",
      "Make it a daily habit after meals"
    ]
  },
  {
    id: "2",
    title: "Drink More Water",
    description: "Staying hydrated helps kidneys flush out excess sugar",
    type: "lower",
    icon: "💧",
    details: [
      "Aim for 8-10 glasses daily",
      "Avoid sugary drinks and juices",
      "Water helps dilute blood glucose",
      "Set reminders to drink throughout the day"
    ]
  },
  {
    id: "3",
    title: "Eat Fiber-Rich Foods",
    description: "Fiber slows sugar absorption and improves control",
    type: "lower",
    icon: "🥬",
    details: [
      "Vegetables, legumes, and whole grains",
      "Aim for 25-30g fiber daily",
      "Add fiber gradually to avoid digestive issues",
      "Choose non-starchy vegetables first"
    ]
  },
  {
    id: "4",
    title: "Practice Deep Breathing",
    description: "Stress raises cortisol which increases blood sugar",
    type: "lower",
    icon: "🧘",
    details: [
      "Try 4-7-8 breathing technique",
      "Breathe in for 4 seconds, hold for 7, exhale for 8",
      "Practice for 5 minutes when stressed",
      "Reduces stress hormones that spike glucose"
    ]
  },
  {
    id: "5",
    title: "Glucose Tablets",
    description: "Fast-acting glucose for treating low blood sugar",
    type: "raise",
    icon: "🍬",
    details: [
      "Take 15-20 grams of fast-acting carbs",
      "Wait 15 minutes and recheck",
      "Follow the 15-15 rule",
      "Always carry glucose tablets with you"
    ]
  },
  {
    id: "6",
    title: "Fruit Juice (4 oz)",
    description: "Quick source of sugar when levels drop",
    type: "raise",
    icon: "🧃",
    details: [
      "Orange or apple juice works best",
      "Use only 4 ounces (half cup)",
      "Avoid diet or sugar-free versions",
      "Keep juice boxes handy for emergencies"
    ]
  },
  {
    id: "7",
    title: "Regular Glucose Snacks",
    description: "Prevent lows by eating regular, balanced snacks",
    type: "raise",
    icon: "🍎",
    details: [
      "Eat every 3-4 hours",
      "Combine carbs with protein",
      "Examples: apple with peanut butter",
      "Don't skip meals or snacks"
    ]
  },
  {
    id: "8",
    title: "Eat Balanced Meals",
    description: "Consistent meals help maintain stable glucose levels",
    type: "maintain",
    icon: "🍽️",
    details: [
      "Include protein, healthy fats, and fiber",
      "Use the plate method: 50% vegetables",
      "Eat at regular times each day",
      "Control portion sizes"
    ]
  },
  {
    id: "9",
    title: "Monitor Regularly",
    description: "Track patterns to understand your body's responses",
    type: "maintain",
    icon: "📊",
    details: [
      "Check before and after meals",
      "Log your readings and what you ate",
      "Look for patterns over time",
      "Share logs with your healthcare team"
    ]
  },
  {
    id: "10",
    title: "Get Quality Sleep",
    description: "Poor sleep affects insulin sensitivity and cravings",
    type: "maintain",
    icon: "😴",
    details: [
      "Aim for 7-8 hours nightly",
      "Keep a consistent sleep schedule",
      "Avoid screens before bed",
      "Create a dark, cool sleeping environment"
    ]
  },
  {
    id: "11",
    title: "Apple Cider Vinegar",
    description: "May help improve insulin sensitivity when taken before meals",
    type: "lower",
    icon: "🍎",
    details: [
      "Dilute 1-2 tbsp in water",
      "Drink before high-carb meals",
      "Don't drink undiluted",
      "Consult doctor if on diabetes medications"
    ]
  },
  {
    id: "12",
    title: "Honey or Regular Soda",
    description: "Emergency treatment for severe low blood sugar",
    type: "raise",
    icon: "🍯",
    details: [
      "Use 1 tablespoon honey or 4oz regular soda",
      "Only for treating hypoglycemia",
      "Not for regular consumption",
      "Follow up with a protein snack"
    ]
  }
];

export const quickStats = [
  { label: "Target Range", value: "70-130 mg/dL", sublabel: "Before meals" },
  { label: "After Meals", value: "<180 mg/dL", sublabel: "1-2 hours post" },
  { label: "A1C Goal", value: "<7%", sublabel: "For most adults" },
];
