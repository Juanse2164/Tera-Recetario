import { useMemo } from "react";
import { CakeIcon, CroissantIcon, SoupIcon, UtensilsCrossedIcon } from "lucide-react";

import type { Recipe } from "@/lib/types";
import { categoryLabel } from "@/lib/categories";
import { formatDate, formatQty } from "@/lib/utils";
import { computeRecipeCost, formatCurrency, pickPriceEntry, type PricesData } from "@/lib/pricing";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  postres: CakeIcon,
  "platos-principales": UtensilsCrossedIcon,
  aperitivos: CroissantIcon,
  entradas: SoupIcon,
};

export function RecipeCard({
  recipe,
  prices,
  onOpen,
}: {
  recipe: Recipe;
  prices: PricesData;
  onOpen: () => void;
}) {
  const perUnit = useMemo(() => {
    if (!prices || prices.history.length === 0) return null;
    const { entry } = pickPriceEntry(prices.history, recipe.dateAdded, "recipe");
    const cost = computeRecipeCost(recipe, entry);
    return cost.perUnit;
  }, [recipe, prices]);

  const CategoryIcon = CATEGORY_ICONS[recipe.category];

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group cursor-pointer overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            {CategoryIcon && <CategoryIcon className="size-12 text-muted-foreground" />}
          </div>
        )}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge className="shadow-sm" variant="secondary">
            {CategoryIcon && <CategoryIcon className="size-3" />}
            {categoryLabel(recipe.category)}
          </Badge>
        </div>
      </div>

      <CardContent className="gap-2 py-4">
        <h3 className="font-display text-xl font-semibold leading-snug">{recipe.title}</h3>
        <p className="text-xs text-muted-foreground">Publicada el {formatDate(recipe.dateAdded)}</p>
        <div className="mt-3 flex items-end justify-between gap-3 border-t pt-3">
          <span className="text-xs text-muted-foreground">
            Rinde {formatQty(recipe.yieldAmount)} {recipe.yieldUnit}
          </span>
          {perUnit != null ? (
            <span className="shrink-0 text-right">
              <span className="block text-[10px] text-muted-foreground">costo aprox. por unidad</span>
              <span className="font-display text-base font-semibold text-primary">
                {formatCurrency(perUnit, prices.currency)}
              </span>
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Sin precios</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}