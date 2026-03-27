export interface VideoStoryboardShot {
  shotNumber: number;
  duration: string;
  angle: string;
  action: string;
  onScreenText: string;
  soundCue: string;
}

export interface ShortVideoPack {
  videoScript: { timecode: string; content: string }[];
  verticalStoryboard: VideoStoryboardShot[];
  videoGenerationPrompts: string[];
  finalHeroShotPrompt: string;
  autoCaptions: string[];
  cta: string;
  hashtags: string[];
  generatedHeroImage?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  calories: number;
  carbsPerServing: number;
  category: string;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  origin?: string;
  teaPairings?: string[];
  glycemicNotes?: string[];
  shortVideoPack?: ShortVideoPack;
}

export const recipeCategories = [
  { id: "all", name: "All", icon: "🍽️" },
  { id: "world-best", name: "World Best", icon: "🌍" },
  { id: "teas", name: "Teas", icon: "🍵" },
  { id: "breakfast", name: "Breakfast", icon: "🌅" },
  { id: "lunch", name: "Lunch", icon: "🥗" },
  { id: "dinner", name: "Dinner", icon: "🍲" },
  { id: "snacks", name: "Snacks", icon: "🥜" },
  { id: "desserts", name: "Desserts", icon: "🍓" },
];

const WORLD_BEST_TAG = "world-best";
const TEA_TAG = "tea";

