export interface MealItem {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  recipeId?: string;
}

export interface DayMealPlan {
  date: string;
  dayName: string;
  breakfast: MealItem;
  morningSnack: MealItem;
  lunch: MealItem;
  afternoonSnack: MealItem;
  dinner: MealItem;
  totalCalories: number;
  totalCarbs: number;
}

export const weeklyMealPlan: DayMealPlan[] = [
  {
    date: "2024-01-22",
    dayName: "Monday",
    breakfast: { id: "b1", name: "Avocado Egg Bowl", calories: 320, carbs: 12, protein: 18, recipeId: "1" },
    morningSnack: { id: "ms1", name: "Handful of Almonds", calories: 80, carbs: 3, protein: 3 },
    lunch: { id: "l1", name: "Mediterranean Quinoa Salad", calories: 290, carbs: 28, protein: 12, recipeId: "3" },
    afternoonSnack: { id: "as1", name: "Celery with Almond Butter", calories: 150, carbs: 6, protein: 4, recipeId: "6" },
    dinner: { id: "d1", name: "Grilled Salmon with Asparagus", calories: 380, carbs: 8, protein: 36, recipeId: "2" },
    totalCalories: 1220,
    totalCarbs: 57
  },
  {
    date: "2024-01-23",
    dayName: "Tuesday",
    breakfast: { id: "b2", name: "Greek Yogurt Parfait", calories: 220, carbs: 18, protein: 15, recipeId: "5" },
    morningSnack: { id: "ms2", name: "Hard Boiled Eggs (2)", calories: 140, carbs: 1, protein: 12 },
    lunch: { id: "l2", name: "Turkey Lettuce Wraps", calories: 210, carbs: 8, protein: 24, recipeId: "8" },
    afternoonSnack: { id: "as2", name: "Cucumber Slices with Hummus", calories: 100, carbs: 8, protein: 3 },
    dinner: { id: "d2", name: "Cauliflower Rice Stir-Fry", calories: 180, carbs: 10, protein: 14, recipeId: "4" },
    totalCalories: 850,
    totalCarbs: 45
  },
  {
    date: "2024-01-24",
    dayName: "Wednesday",
    breakfast: { id: "b3", name: "Spinach Mushroom Omelette", calories: 280, carbs: 4, protein: 20 },
    morningSnack: { id: "ms3", name: "String Cheese", calories: 80, carbs: 1, protein: 7 },
    lunch: { id: "l3", name: "Grilled Chicken Salad", calories: 350, carbs: 12, protein: 32 },
    afternoonSnack: { id: "as3", name: "Mixed Berries", calories: 60, carbs: 14, protein: 1 },
    dinner: { id: "d3", name: "Baked Cod with Vegetables", calories: 320, carbs: 15, protein: 30 },
    totalCalories: 1090,
    totalCarbs: 46
  },
  {
    date: "2024-01-25",
    dayName: "Thursday",
    breakfast: { id: "b4", name: "Chia Seed Pudding", calories: 180, carbs: 15, protein: 6, recipeId: "7" },
    morningSnack: { id: "ms4", name: "Walnuts (1/4 cup)", calories: 190, carbs: 4, protein: 4 },
    lunch: { id: "l4", name: "Mediterranean Quinoa Salad", calories: 290, carbs: 28, protein: 12, recipeId: "3" },
    afternoonSnack: { id: "as4", name: "Cottage Cheese with Berries", calories: 120, carbs: 8, protein: 14 },
    dinner: { id: "d4", name: "Grilled Salmon with Asparagus", calories: 380, carbs: 8, protein: 36, recipeId: "2" },
    totalCalories: 1160,
    totalCarbs: 63
  },
  {
    date: "2024-01-26",
    dayName: "Friday",
    breakfast: { id: "b5", name: "Avocado Egg Bowl", calories: 320, carbs: 12, protein: 18, recipeId: "1" },
    morningSnack: { id: "ms5", name: "Cherry Tomatoes with Mozzarella", calories: 120, carbs: 6, protein: 8 },
    lunch: { id: "l5", name: "Turkey Lettuce Wraps", calories: 210, carbs: 8, protein: 24, recipeId: "8" },
    afternoonSnack: { id: "as5", name: "Celery with Almond Butter", calories: 150, carbs: 6, protein: 4, recipeId: "6" },
    dinner: { id: "d5", name: "Herb Roasted Chicken Breast", calories: 340, carbs: 5, protein: 38 },
    totalCalories: 1140,
    totalCarbs: 37
  },
  {
    date: "2024-01-27",
    dayName: "Saturday",
    breakfast: { id: "b6", name: "Greek Yogurt Parfait", calories: 220, carbs: 18, protein: 15, recipeId: "5" },
    morningSnack: { id: "ms6", name: "Pecans (1/4 cup)", calories: 170, carbs: 3, protein: 2 },
    lunch: { id: "l6", name: "Cauliflower Rice Stir-Fry", calories: 180, carbs: 10, protein: 14, recipeId: "4" },
    afternoonSnack: { id: "as6", name: "Guacamole with Veggie Sticks", calories: 140, carbs: 10, protein: 2 },
    dinner: { id: "d6", name: "Grilled Shrimp Skewers", calories: 280, carbs: 6, protein: 32 },
    totalCalories: 990,
    totalCarbs: 47
  },
  {
    date: "2024-01-28",
    dayName: "Sunday",
    breakfast: { id: "b7", name: "Smoked Salmon on Cucumber Rounds", calories: 200, carbs: 4, protein: 18 },
    morningSnack: { id: "ms7", name: "Mixed Nuts", calories: 160, carbs: 5, protein: 5 },
    lunch: { id: "l7", name: "Mediterranean Quinoa Salad", calories: 290, carbs: 28, protein: 12, recipeId: "3" },
    afternoonSnack: { id: "as7", name: "Sugar-Free Jello", calories: 10, carbs: 0, protein: 1 },
    dinner: { id: "d7", name: "Cauliflower Rice Stir-Fry", calories: 180, carbs: 10, protein: 14, recipeId: "4" },
    totalCalories: 840,
    totalCarbs: 47
  }
];

export const mealTips = [
  "Eat protein with every meal to slow glucose absorption",
  "Fill half your plate with non-starchy vegetables",
  "Choose whole grains over refined carbohydrates",
  "Stay hydrated - drink water with meals",
  "Eat meals at consistent times each day"
];
