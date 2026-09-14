import { CookingPotIcon } from "lucide-react";

import type { Recipe } from "@/lib/types";
import type { PricesData } from "@/lib/pricing";
import { RecipeCard } from "@/components/recipe-card";

export function RecipeGrid({
  recipes,
  prices,
  onOpen,
}: {
  recipes: Recipe[];
  prices: PricesData;
  onOpen: (recipe: Recipe) => void;
}) {
  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card/60 px-6 py-16 text-center">
        <CookingPotIcon className="size-10 text-muted-foreground" />
        <p className="font-medium">Aún no hay recetas en esta categoría</p>
        <p className="text-sm text-muted-foreground">Agrega más platos en public/data/recipes.json</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} prices={prices} onOpen={() => onOpen(recipe)} />
      ))}
    </div>
  );
}