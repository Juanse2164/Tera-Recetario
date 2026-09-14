export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  displayAmount?: string;
  note?: string;
}

export interface IngredientGroup {
  title?: string;
  note?: string;
  ingredients: Ingredient[];
}

export interface Recipe {
  id: string;
  title: string;
  category: string;
  description: string;
  dateAdded: string;
  yieldAmount: number;
  yieldUnit: string;
  image?: string;
  ingredientGroups: IngredientGroup[];
  steps: string[];
  assembly?: string[];
  assemblyNote?: string;
  notes?: string[];
}

export interface RecipesFile {
  recipes: Recipe[];
}