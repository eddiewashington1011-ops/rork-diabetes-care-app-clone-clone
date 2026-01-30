export interface CategorizedIngredient {
  name: string;
  original: string;
  image?: string;
}

export interface IngredientCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  ingredients: CategorizedIngredient[];
}

const PRODUCE_KEYWORDS = [
  'avocado', 'tomato', 'cucumber', 'onion', 'garlic', 'lemon', 'lime', 'orange',
  'lettuce', 'arugula', 'spinach', 'kale', 'cabbage', 'asparagus', 'celery',
  'zucchini', 'cauliflower', 'broccoli', 'pepper', 'chili', 'ginger', 'mint',
  'cilantro', 'parsley', 'dill', 'basil', 'berry', 'berries', 'mushroom',
  'carrot', 'potato', 'green onion', 'scallion', 'hibiscus', 'water chestnut'
];

const PROTEIN_KEYWORDS = [
  'egg', 'salmon', 'fish', 'chicken', 'turkey', 'beef', 'pork', 'shrimp',
  'tofu', 'tempeh', 'edamame', 'cod', 'halibut', 'tuna', 'moong dal', 'lentil'
];

const DAIRY_KEYWORDS = [
  'yogurt', 'cheese', 'feta', 'milk', 'cream', 'butter', 'almond milk',
  'coconut milk', 'oat milk'
];

const GRAINS_KEYWORDS = [
  'quinoa', 'rice', 'soba', 'noodle', 'oat', 'bread', 'flour', 'pasta'
];

const PANTRY_KEYWORDS = [
  'olive oil', 'sesame oil', 'coconut oil', 'vinegar', 'soy sauce',
  'coconut aminos', 'tahini', 'almond butter', 'chia seed', 'coconut flakes',
  'olives', 'stevia', 'monk fruit', 'vanilla', 'tea', 'water'
];

const SPICES_KEYWORDS = [
  'salt', 'pepper', 'cumin', 'paprika', 'turmeric', 'cinnamon', 'cardamom',
  'red pepper flakes', 'sesame seed', 'black pepper'
];

function extractIngredientName(ingredient: string): string {
  const cleaned = ingredient
    .replace(/^\d+(\.\d+)?\s*(cup|cups|tbsp|tsp|oz|lb|lbs|bunch|head|clove|cloves|slice|slices|piece|pieces|large|medium|small|fresh|dried|ground|grated|minced|chopped|diced|halved|sliced|trimmed|rinsed|cooked|soaked|shelled|thinly|finely|unsweetened|plain|optional|to taste)s?\s*/gi, '')
    .replace(/,.*$/, '')
    .replace(/\(.*\)/, '')
    .trim()
    .toLowerCase();
  
  return cleaned;
}

function categorizeIngredient(ingredient: string): string {
  const name = extractIngredientName(ingredient).toLowerCase();
  
  if (PROTEIN_KEYWORDS.some(k => name.includes(k))) return 'proteins';
  if (DAIRY_KEYWORDS.some(k => name.includes(k))) return 'dairy';
  if (GRAINS_KEYWORDS.some(k => name.includes(k))) return 'grains';
  if (SPICES_KEYWORDS.some(k => name.includes(k))) return 'spices';
  if (PANTRY_KEYWORDS.some(k => name.includes(k))) return 'pantry';
  if (PRODUCE_KEYWORDS.some(k => name.includes(k))) return 'produce';
  
  return 'other';
}

const CATEGORY_CONFIG: Record<string, { name: string; icon: string; color: string }> = {
  produce: { name: 'Produce', icon: '🥬', color: '#4CAF50' },
  proteins: { name: 'Proteins', icon: '🥩', color: '#E91E63' },
  dairy: { name: 'Dairy', icon: '🥛', color: '#2196F3' },
  grains: { name: 'Grains', icon: '🌾', color: '#FF9800' },
  spices: { name: 'Spices', icon: '🧂', color: '#9C27B0' },
  pantry: { name: 'Pantry', icon: '🫙', color: '#795548' },
  other: { name: 'Other', icon: '🍽️', color: '#607D8B' },
};

export function categorizeIngredients(ingredients: string[]): IngredientCategory[] {
  const grouped: Record<string, CategorizedIngredient[]> = {};
  
  ingredients.forEach((ingredient) => {
    const category = categorizeIngredient(ingredient);
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push({
      name: extractIngredientName(ingredient),
      original: ingredient,
    });
  });
  
  const orderedCategories = ['produce', 'proteins', 'dairy', 'grains', 'pantry', 'spices', 'other'];
  
  return orderedCategories
    .filter((catId) => grouped[catId]?.length > 0)
    .map((catId) => ({
      id: catId,
      ...CATEGORY_CONFIG[catId],
      ingredients: grouped[catId],
    }));
}

export function getIngredientImagePrompt(ingredientName: string): string {
  return `A single fresh ${ingredientName} ingredient, studio photography style, centered on pure white background, soft natural lighting, high resolution food photography, clean minimal composition, no text, no labels`;
}
