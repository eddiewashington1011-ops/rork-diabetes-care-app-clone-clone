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
  },
  {
    id: "9",
    title: "Tai Chi",
    description: "Ancient flowing movements that reduce stress and improve balance",
    image: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=400",
    duration: 25,
    intensity: "Low",
    category: "flexibility",
    caloriesBurned: 80,
    benefits: [
      "Reduces stress and cortisol levels",
      "Improves balance and coordination",
      "Lowers blood pressure naturally",
      "Enhances mind-body connection"
    ],
    steps: [
      "Stand with feet shoulder-width apart",
      "Begin with deep breathing - 2 minutes",
      "Practice weight shifting side to side",
      "Perform slow arm circles with breathing",
      "Practice the 'Parting the Wild Horse's Mane' movement",
      "Flow through 'Wave Hands Like Clouds'",
      "End with standing meditation - 3 minutes"
    ],
    precautions: [
      "Move slowly and deliberately",
      "Keep knees slightly bent, never locked",
      "Practice on a flat, non-slip surface",
      "Focus on breath rather than perfect form"
    ]
  },
  {
    id: "10",
    title: "Water Aerobics",
    description: "Fun pool workout that's gentle on joints while building strength",
    image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400",
    duration: 35,
    intensity: "Medium",
    category: "cardio",
    caloriesBurned: 220,
    benefits: [
      "Zero impact on joints",
      "Water resistance builds muscle",
      "Keeps body cool during exercise",
      "Great for arthritis and joint pain"
    ],
    steps: [
      "Enter pool at waist-to-chest depth",
      "Warm up with walking in water - 5 minutes",
      "High knee marching - 3 minutes",
      "Jumping jacks in water - 2 minutes",
      "Cross-country ski movements - 3 minutes",
      "Arm sweeps against water resistance - 3 minutes",
      "Treading water intervals - 5 minutes",
      "Cool down with gentle floating stretches"
    ],
    precautions: [
      "Stay in shallow end if not a strong swimmer",
      "Keep glucose tablets in a waterproof container nearby",
      "Shower after to prevent skin irritation",
      "Check feet for cuts before and after"
    ]
  },
  {
    id: "11",
    title: "Dance Cardio",
    description: "Get moving to your favorite music for a fun cardio session",
    image: "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=400",
    duration: 25,
    intensity: "Medium",
    category: "cardio",
    caloriesBurned: 190,
    benefits: [
      "Improves cardiovascular fitness",
      "Boosts mood with endorphins",
      "Enhances coordination and memory",
      "Makes exercise feel like fun"
    ],
    steps: [
      "Choose upbeat music you enjoy",
      "Warm up with gentle swaying - 3 minutes",
      "Add simple step-touches side to side",
      "Incorporate arm movements",
      "Try grapevine steps and turns",
      "Build to more energetic movements",
      "Cool down with slow dancing - 3 minutes"
    ],
    precautions: [
      "Wear supportive athletic shoes",
      "Clear enough floor space",
      "Take breaks when needed",
      "Keep water nearby and stay hydrated"
    ]
  },
  {
    id: "12",
    title: "Pilates Mat Workout",
    description: "Core-focused exercises that build strength and flexibility",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400",
    duration: 30,
    intensity: "Medium",
    category: "strength",
    caloriesBurned: 140,
    benefits: [
      "Strengthens core muscles",
      "Improves posture and alignment",
      "Increases flexibility",
      "Builds lean muscle mass"
    ],
    steps: [
      "Lie on mat, find neutral spine position",
      "The Hundred - 100 arm pumps with breathing",
      "Single leg circles - 5 each direction per leg",
      "Rolling like a ball - 8 rolls",
      "Single leg stretch - 10 each leg",
      "Spine stretch forward - 5 reps",
      "Swan prep - 5 reps",
      "Rest in child's pose - 2 minutes"
    ],
    precautions: [
      "Keep core engaged throughout",
      "Don't strain neck during ab exercises",
      "Modify movements as needed",
      "Use a cushioned mat for comfort"
    ]
  },
  {
    id: "13",
    title: "Morning Stretch Routine",
    description: "Wake up your body with gentle stretches to start the day right",
    image: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=400",
    duration: 10,
    intensity: "Low",
    category: "flexibility",
    caloriesBurned: 30,
    benefits: [
      "Increases blood flow after sleep",
      "Reduces morning stiffness",
      "Prepares body for the day",
      "Improves mental alertness"
    ],
    steps: [
      "Start lying in bed with full body stretch",
      "Gentle knee-to-chest pulls - 30 seconds each",
      "Seated spinal twist - 30 seconds each side",
      "Standing forward fold - hold 30 seconds",
      "Overhead reach with side bends",
      "Gentle neck circles - 5 each direction",
      "Finish with 5 deep breaths"
    ],
    precautions: [
      "Move slowly when first waking",
      "Never bounce in stretches",
      "Stop if any sharp pain occurs",
      "Check blood sugar if feeling lightheaded"
    ]
  },
  {
    id: "14",
    title: "Bodyweight Circuit",
    description: "No equipment needed for this effective strength training routine",
    image: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=400",
    duration: 25,
    intensity: "High",
    category: "strength",
    caloriesBurned: 200,
    benefits: [
      "Builds functional strength",
      "Increases metabolism for hours after",
      "No gym or equipment required",
      "Improves insulin sensitivity"
    ],
    steps: [
      "Warm up with jumping jacks - 2 minutes",
      "Wall push-ups or regular push-ups - 10 reps",
      "Bodyweight squats - 15 reps",
      "Lunges - 10 each leg",
      "Plank hold - 30 seconds",
      "Rest 1 minute, repeat circuit 3 times",
      "Cool down with gentle stretching"
    ],
    precautions: [
      "Have a snack beforehand for high intensity",
      "Monitor blood sugar closely",
      "Keep glucose nearby",
      "Modify exercises to your fitness level"
    ]
  },
  {
    id: "15",
    title: "Nature Hiking",
    description: "Connect with nature while getting great exercise on trails",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400",
    duration: 45,
    intensity: "Medium",
    category: "walking",
    caloriesBurned: 250,
    benefits: [
      "Burns more calories than flat walking",
      "Reduces stress through nature exposure",
      "Builds leg strength on varied terrain",
      "Improves mental wellbeing"
    ],
    steps: [
      "Choose a trail appropriate for your level",
      "Start with 10 minutes of easy pace",
      "Maintain steady breathing on inclines",
      "Take short breaks to enjoy surroundings",
      "Use trekking poles if available",
      "Allow 10 minutes for cool down walk"
    ],
    precautions: [
      "Bring extra snacks and water",
      "Wear proper hiking footwear",
      "Tell someone your hiking plans",
      "Carry phone and emergency supplies"
    ]
  },
  {
    id: "16",
    title: "Desk Exercises",
    description: "Quick movements to stay active during your workday",
    image: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=400",
    duration: 10,
    intensity: "Low",
    category: "flexibility",
    caloriesBurned: 35,
    benefits: [
      "Breaks up long sitting periods",
      "Improves circulation",
      "Reduces neck and back tension",
      "Can be done in work clothes"
    ],
    steps: [
      "Seated leg raises under desk - 10 each leg",
      "Desk push-ups - 10 reps",
      "Seated spinal twists - 5 each side",
      "Shoulder shrugs and rolls - 10 reps",
      "Wrist circles and stretches",
      "Standing calf raises - 15 reps",
      "March in place - 1 minute"
    ],
    precautions: [
      "Move chair away from desk for some exercises",
      "Keep movements controlled and quiet",
      "Set reminders to exercise every 2 hours",
      "Drink water during breaks"
    ]
  },
  {
    id: "17",
    title: "Interval Walking",
    description: "Alternate between fast and slow walking for better results",
    image: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=400",
    duration: 25,
    intensity: "Medium",
    category: "walking",
    caloriesBurned: 160,
    benefits: [
      "Burns more calories than steady walking",
      "Improves cardiovascular fitness faster",
      "Better blood sugar control",
      "Keeps workouts interesting"
    ],
    steps: [
      "Warm up with 5 minutes easy walking",
      "Walk fast for 1 minute (can still talk)",
      "Walk slow for 2 minutes to recover",
      "Repeat fast/slow intervals 6 times",
      "Cool down with 5 minutes easy pace"
    ],
    precautions: [
      "Don't push to running intensity",
      "Use a timer or watch to track intervals",
      "Stay aware of how you feel",
      "Reduce intensity if feeling unwell"
    ]
  },
  {
    id: "18",
    title: "Standing Core Workout",
    description: "Strengthen your core without getting on the floor",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    duration: 15,
    intensity: "Medium",
    category: "strength",
    caloriesBurned: 90,
    benefits: [
      "No floor exercises required",
      "Improves posture",
      "Supports lower back health",
      "Enhances balance"
    ],
    steps: [
      "Stand with feet hip-width apart",
      "Standing crunches - bring knee to elbow, 15 each side",
      "Standing oblique crunches - 12 each side",
      "Standing bicycle - 20 total",
      "Wood chops without weight - 10 each side",
      "Standing bird dog - 10 each side",
      "Finish with standing cat-cow stretches"
    ],
    precautions: [
      "Keep a chair nearby for balance support",
      "Engage core throughout all movements",
      "Move with control, not speed",
      "Breathe steadily throughout"
    ]
  },
  {
    id: "19",
    title: "Gentle Yoga Flow",
    description: "A calming yoga sequence perfect for stress relief and flexibility",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400",
    duration: 30,
    intensity: "Low",
    category: "flexibility",
    caloriesBurned: 100,
    benefits: [
      "Reduces cortisol and stress",
      "Improves sleep quality",
      "Increases flexibility over time",
      "Promotes mindfulness"
    ],
    steps: [
      "Begin in comfortable seated position",
      "Cat-cow stretches - 10 rounds",
      "Downward facing dog - hold 5 breaths",
      "Low lunge with arms raised - each side",
      "Warrior II pose - hold 5 breaths each side",
      "Seated forward fold - hold 1 minute",
      "Legs up the wall - 5 minutes",
      "Final relaxation in savasana - 5 minutes"
    ],
    precautions: [
      "Use props like blocks and straps as needed",
      "Never force your body into poses",
      "Focus on breath over depth of stretch",
      "Skip inversions if you have high blood pressure"
    ]
  },
  {
    id: "20",
    title: "Stair Climbing",
    description: "Use stairs at home or work for an effective cardio workout",
    image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400",
    duration: 15,
    intensity: "High",
    category: "cardio",
    caloriesBurned: 150,
    benefits: [
      "Excellent cardiovascular challenge",
      "Strengthens legs and glutes",
      "Burns calories efficiently",
      "Can be done anywhere with stairs"
    ],
    steps: [
      "Find a safe staircase with handrail",
      "Warm up walking up slowly - 2 minutes",
      "Climb at moderate pace for 1 minute",
      "Walk down slowly (use handrail)",
      "Repeat 5-8 times based on fitness",
      "End with gentle stretching"
    ],
    precautions: [
      "Always use handrail when available",
      "Watch foot placement carefully",
      "Start with fewer repetitions",
      "Stop if dizzy or short of breath"
    ]
  },
  {
    id: "21",
    title: "Arm Toning Workout",
    description: "Target arms and shoulders with or without light weights",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    duration: 20,
    intensity: "Medium",
    category: "strength",
    caloriesBurned: 110,
    benefits: [
      "Tones arms and shoulders",
      "Improves upper body strength",
      "Helps with daily lifting tasks",
      "Can use household items as weights"
    ],
    steps: [
      "Arm circles - 30 seconds each direction",
      "Bicep curls - 15 reps, 2 sets",
      "Tricep dips on chair - 12 reps, 2 sets",
      "Shoulder press - 12 reps, 2 sets",
      "Lateral raises - 10 reps, 2 sets",
      "Front raises - 10 reps, 2 sets",
      "Tricep kickbacks - 12 reps each arm",
      "Stretch arms and shoulders"
    ],
    precautions: [
      "Use water bottles if no weights available",
      "Keep elbows slightly bent",
      "Don't swing or use momentum",
      "Rest between sets as needed"
    ]
  },
  {
    id: "22",
    title: "Evening Wind Down",
    description: "Relaxing movements to prepare your body for restful sleep",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
    duration: 15,
    intensity: "Low",
    category: "flexibility",
    caloriesBurned: 40,
    benefits: [
      "Promotes better sleep quality",
      "Releases tension from the day",
      "Calms the nervous system",
      "Helps maintain healthy blood sugar overnight"
    ],
    steps: [
      "Gentle neck stretches - 1 minute",
      "Shoulder and chest opener - 1 minute",
      "Seated spinal twists - 1 minute each side",
      "Lying hip stretch - 1 minute each side",
      "Happy baby pose - 2 minutes",
      "Legs up the wall - 5 minutes",
      "Deep breathing in bed - 3 minutes"
    ],
    precautions: [
      "Keep movements slow and gentle",
      "Dim lights for better relaxation",
      "Avoid screens during this routine",
      "Check blood sugar before bed"
    ]
  }
];
