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
  },
  {
    id: "23",
    title: "Seated Leg Exercises",
    description: "Strengthen your legs while sitting - perfect for limited mobility",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400",
    duration: 15,
    intensity: "Low",
    category: "strength",
    caloriesBurned: 50,
    benefits: [
      "Improves leg circulation",
      "Builds quadricep strength",
      "Can be done at desk or home",
      "Reduces risk of blood clots"
    ],
    steps: [
      "Sit tall in a sturdy chair",
      "Leg extensions - straighten one leg, hold 3 seconds, 10 each",
      "Seated marching - lift knees alternately, 20 reps",
      "Heel raises - lift heels while seated, 15 reps",
      "Toe raises - lift toes while heels stay down, 15 reps",
      "Inner thigh squeeze with pillow - hold 5 seconds, 10 reps",
      "Finish with ankle circles"
    ],
    precautions: [
      "Use a chair without wheels",
      "Keep core engaged for stability",
      "Don't lock knees when extending",
      "Move at a controlled pace"
    ]
  },
  {
    id: "24",
    title: "Aqua Jogging",
    description: "Run in the pool with zero impact on your joints",
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400",
    duration: 30,
    intensity: "Medium",
    category: "cardio",
    caloriesBurned: 240,
    benefits: [
      "Burns calories without joint stress",
      "Builds cardiovascular endurance",
      "Strengthens core and legs",
      "Great for injury recovery"
    ],
    steps: [
      "Enter deep end of pool with flotation belt",
      "Warm up with easy water walking - 5 minutes",
      "Begin jogging motion with high knees",
      "Pump arms as if running on land",
      "Maintain upright posture",
      "Alternate between fast and easy intervals",
      "Cool down with gentle floating - 5 minutes"
    ],
    precautions: [
      "Use flotation belt in deep water",
      "Stay near pool edge if needed",
      "Keep glucose nearby in waterproof container",
      "Never swim alone"
    ]
  },
  {
    id: "25",
    title: "Gardening Workout",
    description: "Turn yard work into a full-body exercise session",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
    duration: 45,
    intensity: "Medium",
    category: "strength",
    caloriesBurned: 200,
    benefits: [
      "Combines strength and cardio",
      "Reduces stress through nature",
      "Improves flexibility and mobility",
      "Provides vitamin D from sunlight"
    ],
    steps: [
      "Start with light tasks - watering plants",
      "Progress to weeding - squat or kneel properly",
      "Digging engages core and arms",
      "Raking provides cardio workout",
      "Carrying soil bags builds strength",
      "Take breaks every 15 minutes",
      "Stretch when finished"
    ],
    precautions: [
      "Wear sunscreen and hat",
      "Stay hydrated in warm weather",
      "Use knee pads when kneeling",
      "Lift with legs, not back"
    ]
  },
  {
    id: "26",
    title: "Mini Trampoline Bounce",
    description: "Low-impact rebounding for lymphatic and cardiovascular health",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
    duration: 15,
    intensity: "Medium",
    category: "cardio",
    caloriesBurned: 120,
    benefits: [
      "Stimulates lymphatic system",
      "Low impact on joints",
      "Improves balance and coordination",
      "Fun way to get cardio"
    ],
    steps: [
      "Stand in center of rebounder",
      "Start with gentle bounces - feet stay on mat",
      "Progress to small jumps - 2 minutes",
      "Add arm movements for more intensity",
      "Try jogging in place on rebounder",
      "Alternate between bouncing and marching",
      "Cool down with gentle bounces"
    ],
    precautions: [
      "Use rebounder with stability bar if needed",
      "Start slowly to find balance",
      "Keep bounces controlled",
      "Check blood sugar before and after"
    ]
  },
  {
    id: "27",
    title: "Wall Exercises",
    description: "Use a wall for support in this effective strength routine",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    duration: 20,
    intensity: "Medium",
    category: "strength",
    caloriesBurned: 100,
    benefits: [
      "Provides support and stability",
      "Builds leg and core strength",
      "Safe for beginners",
      "No equipment needed"
    ],
    steps: [
      "Wall push-ups - 15 reps, 2 sets",
      "Wall sit - hold 30-60 seconds, 3 sets",
      "Wall slides for shoulders - 10 reps",
      "Single leg balance against wall - 30 sec each",
      "Calf raises with wall support - 15 reps",
      "Wall plank hold - 30 seconds",
      "Stretch using wall for support"
    ],
    precautions: [
      "Choose a sturdy wall",
      "Wear non-slip shoes or go barefoot",
      "Keep back flat against wall during sits",
      "Don't hold breath during exercises"
    ]
  },
  {
    id: "28",
    title: "Golf Practice",
    description: "Work on your swing while getting gentle exercise",
    image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400",
    duration: 40,
    intensity: "Low",
    category: "flexibility",
    caloriesBurned: 150,
    benefits: [
      "Improves flexibility and rotation",
      "Enhances balance and coordination",
      "Low-impact activity",
      "Promotes social interaction"
    ],
    steps: [
      "Warm up with trunk rotations - 2 minutes",
      "Practice putting - 10 minutes",
      "Chip shot practice - 10 minutes",
      "Full swing practice - 15 minutes",
      "Walk between stations",
      "Stretch hip flexors and back after"
    ],
    precautions: [
      "Warm up thoroughly before swinging",
      "Carry snacks and water",
      "Wear supportive golf shoes",
      "Protect skin from sun exposure"
    ]
  },
  {
    id: "29",
    title: "Rowing Machine",
    description: "Full-body cardio workout that's gentle on joints",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
    duration: 20,
    intensity: "Medium",
    category: "cardio",
    caloriesBurned: 180,
    benefits: [
      "Works 86% of body muscles",
      "Low impact on joints",
      "Excellent cardiovascular exercise",
      "Builds back and leg strength"
    ],
    steps: [
      "Set resistance to low-medium level",
      "Warm up with 3 minutes easy rowing",
      "Focus on proper form - legs, back, arms",
      "Row at moderate pace for 12 minutes",
      "Include 30-second speed bursts every 3 minutes",
      "Cool down with 2 minutes easy rowing",
      "Stretch hamstrings and back"
    ],
    precautions: [
      "Learn proper rowing technique first",
      "Don't round your back",
      "Start with shorter sessions",
      "Keep water bottle nearby"
    ]
  },
  {
    id: "30",
    title: "Elliptical Training",
    description: "Smooth, low-impact cardio that mimics running",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
    duration: 25,
    intensity: "Medium",
    category: "cardio",
    caloriesBurned: 220,
    benefits: [
      "Zero impact on joints",
      "Works both upper and lower body",
      "Adjustable resistance levels",
      "Easy to control intensity"
    ],
    steps: [
      "Step onto machine and grip handles",
      "Start at low resistance - 3 minutes",
      "Increase to moderate resistance",
      "Maintain steady pace for 15 minutes",
      "Try going backwards for 3 minutes",
      "Increase resistance for final 2 minutes",
      "Cool down at low resistance - 2 minutes"
    ],
    precautions: [
      "Hold handrails when stepping on/off",
      "Start at lower resistance",
      "Keep upright posture",
      "Don't lean on handrails"
    ]
  },
  {
    id: "31",
    title: "Stretching for Back Pain",
    description: "Gentle stretches to relieve and prevent back discomfort",
    image: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=400",
    duration: 15,
    intensity: "Low",
    category: "flexibility",
    caloriesBurned: 35,
    benefits: [
      "Relieves back tension",
      "Improves spinal mobility",
      "Prevents future back issues",
      "Can be done daily"
    ],
    steps: [
      "Knee-to-chest stretch - 30 sec each leg",
      "Cat-cow stretches on all fours - 10 reps",
      "Child's pose - hold 1 minute",
      "Pelvic tilts lying down - 15 reps",
      "Lying spinal twist - 30 sec each side",
      "Figure-4 stretch for glutes - 30 sec each",
      "Seated forward fold - 1 minute"
    ],
    precautions: [
      "Move slowly and gently",
      "Stop if sharp pain occurs",
      "Use a yoga mat for comfort",
      "Consult doctor if chronic back issues"
    ]
  },
  {
    id: "32",
    title: "Boxing Basics",
    description: "Learn basic punches for a high-energy cardio workout",
    image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400",
    duration: 20,
    intensity: "High",
    category: "cardio",
    caloriesBurned: 250,
    benefits: [
      "Excellent stress relief",
      "High calorie burn",
      "Improves coordination",
      "Builds upper body strength"
    ],
    steps: [
      "Warm up with jump rope or marching - 3 min",
      "Practice basic stance and footwork",
      "Jab-cross combinations - 2 minutes",
      "Add hooks and uppercuts - 2 minutes",
      "Combination drills - 5 minutes",
      "Shadow boxing - 5 minutes",
      "Cool down with arm stretches"
    ],
    precautions: [
      "Start slowly to learn proper form",
      "Keep wrists straight when punching",
      "Have snack before high-intensity work",
      "Monitor blood sugar closely"
    ]
  },
  {
    id: "33",
    title: "Nordic Walking",
    description: "Walking with poles for enhanced upper body engagement",
    image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400",
    duration: 35,
    intensity: "Medium",
    category: "walking",
    caloriesBurned: 210,
    benefits: [
      "Uses 90% of body muscles",
      "Burns 40% more calories than regular walking",
      "Improves posture",
      "Reduces joint stress"
    ],
    steps: [
      "Adjust pole height to elbow level",
      "Start walking naturally - 5 minutes",
      "Add pole technique - opposite arm to leg",
      "Push through the strap, release grip slightly",
      "Maintain upright posture",
      "Walk at brisk pace for 25 minutes",
      "Cool down without poles - 5 minutes"
    ],
    precautions: [
      "Learn proper pole technique",
      "Start on flat terrain",
      "Wear appropriate footwear",
      "Carry water and snacks"
    ]
  },
  {
    id: "34",
    title: "Foam Rolling Recovery",
    description: "Self-massage technique to release muscle tension",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
    duration: 15,
    intensity: "Low",
    category: "flexibility",
    caloriesBurned: 30,
    benefits: [
      "Releases muscle knots",
      "Improves blood circulation",
      "Speeds up recovery",
      "Increases flexibility"
    ],
    steps: [
      "Start with calves - roll slowly, 1 min each",
      "Move to quadriceps - 1 min each leg",
      "Roll IT band on outer thigh - 1 min each",
      "Upper back rolling - 2 minutes",
      "Glute massage - 1 min each side",
      "Lat rolling - 1 min each side",
      "Finish with hip flexor release"
    ],
    precautions: [
      "Avoid rolling directly on bones",
      "Don't roll over lower back",
      "Pause on tender spots, don't push hard",
      "Breathe deeply throughout"
    ]
  },
  {
    id: "35",
    title: "Tennis or Pickleball",
    description: "Fun racquet sports that combine cardio with agility",
    image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400",
    duration: 45,
    intensity: "Medium",
    category: "cardio",
    caloriesBurned: 280,
    benefits: [
      "Improves hand-eye coordination",
      "Burns significant calories",
      "Social and enjoyable",
      "Enhances agility and reflexes"
    ],
    steps: [
      "Warm up with light jogging - 5 minutes",
      "Practice forehand and backhand swings",
      "Rally with partner at moderate pace",
      "Take water breaks every 10-15 minutes",
      "Play games or continue rallying",
      "Cool down with stretching - 5 minutes"
    ],
    precautions: [
      "Wear proper court shoes",
      "Carry fast-acting glucose",
      "Stay hydrated throughout",
      "Avoid playing in extreme heat"
    ]
  },
  {
    id: "36",
    title: "Breathing Exercises",
    description: "Deep breathing techniques to reduce stress and lower blood sugar",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400",
    duration: 10,
    intensity: "Low",
    category: "flexibility",
    caloriesBurned: 15,
    benefits: [
      "Reduces cortisol and stress",
      "Lowers blood pressure",
      "Improves oxygen delivery",
      "Can be done anywhere"
    ],
    steps: [
      "Find a comfortable seated position",
      "Box breathing - inhale 4 counts, hold 4, exhale 4, hold 4",
      "Repeat box breathing for 3 minutes",
      "4-7-8 breathing - inhale 4, hold 7, exhale 8",
      "Repeat 4-7-8 for 3 minutes",
      "Belly breathing - hand on stomach, breathe deeply",
      "End with natural breathing - 2 minutes"
    ],
    precautions: [
      "Don't force breathing",
      "Stop if feeling dizzy",
      "Practice in a quiet space",
      "Can be combined with meditation"
    ]
  },
  {
    id: "37",
    title: "Leg Press Machine",
    description: "Safely build lower body strength with machine support",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
    duration: 20,
    intensity: "Medium",
    category: "strength",
    caloriesBurned: 120,
    benefits: [
      "Builds quadriceps and glutes",
      "Machine provides stability",
      "Adjustable resistance",
      "Good for beginners"
    ],
    steps: [
      "Adjust seat and back rest",
      "Start with light weight - 10 warm-up reps",
      "Increase weight to working level",
      "Perform 12 reps, 3 sets",
      "Rest 60-90 seconds between sets",
      "Try single-leg press - 10 each leg",
      "Stretch quads and hamstrings after"
    ],
    precautions: [
      "Don't lock knees at extension",
      "Keep lower back pressed into seat",
      "Start with lighter weight",
      "Breathe out when pushing"
    ]
  },
  {
    id: "38",
    title: "Mall Walking",
    description: "Walk indoors in climate-controlled comfort",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    duration: 30,
    intensity: "Low",
    category: "walking",
    caloriesBurned: 130,
    benefits: [
      "Weather-proof exercise option",
      "Flat, safe walking surface",
      "Restrooms readily available",
      "Social opportunity"
    ],
    steps: [
      "Arrive when mall opens for fewer crowds",
      "Start with one lap at easy pace",
      "Increase to brisk walking pace",
      "Walk multiple laps - aim for 2 miles",
      "Take stairs instead of escalators",
      "Cool down with slower lap",
      "Stretch in a quiet area"
    ],
    precautions: [
      "Wear comfortable walking shoes",
      "Avoid peak shopping hours",
      "Carry water bottle",
      "Know where restrooms are located"
    ]
  },
  {
    id: "39",
    title: "Seated Upper Body Workout",
    description: "Strengthen arms and shoulders while seated",
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400",
    duration: 20,
    intensity: "Low",
    category: "strength",
    caloriesBurned: 70,
    benefits: [
      "Accessible for limited mobility",
      "Builds upper body strength",
      "Can use light weights or resistance bands",
      "Improves posture"
    ],
    steps: [
      "Sit tall in sturdy chair",
      "Seated arm circles - 30 seconds each direction",
      "Seated bicep curls - 12 reps, 2 sets",
      "Overhead press - 10 reps, 2 sets",
      "Seated rows with band - 12 reps, 2 sets",
      "Chest press with band - 10 reps, 2 sets",
      "Shoulder shrugs - 15 reps",
      "Stretch shoulders and arms"
    ],
    precautions: [
      "Use light weights to start",
      "Keep feet flat on floor",
      "Engage core for stability",
      "Move with control"
    ]
  },
  {
    id: "40",
    title: "Beach Walking",
    description: "Walk on sand for extra resistance and calorie burn",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400",
    duration: 25,
    intensity: "Medium",
    category: "walking",
    caloriesBurned: 170,
    benefits: [
      "Sand resistance increases workout intensity",
      "Strengthens ankles and calves",
      "Calming ocean environment",
      "Fresh air and vitamin D"
    ],
    steps: [
      "Start on firm wet sand near water",
      "Walk at comfortable pace - 5 minutes",
      "Move to softer sand for more challenge",
      "Alternate between wet and dry sand",
      "Walk for 15-20 minutes total",
      "Cool down on firm sand",
      "Rinse and dry feet thoroughly"
    ],
    precautions: [
      "Wear water shoes or go barefoot carefully",
      "Watch for shells and debris",
      "Apply sunscreen and wear hat",
      "Dry feet completely after - check for cuts"
    ]
  },
  {
    id: "41",
    title: "Step Aerobics",
    description: "Classic step workout for cardio and lower body toning",
    image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400",
    duration: 30,
    intensity: "Medium",
    category: "cardio",
    caloriesBurned: 260,
    benefits: [
      "Excellent cardiovascular workout",
      "Tones legs and glutes",
      "Improves coordination",
      "Adjustable intensity with step height"
    ],
    steps: [
      "Set step to beginner height (4-6 inches)",
      "Warm up with basic step-ups - 3 minutes",
      "Practice basic step patterns",
      "Add arm movements for intensity",
      "Alternate leading foot every few minutes",
      "Include knee lifts and leg kicks",
      "Cool down with slow stepping and stretches"
    ],
    precautions: [
      "Keep entire foot on the step",
      "Don't step backwards off the platform",
      "Wear supportive athletic shoes",
      "Start with lower step height"
    ]
  },
  {
    id: "42",
    title: "Kickboxing Cardio",
    description: "High-energy martial arts-inspired workout",
    image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400",
    duration: 25,
    intensity: "High",
    category: "cardio",
    caloriesBurned: 300,
    benefits: [
      "Burns high calories",
      "Full body conditioning",
      "Stress relief",
      "Improves agility and reflexes"
    ],
    steps: [
      "Warm up with jumping jacks - 3 minutes",
      "Basic jab-cross combinations - 2 minutes",
      "Front kicks - 2 minutes each leg",
      "Roundhouse kicks - 2 minutes each leg",
      "Combination drills - 8 minutes",
      "Knee strikes and elbow combos - 4 minutes",
      "Cool down with stretching"
    ],
    precautions: [
      "Eat a snack 30-60 minutes before",
      "Keep glucose tablets nearby",
      "Monitor intensity level",
      "Stay hydrated throughout"
    ]
  },
  {
    id: "43",
    title: "Barre Workout",
    description: "Ballet-inspired exercises for toning and flexibility",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400",
    duration: 35,
    intensity: "Medium",
    category: "strength",
    caloriesBurned: 180,
    benefits: [
      "Builds long, lean muscles",
      "Improves posture",
      "Enhances flexibility",
      "Low impact on joints"
    ],
    steps: [
      "Warm up at the barre with plies - 3 minutes",
      "Thigh work - small pulses and holds",
      "Seat work - leg lifts and circles",
      "Arm series with light weights",
      "Core work on the mat",
      "Back dancing stretches",
      "Final stretch sequence"
    ],
    precautions: [
      "Use a chair or wall for balance",
      "Keep movements controlled",
      "Don't lock knees",
      "Stay hydrated"
    ]
  },
  {
    id: "44",
    title: "Recumbent Bike",
    description: "Comfortable seated cycling with back support",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
    duration: 25,
    intensity: "Low",
    category: "cardio",
    caloriesBurned: 150,
    benefits: [
      "Excellent for back support",
      "Easy on hips and knees",
      "Comfortable for longer sessions",
      "Good for beginners"
    ],
    steps: [
      "Adjust seat for proper leg extension",
      "Start at low resistance - 5 minutes",
      "Increase to moderate resistance",
      "Maintain steady cadence for 15 minutes",
      "Interval option: 1 min fast, 2 min easy",
      "Cool down at low resistance - 5 minutes"
    ],
    precautions: [
      "Ensure proper seat adjustment",
      "Don't overextend knees",
      "Keep water nearby",
      "Check blood sugar before and after"
    ]
  },
  {
    id: "45",
    title: "Qigong Practice",
    description: "Ancient Chinese movement meditation for energy flow",
    image: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=400",
    duration: 20,
    intensity: "Low",
    category: "flexibility",
    caloriesBurned: 60,
    benefits: [
      "Reduces stress and anxiety",
      "Improves balance and coordination",
      "Enhances energy levels",
      "Gentle on all fitness levels"
    ],
    steps: [
      "Stand with feet shoulder-width apart",
      "Begin with shaking exercise - 2 minutes",
      "Practice 'Lifting the Sky' movement",
      "'Pushing Mountains' - 10 repetitions",
      "'Drawing the Bow' - each side",
      "'Separating Heaven and Earth'",
      "End with standing meditation - 5 minutes"
    ],
    precautions: [
      "Move slowly and mindfully",
      "Focus on breath coordination",
      "Practice on flat surface",
      "Don't force any movements"
    ]
  },
  {
    id: "46",
    title: "Ankle Weights Walking",
    description: "Add resistance to your regular walks",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    duration: 20,
    intensity: "Medium",
    category: "walking",
    caloriesBurned: 140,
    benefits: [
      "Increases calorie burn",
      "Strengthens legs while walking",
      "Improves bone density",
      "Easy to add to routine"
    ],
    steps: [
      "Strap on 1-2 lb ankle weights",
      "Start with 5 minutes easy walking",
      "Walk at normal pace for 10 minutes",
      "Focus on lifting knees slightly higher",
      "Remove weights for cool down",
      "Stretch calves and quadriceps"
    ],
    precautions: [
      "Start with light weights (1 lb)",
      "Don't use if you have joint issues",
      "Remove if feeling strain",
      "Progress weight gradually"
    ]
  },
  {
    id: "47",
    title: "Power Walking",
    description: "Fast-paced walking for maximum cardiovascular benefit",
    image: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=400",
    duration: 30,
    intensity: "Medium",
    category: "walking",
    caloriesBurned: 200,
    benefits: [
      "Burns more calories than regular walking",
      "Improves cardiovascular fitness",
      "Low impact exercise",
      "Better for blood sugar control"
    ],
    steps: [
      "Warm up with 5 minutes normal pace",
      "Increase speed - aim for 4 mph pace",
      "Pump arms actively",
      "Keep stride length comfortable",
      "Maintain pace for 20 minutes",
      "Cool down with slow walking - 5 minutes"
    ],
    precautions: [
      "Wear supportive walking shoes",
      "Stay hydrated",
      "Don't transition to jogging",
      "Monitor heart rate if possible"
    ]
  },
  {
    id: "48",
    title: "Kettlebell Basics",
    description: "Learn foundational kettlebell movements",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400",
    duration: 25,
    intensity: "Medium",
    category: "strength",
    caloriesBurned: 200,
    benefits: [
      "Full body conditioning",
      "Combines strength and cardio",
      "Improves grip strength",
      "Functional movement patterns"
    ],
    steps: [
      "Warm up with bodyweight squats - 2 minutes",
      "Kettlebell deadlifts - 10 reps, 2 sets",
      "Goblet squats - 10 reps, 2 sets",
      "Two-hand swings - 15 reps, 3 sets",
      "Kettlebell rows - 10 each arm",
      "Farmer's carry - 2 laps",
      "Cool down and stretch"
    ],
    precautions: [
      "Start with lighter weight",
      "Learn proper hip hinge",
      "Keep back straight",
      "Have snack available for high intensity"
    ]
  },
  {
    id: "49",
    title: "Shoulder Rehab Exercises",
    description: "Gentle movements to strengthen and protect shoulders",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    duration: 15,
    intensity: "Low",
    category: "strength",
    caloriesBurned: 40,
    benefits: [
      "Prevents shoulder injuries",
      "Improves range of motion",
      "Strengthens rotator cuff",
      "Reduces pain and stiffness"
    ],
    steps: [
      "Pendulum swings - 1 minute each arm",
      "Wall slides - 10 reps",
      "External rotation with band - 15 each",
      "Internal rotation with band - 15 each",
      "Scapular squeezes - 15 reps",
      "Doorway stretches - 30 seconds each",
      "Cross-body stretch - 30 seconds each"
    ],
    precautions: [
      "Stop if pain increases",
      "Use light resistance only",
      "Move slowly and controlled",
      "Consult doctor if persistent pain"
    ]
  },
  {
    id: "50",
    title: "Jumping Rope",
    description: "Classic cardio exercise for coordination and fitness",
    image: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400",
    duration: 15,
    intensity: "High",
    category: "cardio",
    caloriesBurned: 200,
    benefits: [
      "High calorie burn in short time",
      "Improves coordination",
      "Strengthens bones",
      "Portable equipment"
    ],
    steps: [
      "Size rope to armpit height",
      "Warm up with marching - 2 minutes",
      "Basic bounce - 30 seconds, rest 30",
      "Repeat intervals for 10 minutes",
      "Try alternate foot stepping",
      "Cool down with light stretching"
    ],
    precautions: [
      "Wear shock-absorbing shoes",
      "Jump on forgiving surface",
      "Start with short intervals",
      "Check blood sugar before high intensity"
    ]
  },
  {
    id: "51",
    title: "Hip Strengthening",
    description: "Target hip muscles for better mobility and stability",
    image: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=400",
    duration: 20,
    intensity: "Low",
    category: "strength",
    caloriesBurned: 70,
    benefits: [
      "Improves walking gait",
      "Reduces knee and back pain",
      "Enhances balance",
      "Prevents falls"
    ],
    steps: [
      "Clamshells - 15 each side, 2 sets",
      "Side-lying leg raises - 15 each, 2 sets",
      "Fire hydrants - 12 each side",
      "Glute bridges - 15 reps, 2 sets",
      "Standing hip abduction - 10 each",
      "Hip circles - 10 each direction",
      "Figure-4 stretch to finish"
    ],
    precautions: [
      "Use a mat for floor exercises",
      "Keep movements controlled",
      "Don't force range of motion",
      "Stop if sharp pain occurs"
    ]
  },
  {
    id: "52",
    title: "Battle Ropes",
    description: "High-intensity rope exercises for full body conditioning",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400",
    duration: 15,
    intensity: "High",
    category: "cardio",
    caloriesBurned: 220,
    benefits: [
      "Full body workout",
      "Burns calories quickly",
      "Builds grip and arm strength",
      "Low impact on joints"
    ],
    steps: [
      "Anchor rope securely",
      "Alternating waves - 30 seconds",
      "Rest 20 seconds",
      "Double waves - 30 seconds",
      "Rest 20 seconds",
      "Slams - 30 seconds",
      "Repeat circuit 3-4 times",
      "Cool down with arm stretches"
    ],
    precautions: [
      "Start with shorter intervals",
      "Keep core engaged",
      "Maintain athletic stance",
      "Have glucose available"
    ]
  },
  {
    id: "53",
    title: "Stability Ball Exercises",
    description: "Core and balance work using an exercise ball",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400",
    duration: 25,
    intensity: "Medium",
    category: "strength",
    caloriesBurned: 120,
    benefits: [
      "Improves core stability",
      "Enhances balance",
      "Engages stabilizer muscles",
      "Versatile equipment"
    ],
    steps: [
      "Ball squats against wall - 12 reps",
      "Ball crunches - 15 reps, 2 sets",
      "Plank with feet on ball - 30 seconds",
      "Ball pass between hands and feet - 10 reps",
      "Hamstring curls on ball - 12 reps",
      "Back extension on ball - 12 reps",
      "Seated balance on ball - 2 minutes"
    ],
    precautions: [
      "Choose correct ball size",
      "Ensure ball is properly inflated",
      "Have support nearby when learning",
      "Progress gradually"
    ]
  },
  {
    id: "54",
    title: "Morning Energy Routine",
    description: "Quick movements to energize your morning",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400",
    duration: 10,
    intensity: "Low",
    category: "flexibility",
    caloriesBurned: 45,
    benefits: [
      "Wakes up the body",
      "Improves circulation",
      "Boosts mood and alertness",
      "Sets positive tone for day"
    ],
    steps: [
      "Sun salutation arms - 5 reps",
      "Gentle twists side to side - 1 minute",
      "Hip circles - 10 each direction",
      "Marching in place - 1 minute",
      "Arm circles - 30 seconds each way",
      "Deep breaths with overhead reach",
      "Light jumping or bouncing - 1 minute"
    ],
    precautions: [
      "Move gently when first waking",
      "Check blood sugar if feeling off",
      "Have water ready",
      "Modify based on how you feel"
    ]
  },
  {
    id: "55",
    title: "TRX Suspension Training",
    description: "Bodyweight exercises using suspension straps",
    image: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=400",
    duration: 30,
    intensity: "Medium",
    category: "strength",
    caloriesBurned: 170,
    benefits: [
      "Full body strength training",
      "Adjustable difficulty",
      "Improves core stability",
      "Functional movements"
    ],
    steps: [
      "TRX rows - 12 reps, 2 sets",
      "TRX chest press - 10 reps, 2 sets",
      "TRX squats - 15 reps, 2 sets",
      "TRX lunges - 10 each leg",
      "TRX plank - 30 seconds, 2 sets",
      "TRX bicep curls - 12 reps",
      "Stretch all major muscle groups"
    ],
    precautions: [
      "Ensure straps are securely anchored",
      "Start with easier angles",
      "Keep core engaged",
      "Progress angle gradually"
    ]
  },
  {
    id: "56",
    title: "Hand and Wrist Exercises",
    description: "Strengthen and protect hands from diabetic complications",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    duration: 10,
    intensity: "Low",
    category: "flexibility",
    caloriesBurned: 20,
    benefits: [
      "Improves circulation to hands",
      "Prevents carpal tunnel",
      "Maintains grip strength",
      "Good for diabetic nerve health"
    ],
    steps: [
      "Finger spreads - 10 reps",
      "Fist squeezes - 15 reps",
      "Wrist circles - 10 each direction",
      "Prayer stretch - hold 30 seconds",
      "Reverse prayer stretch - 30 seconds",
      "Thumb touches to each finger - 3 rounds",
      "Stress ball squeezes - 20 reps"
    ],
    precautions: [
      "Don't force any movements",
      "Stop if numbness increases",
      "Do throughout the day",
      "Report persistent numbness to doctor"
    ]
  },
  {
    id: "57",
    title: "Low Impact HIIT",
    description: "High intensity intervals without jumping",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
    duration: 20,
    intensity: "High",
    category: "cardio",
    caloriesBurned: 230,
    benefits: [
      "High calorie burn",
      "No jumping required",
      "Improves metabolism",
      "Time efficient"
    ],
    steps: [
      "Warm up with marching - 3 minutes",
      "Fast squats - 30 seconds, rest 15",
      "Speed skaters (no jump) - 30 sec, rest 15",
      "Fast punches - 30 seconds, rest 15",
      "High knees (fast march) - 30 sec, rest 15",
      "Repeat circuit 3 times",
      "Cool down with walking and stretches"
    ],
    precautions: [
      "Have snack before workout",
      "Keep glucose nearby",
      "Monitor how you feel",
      "Reduce intensity if needed"
    ]
  },
  {
    id: "58",
    title: "Posture Correction",
    description: "Exercises to improve alignment and reduce pain",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
    duration: 15,
    intensity: "Low",
    category: "flexibility",
    caloriesBurned: 35,
    benefits: [
      "Reduces back and neck pain",
      "Improves breathing",
      "Enhances confidence",
      "Prevents future issues"
    ],
    steps: [
      "Chin tucks - 15 reps",
      "Wall angels - 10 reps",
      "Chest doorway stretch - 30 sec each side",
      "Cat-cow stretches - 10 reps",
      "Thoracic rotation - 10 each side",
      "Shoulder blade squeezes - 15 reps",
      "Hip flexor stretch - 30 sec each side"
    ],
    precautions: [
      "Move slowly through exercises",
      "Don't force positions",
      "Practice daily for best results",
      "Be patient - posture takes time"
    ]
  },
  {
    id: "59",
    title: "Cycling Outdoors",
    description: "Enjoy nature while getting great cardio on your bike",
    image: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=400",
    duration: 40,
    intensity: "Medium",
    category: "cardio",
    caloriesBurned: 320,
    benefits: [
      "Great cardiovascular exercise",
      "Explores outdoors",
      "Low impact on joints",
      "Adjustable intensity"
    ],
    steps: [
      "Check bike and tire pressure",
      "Start on flat terrain - 10 minutes",
      "Include some gentle hills if available",
      "Maintain steady cadence",
      "Take breaks as needed",
      "Cool down with slow pedaling",
      "Stretch quadriceps and hamstrings"
    ],
    precautions: [
      "Wear a helmet",
      "Carry glucose and water",
      "Tell someone your route",
      "Carry phone for emergencies"
    ]
  },
  {
    id: "60",
    title: "Foot Care Exercises",
    description: "Essential exercises for diabetic foot health",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    duration: 10,
    intensity: "Low",
    category: "flexibility",
    caloriesBurned: 25,
    benefits: [
      "Improves circulation to feet",
      "Maintains flexibility",
      "Prevents complications",
      "Reduces risk of injuries"
    ],
    steps: [
      "Toe curls - pick up towel with toes",
      "Toe spreads - 10 reps",
      "Ankle circles - 10 each direction",
      "Point and flex feet - 15 reps",
      "Roll foot on tennis ball - 1 min each",
      "Calf raises seated - 15 reps",
      "Inspect feet for any issues"
    ],
    precautions: [
      "Check feet daily for cuts or sores",
      "Keep feet clean and dry",
      "Never walk barefoot",
      "Report any numbness to doctor"
    ]
  }
];