export const recipes: Recipe[] = [
  {
    id: "1",
    title: "Avocado Egg Breakfast Bowl",
    description: "A protein-packed breakfast with healthy fats to start your day right",
    image: "https://r2-pub.rork.com/generated-images/5fff88ee-a558-4d4f-833e-9044e1c0d1f9.png",
    prepTime: 10,
    cookTime: 15,
    servings: 2,
    calories: 320,
    carbsPerServing: 12,
    category: "breakfast",
    ingredients: [
      "2 ripe avocados",
      "4 large eggs",
      "1 cup cherry tomatoes, halved",
      "2 tbsp olive oil",
      "Salt and pepper to taste",
      "Fresh cilantro for garnish",
      "1/4 tsp red pepper flakes"
    ],
    instructions: [
      "Halve the avocados and remove the pit, creating a larger well",
      "Heat olive oil in a non-stick pan over medium heat",
      "Crack eggs into pan and cook to your preference",
      "Place avocado halves on plates, top with eggs",
      "Add cherry tomatoes around the bowl",
      "Season with salt, pepper, and red pepper flakes",
      "Garnish with fresh cilantro"
    ],
    tags: ["low-carb", "high-protein", "keto-friendly"]
  },
  {
    id: "2",
    title: "Grilled Salmon with Asparagus",
    description: "Omega-3 rich salmon with fiber-filled asparagus",
    image: "https://r2-pub.rork.com/generated-images/8ba617cb-74db-4b8c-a4c5-133cb2c938b1.png",
    prepTime: 15,
    cookTime: 20,
    servings: 2,
    calories: 380,
    carbsPerServing: 8,
    category: "dinner",
    ingredients: [
      "2 salmon fillets (6oz each)",
      "1 bunch asparagus, trimmed",
      "3 tbsp olive oil",
      "2 cloves garlic, minced",
      "1 lemon, juiced and zested",
      "Fresh dill",
      "Salt and pepper"
    ],
    instructions: [
      "Preheat grill or grill pan to medium-high heat",
      "Brush salmon with olive oil, season with salt and pepper",
      "Grill salmon for 4-5 minutes per side",
      "Toss asparagus with remaining olive oil and garlic",
      "Grill asparagus for 3-4 minutes, turning occasionally",
      "Plate salmon with asparagus, drizzle with lemon juice",
      "Garnish with lemon zest and fresh dill"
    ],
    tags: ["omega-3", "low-carb", "heart-healthy"]
  },
  {
    id: "3",
    title: "Mediterranean Quinoa Salad",
    description: "Light and refreshing salad packed with nutrients",
    image: "https://r2-pub.rork.com/generated-images/c600bb6d-bee8-47c8-b95a-c1afe5c8f1ce.png",
    prepTime: 20,
    cookTime: 15,
    servings: 4,
    calories: 290,
    carbsPerServing: 28,
    category: "lunch",
    ingredients: [
      "1 cup quinoa, cooked",
      "1 cucumber, diced",
      "1 cup cherry tomatoes, halved",
      "1/2 red onion, finely chopped",
      "1/2 cup kalamata olives",
      "1/2 cup feta cheese, crumbled",
      "Fresh parsley and mint",
      "3 tbsp olive oil",
      "2 tbsp lemon juice"
    ],
    instructions: [
      "Cook quinoa according to package directions, let cool",
      "Combine cucumber, tomatoes, onion, and olives in a bowl",
      "Add cooled quinoa to vegetables",
      "Whisk together olive oil and lemon juice for dressing",
      "Toss salad with dressing",
      "Top with feta cheese and fresh herbs",
      "Serve chilled or at room temperature"
    ],
    tags: ["fiber-rich", "vegetarian", "meal-prep"]
  },
  {
    id: "4",
    title: "Cauliflower Rice Stir-Fry",
    description: "Low-carb alternative to traditional fried rice",
    image: "https://r2-pub.rork.com/generated-images/ab53f09d-832f-4a01-89c9-a94a3c666310.png",
    prepTime: 15,
    cookTime: 12,
    servings: 3,
    calories: 180,
    carbsPerServing: 10,
    category: "dinner",
    ingredients: [
      "1 large cauliflower head, riced",
      "2 eggs, beaten",
      "1 cup mixed vegetables",
      "3 tbsp coconut aminos",
      "2 tbsp sesame oil",
      "3 green onions, chopped",
      "2 cloves garlic, minced",
      "1 tsp fresh ginger, grated"
    ],
    instructions: [
      "Rice the cauliflower using a food processor",
      "Heat sesame oil in a large wok over high heat",
      "Add garlic and ginger, stir for 30 seconds",
      "Push to side, scramble eggs in wok",
      "Add cauliflower rice and vegetables",
      "Stir-fry for 5-6 minutes until tender",
      "Add coconut aminos, toss well",
      "Garnish with green onions"
    ],
    tags: ["low-carb", "keto", "quick-meal"]
  },
  {
    id: "5",
    title: "Greek Yogurt Parfait",
    description: "Creamy protein-rich parfait with berries and nuts",
    image: "https://r2-pub.rork.com/generated-images/1d529bcc-5748-4d78-b314-e270a8d0bd76.png",
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    calories: 220,
    carbsPerServing: 18,
    category: "breakfast",
    ingredients: [
      "1 cup plain Greek yogurt",
      "1/2 cup mixed berries",
      "2 tbsp almonds, sliced",
      "1 tbsp chia seeds",
      "1 tsp vanilla extract",
      "Stevia or monk fruit to taste"
    ],
    instructions: [
      "Mix Greek yogurt with vanilla and sweetener",
      "Layer half the yogurt in a glass or bowl",
      "Add half the berries and a sprinkle of almonds",
      "Add remaining yogurt on top",
      "Top with remaining berries, almonds, and chia seeds",
      "Serve immediately or refrigerate"
    ],
    tags: ["high-protein", "quick", "no-cook"]
  },
  {
    id: "6",
    title: "Almond Butter Celery Sticks",
    description: "Quick and satisfying snack with healthy fats",
    image: "https://r2-pub.rork.com/generated-images/fd9596f7-4687-4989-98d8-12d5e4d20e55.png",
    prepTime: 5,
    cookTime: 0,
    servings: 2,
    calories: 150,
    carbsPerServing: 6,
    category: "snacks",
    ingredients: [
      "4 celery stalks",
      "4 tbsp almond butter",
      "1 tbsp unsweetened coconut flakes",
      "Cinnamon to taste"
    ],
    instructions: [
      "Wash and trim celery stalks",
      "Cut into 3-inch pieces",
      "Fill celery grooves with almond butter",
      "Sprinkle with coconut flakes and cinnamon",
      "Serve immediately"
    ],
    tags: ["low-carb", "quick", "no-cook"]
  },
  {
    id: "7",
    title: "Berry Chia Pudding",
    description: "Sugar-free dessert that satisfies sweet cravings",
    image: "https://r2-pub.rork.com/generated-images/0707afd0-78ca-4341-942a-d47ffa96c840.png",
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    calories: 180,
    carbsPerServing: 15,
    category: "desserts",
    ingredients: [
      "1/4 cup chia seeds",
      "1 cup unsweetened almond milk",
      "1/2 cup mixed berries",
      "1 tsp vanilla extract",
      "Stevia to taste",
      "Fresh mint for garnish"
    ],
    instructions: [
      "Mix chia seeds with almond milk in a jar",
      "Add vanilla and sweetener, stir well",
      "Refrigerate for at least 4 hours or overnight",
      "Stir and check consistency",
      "Top with fresh berries and mint",
      "Serve chilled"
    ],
    tags: ["sugar-free", "make-ahead", "fiber-rich"]
  },
  {
    id: "8",
    title: "Turkey Lettuce Wraps",
    description: "Light and flavorful Asian-inspired wraps",
    image: "https://r2-pub.rork.com/generated-images/c391e946-d665-4c9c-aa8f-479d8400993c.png",
    prepTime: 15,
    cookTime: 10,
    servings: 4,
    calories: 210,
    carbsPerServing: 8,
    category: "lunch",
    ingredients: [
      "1 lb ground turkey",
      "1 tbsp sesame oil",
      "3 tbsp coconut aminos",
      "1 tbsp rice vinegar",
      "2 cloves garlic, minced",
      "1 head butter lettuce",
      "1/4 cup water chestnuts, diced",
      "Green onions and cilantro"
    ],
    instructions: [
      "Heat sesame oil in a skillet over medium-high heat",
      "Add ground turkey, break apart while cooking",
      "Add garlic and cook until fragrant",
      "Stir in coconut aminos, vinegar, and water chestnuts",
      "Cook until turkey is fully done",
      "Separate lettuce leaves as cups",
      "Spoon turkey mixture into lettuce cups",
      "Garnish with green onions and cilantro"
    ],
    tags: ["low-carb", "high-protein", "gluten-free", WORLD_BEST_TAG],
    origin: "China (inspired)",
    teaPairings: ["Jasmine green tea", "Oolong tea"],
    glycemicNotes: ["Swap coconut aminos for low-sodium soy if preferred", "Add extra mushrooms for more fiber"]
  },
  {
    id: "9",
    title: "Moroccan Chermoula Fish + Citrus Herb Salad",
    description: "Bright, herb-forward chermoula with flaky white fish and a crunchy citrus salad",
    image: "https://r2-pub.rork.com/generated-images/685a20c9-feed-49b1-842e-be14175e7a07.png",
    prepTime: 18,
    cookTime: 14,
    servings: 2,
    calories: 340,
    carbsPerServing: 14,
    category: "dinner",
    ingredients: [
      "2 white fish fillets (cod/halibut), ~6 oz each",
      "1 cup fresh cilantro",
      "1/2 cup fresh parsley",
      "2 cloves garlic",
      "1 tsp ground cumin",
      "1/2 tsp smoked paprika",
      "1 lemon (zest + juice)",
      "2 tbsp olive oil",
      "1 orange, segmented",
      "2 cups arugula",
      "1/2 cucumber, ribboned",
      "Salt + pepper"
    ],
    instructions: [
      "Blend cilantro, parsley, garlic, cumin, paprika, lemon zest/juice, olive oil, salt and pepper into a loose paste",
      "Pat fish dry and rub with chermoula; rest 10 minutes",
      "Pan-sear fish over medium-high heat 3–4 min per side (or bake at 400°F for ~12 min)",
      "Toss arugula, cucumber and orange segments with a squeeze of lemon",
      "Serve fish over salad with extra chermoula drizzled on top"
    ],
    tags: ["omega-3", "high-fiber", "world-best"],
    origin: "Morocco",
    teaPairings: ["Fresh mint tea (unsweetened)", "Green tea"],
    glycemicNotes: ["Citrus + herbs bring flavor without sugar", "Pair with roasted cauliflower if you want a bigger plate"]
  },
  {
    id: "10",
    title: "Japanese Sesame-Ginger Soba (Half Soba, Half Zoodles)",
    description: "A beautiful noodle bowl that keeps carbs in check by mixing buckwheat soba with zucchini noodles",
    image: "https://r2-pub.rork.com/generated-images/ba5ebe05-dedf-4bfd-a389-e5a625739dc3.png",
    prepTime: 20,
    cookTime: 10,
    servings: 2,
    calories: 390,
    carbsPerServing: 28,
    category: "lunch",
    ingredients: [
      "3 oz dry soba noodles",
      "2 medium zucchini, spiralized",
      "1 cup edamame (shelled)",
      "1 cup shredded purple cabbage",
      "1/2 cup cucumber, thinly sliced",
      "2 tbsp tahini",
      "1 tbsp rice vinegar",
      "1 tbsp low-sodium soy sauce or coconut aminos",
      "1 tsp toasted sesame oil",
      "1 tsp grated ginger",
      "1 tsp sesame seeds",
      "Lime wedges"
    ],
    instructions: [
      "Cook soba per package directions; rinse under cold water and drain well",
      "Lightly toss zoodles with a pinch of salt; pat dry",
      "Whisk tahini, vinegar, soy/coconut aminos, sesame oil, ginger + a splash of water until silky",
      "Combine soba + zoodles, edamame, cabbage and cucumber",
      "Toss with dressing; finish with sesame seeds and lime"
    ],
    tags: ["world-best", "plant-forward", "meal-prep"],
    origin: "Japan (inspired)",
    teaPairings: ["Genmaicha", "Sencha"],
    glycemicNotes: ["Half zoodles lowers total glycemic load", "Add grilled salmon for extra protein"]
  },
  {
    id: "11",
    title: "Indian Moong Dal Chilla (Savory Lentil Crepes)",
    description: "Golden, crisp lentil crepes with a cooling cucumber raita-style yogurt dip",
    image: "https://r2-pub.rork.com/generated-images/a3d4b509-86e1-4c81-804e-79b4a980be29.png",
    prepTime: 15,
    cookTime: 16,
    servings: 2,
    calories: 360,
    carbsPerServing: 26,
    category: "breakfast",
    ingredients: [
      "1 cup split moong dal (soaked 3–4 hours)",
      "1/2 tsp turmeric",
      "1/2 tsp cumin",
      "1 green chili (optional)",
      "1/2 tsp salt",
      "1/3 cup water (as needed)",
      "1 tsp oil for the pan",
      "1/2 cup plain Greek yogurt",
      "1/2 cucumber, grated + squeezed",
      "Mint + lemon"
    ],
    instructions: [
      "Blend soaked dal with spices + water into a smooth, pourable batter",
      "Heat a non-stick pan; lightly oil",
      "Pour batter and spread thin like a crepe; cook 2–3 min each side",
      "Mix yogurt with cucumber, mint and lemon for dip",
      "Serve hot with the yogurt dip"
    ],
    tags: ["world-best", "high-protein", "gluten-free"],
    origin: "India",
    teaPairings: ["Masala chai (unsweetened)", "Ginger tea"],
    glycemicNotes: ["Lentils provide slow carbs + protein", "Go thinner for crisp edges and faster cook"]
  },
  {
    id: "12",
    title: "Hibiscus Mint Iced Tea (No Sugar)",
    description: "Ruby-red, tart-sweet iced tea that looks incredible over ice with mint and citrus",
    image: "https://r2-pub.rork.com/generated-images/7fe34579-5e34-438b-8a7a-2722305b0a0f.png",
    prepTime: 5,
    cookTime: 12,
    servings: 4,
    calories: 5,
    carbsPerServing: 1,
    category: "teas",
    ingredients: [
      "6 cups water",
      "1/2 cup dried hibiscus petals",
      "1/2 cup fresh mint",
      "1 orange, sliced",
      "1/2 lemon, sliced",
      "Ice",
      "Optional: stevia/monk fruit to taste"
    ],
    instructions: [
      "Bring water to a boil, then turn off heat",
      "Steep hibiscus + mint for 10–12 minutes",
      "Strain and cool; add citrus slices",
      "Serve over a big glass of ice"
    ],
    tags: [TEA_TAG, "world-best", "zero-added-sugar"],
    origin: "North Africa / Middle East",
    teaPairings: ["Pairs with any meal"],
    glycemicNotes: ["Tart flavor reduces desire for sweet drinks", "Skip sweetener entirely for best results"]
  },
  {
    id: "13",
    title: "Cinnamon Ginger Green Tea",
    description: "A warming, aromatic tea with a clean finish—great for after meals",
    image: "https://r2-pub.rork.com/generated-images/7a5bd5d9-554b-4b57-8a39-7e676c6c77fc.png",
    prepTime: 3,
    cookTime: 8,
    servings: 2,
    calories: 0,
    carbsPerServing: 0,
    category: "teas",
    ingredients: [
      "2 cups water",
      "2 green tea bags",
      "6 thin slices fresh ginger",
      "1 cinnamon stick",
      "Optional: lemon wedge"
    ],
    instructions: [
      "Simmer ginger + cinnamon in water for 5 minutes",
      "Turn off heat; add tea bags and steep 2–3 minutes",
      "Remove tea bags; add lemon if desired"
    ],
    tags: [TEA_TAG, "after-meal", "world-best"],
    origin: "Global",
    teaPairings: ["Breakfast bowls", "Salads"],
    glycemicNotes: ["Unsweetened by default", "Steep green tea briefly to avoid bitterness"]
  },
  {
    id: "14",
    title: "Golden Turmeric Chai (Unsweetened, Creamy)",
    description: "Comforting chai vibes without the sugar—spiced, foamy, and deeply cozy",
    image: "https://r2-pub.rork.com/generated-images/73b8852f-7fca-4f73-98f3-32848ff1a953.png",
    prepTime: 5,
    cookTime: 10,
    servings: 2,
    calories: 80,
    carbsPerServing: 6,
    category: "teas",
    ingredients: [
      "2 cups unsweetened almond milk",
      "1 cup water",
      "2 black tea bags (or decaf)",
      "1 tsp turmeric",
      "1/2 tsp cinnamon",
      "2 cardamom pods (or pinch ground)",
      "2 thin slices ginger",
      "Pinch black pepper",
      "Optional: vanilla + stevia/monk fruit"
    ],
    instructions: [
      "Simmer water with spices + ginger for 5 minutes",
      "Add tea bags; steep 3 minutes, remove bags",
      "Add almond milk; warm gently (don’t boil hard)",
      "Froth with a whisk; taste and add sweetener if needed"
    ],
    tags: [TEA_TAG, "world-best", "cozy"],
    origin: "India (inspired)",
    teaPairings: ["Dessert cravings", "Evening wind-down"],
    glycemicNotes: ["Use unsweetened milk for lowest carbs", "Vanilla makes it taste sweeter without sugar"]
  }
];
