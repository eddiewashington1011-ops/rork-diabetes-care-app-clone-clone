export interface Exercise {
  id: string;
  title: string;
  description: string;
  image: string;
  duration: number;
  intensity: "Low" | "Medium" | "High";
  category: string;
  caloriesBurned: number;
  benefits: string[];
  steps: string[];
  precautions: string[];
}

export const exerciseCategories = [
  { id: "all", name: "All", icon: "🏃" },
  { id: "cardio", name: "Cardio", icon: "❤️" },
  { id: "strength", name: "Strength", icon: "💪" },
  { id: "flexibility", name: "Flexibility", icon: "🧘" },
  { id: "walking", name: "Walking", icon: "🚶" },
];

export const exercises: Exercise[] = [
  {
    id: "1",
    title: "Morning Walk",
    description: "A gentle 30-minute walk to start your day and help regulate blood sugar",
    image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400",
    duration: 30,
    intensity: "Low",
    category: "walking",
    caloriesBurned: 120,
    benefits: [
      "Improves insulin sensitivity",
      "Lowers blood sugar after meals",
      "Reduces stress hormones",
      "Boosts mood and energy"
    ],
    steps: [
      "Start with a 5-minute warm-up at a slow pace",
      "Gradually increase to a brisk walking pace",
      "Maintain good posture - shoulders back, core engaged",
      "Swing arms naturally for added calorie burn",
      "Cool down with 5 minutes of slow walking"
    ],
    precautions: [
      "Wear comfortable, supportive shoes",
      "Carry fast-acting glucose in case of low blood sugar",
      "Stay hydrated throughout",
      "Check blood sugar before and after exercise"
    ]
  },
  {
    id: "2",
    title: "Chair Yoga",
    description: "Gentle stretching and breathing exercises perfect for all fitness levels",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
    duration: 20,
    intensity: "Low",
    category: "flexibility",
    caloriesBurned: 60,
    benefits: [
      "Increases flexibility and balance",
      "Reduces stress and anxiety",
      "Improves circulation",
      "Gentle on joints"
    ],
    steps: [
      "Sit comfortably in a sturdy chair",
      "Begin with deep breathing - 5 slow breaths",
      "Gentle neck rolls - 5 each direction",
      "Seated cat-cow stretches - 10 repetitions",
      "Seated twists - hold 30 seconds each side",
      "Ankle circles and toe points",
      "End with 2 minutes of meditation"
    ],
    precautions: [
      "Use a stable chair without wheels",
      "Move slowly and mindfully",
      "Don't push past your comfort zone",
      "Keep breathing steady throughout"
    ]
  },
  {
    id: "3",
    title: "Resistance Band Workout",
    description: "Build strength and improve glucose uptake with this full-body routine",
    image: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400",
    duration: 25,
    intensity: "Medium",
    category: "strength",
    caloriesBurned: 150,
    benefits: [
      "Builds muscle mass which improves metabolism",
      "Enhances insulin sensitivity",
      "Increases bone density",
      "Improves balance and stability"
    ],
    steps: [
      "Warm up with 5 minutes of marching in place",
      "Bicep curls - 12 reps, 3 sets",
      "Shoulder press - 10 reps, 3 sets",
      "Seated rows - 12 reps, 3 sets",
      "Leg press against band - 15 reps, 2 sets",
      "Standing side steps with band - 20 each side",
      "Cool down with gentle stretching"
    ],
    precautions: [
      "Start with lighter resistance bands",
      "Maintain controlled movements",
      "Rest 60 seconds between sets",
      "Stop if you feel dizzy or unwell"
    ]
  },
  {
    id: "4",
    title: "Swimming",
    description: "Low-impact full-body workout that's easy on the joints",
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400",
    duration: 30,
    intensity: "Medium",
    category: "cardio",
    caloriesBurned: 200,
    benefits: [
      "Zero joint impact",
      "Full body workout",
      "Excellent cardiovascular exercise",
      "Helps lower blood pressure"
    ],
    steps: [
      "Start with 5 minutes of easy swimming",
      "Swim 4 laps at moderate pace",
      "Rest 1 minute",
      "Repeat for 20 minutes",
      "Include different strokes for variety",
      "Cool down with 5 minutes of gentle movement"
    ],
    precautions: [
      "Never swim alone",
      "Keep glucose tablets poolside",
      "Dry feet thoroughly after to prevent infections",
      "Check blood sugar before entering water"
    ]
  },
  {
    id: "5",
    title: "Stationary Cycling",
    description: "Great cardio option that you can do at any intensity",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
    duration: 20,
    intensity: "Medium",
    category: "cardio",
    caloriesBurned: 180,
    benefits: [
      "Improves cardiovascular health",
      "Low impact on knees and ankles",
      "Easy to control intensity",
      "Can be done in any weather"
    ],
    steps: [
      "Adjust seat to proper height",
      "Start with 3 minutes easy pedaling",
      "Increase resistance to moderate level",
      "Maintain steady cadence for 15 minutes",
      "Vary resistance every few minutes",
      "Cool down with 2 minutes easy pedaling"
    ],
    precautions: [
      "Start slowly if new to cycling",
      "Keep water bottle nearby",
      "Don't grip handlebars too tightly",
      "Monitor how you feel throughout"
    ]
  },
  {
    id: "6",
    title: "Post-Meal Walk",
    description: "A short walk after eating to help manage blood sugar spikes",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    duration: 15,
    intensity: "Low",
    category: "walking",
    caloriesBurned: 60,
    benefits: [
      "Reduces post-meal glucose spikes",
      "Aids digestion",
      "Prevents energy crashes",
      "Easy to incorporate daily"
    ],
    steps: [
      "Wait 15-30 minutes after eating",
      "Walk at a comfortable, easy pace",
      "Focus on breathing deeply",
      "Walk for 10-15 minutes",
      "Can be done indoors or outdoors"
    ],
    precautions: [
      "Don't walk immediately after large meals",
      "Keep pace gentle - this isn't intense exercise",
      "Stay close to home or work",
      "Ideal after breakfast, lunch, and dinner"
    ]
  },
  {
    id: "7",
    title: "Balance Exercises",
    description: "Improve stability and prevent falls with these simple exercises",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400",
    duration: 15,
    intensity: "Low",
    category: "flexibility",
    caloriesBurned: 40,
    benefits: [
      "Improves proprioception",
      "Reduces fall risk",
      "Strengthens stabilizer muscles",
      "Can be done anywhere"
    ],
    steps: [
      "Stand near a wall or chair for support",
      "Single leg stands - 30 seconds each leg",
      "Heel-to-toe walking - 20 steps",
      "Standing on tiptoes - 10 reps",
      "Side leg raises - 10 each side",
      "Practice daily for best results"
    ],
    precautions: [
      "Always have something to hold onto nearby",
      "Progress gradually",
      "Wear non-slip footwear",
      "Practice in a clear, open area"
    ]
  },
  {
    id: "8",
    title: "Light Dumbbell Routine",
    description: "Build functional strength with light weights",
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400",
    duration: 30,
    intensity: "Medium",
    category: "strength",
    caloriesBurned: 130,
    benefits: [
      "Increases muscle mass",
      "Boosts resting metabolism",
      "Improves daily functional strength",
      "Enhances glucose utilization"
    ],
    steps: [
      "Warm up with arm circles and marching",
      "Dumbbell squats - 12 reps, 3 sets",
      "Chest press - 10 reps, 3 sets",
      "Bent over rows - 12 reps, 3 sets",
      "Overhead press - 10 reps, 2 sets",
      "Bicep curls - 12 reps, 2 sets",
      "Cool down and stretch"
    ],
    precautions: [
      "Start with 2-5 lb weights",
      "Focus on form over weight",
      "Breathe out on exertion",
      "Have a snack if exercising for extended time"
    ]
  }
];
