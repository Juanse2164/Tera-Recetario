import { useMemo } from "react";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  LayersIcon,
  ListOrderedIcon,
  ShoppingBasketIcon,
  SparklesIcon,
} from "lucide-react";

import type { Recipe } from "@/lib/types";
import { categoryLabel } from "@/lib/categories";
import { formatDate, formatQty, ingredientLabel } from "@/lib/utils";
import {
  computeRecipeCost,
  formatCurrency,
  pickPriceEntry,
  type PricesData,
} from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PriceCalculator } from "@/components/price-calculator";

export function RecipeDetail({
  recipe,
  prices,
  onBack,
}: {
  recipe: Recipe;
  prices: PricesData;
  onBack: () => void;
}) {
  const perUnit = useMemo(() => {
    if (!prices || prices.history.length === 0) return null;
    const { entry } = pickPriceEntry(prices.history, recipe.dateAdded, "recipe");
    return computeRecipeCost(recipe, entry).perUnit;
  }, [recipe, prices]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeftIcon />
          Volver al recetario
        </Button>
      </div>

      {/* Encabezado */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="sticky top-24 overflow-hidden rounded-2xl border bg-card shadow-card">
            {recipe.image ? (
              <img src={recipe.image} alt={recipe.title} className="aspect-square size-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-muted">
                <ShoppingBasketIcon className="size-12 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:col-span-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{categoryLabel(recipe.category)}</Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDaysIcon className="size-3.5" />
              Publicada el {formatDate(recipe.dateAdded)}
            </span>
          </div>

          <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{recipe.title}</h2>
          <p className="text-muted-foreground">{recipe.description}</p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="py-1.5 text-sm">
              Rinde {formatQty(recipe.yieldAmount)} {recipe.yieldUnit}
            </Badge>
            {perUnit != null && (
              <Badge variant="secondary" className="py-1.5 text-sm">
                Costo aprox.:{" "}
                <span className="font-display font-bold text-primary">
                  {formatCurrency(perUnit, prices.currency)}
                </span>
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Ingredientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <ShoppingBasketIcon className="size-4" />
            </span>
            <CardTitle className="font-display text-xl">Ingredientes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {recipe.ingredientGroups.map((group, gi) => (
            <div key={gi}>
              {group.title && <h3 className="mb-1 text-sm font-semibold text-foreground">{group.title}</h3>}
              {group.note && <p className="mb-2 text-xs text-muted-foreground">{group.note}</p>}
              <ul className="divide-y divide-border/70 rounded-xl border bg-muted/30 px-1">
                {group.ingredients.map((ing, ii) => (
                  <li key={ii} className="flex items-baseline justify-between gap-4 px-3 py-2.5">
                    <span className="text-sm">
                      {ing.name}
                      {ing.note && <span className="block text-xs text-muted-foreground">{ing.note}</span>}
                    </span>
                    <span className="shrink-0 text-sm font-semibold whitespace-nowrap text-muted-foreground">
                      {ingredientLabel(ing.amount, ing.unit, ing.displayAmount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Montaje */}
      {recipe.assembly && recipe.assembly.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <LayersIcon className="size-4" />
              </span>
              <CardTitle className="font-display text-xl">Montaje</CardTitle>
            </div>
            {recipe.assemblyNote && <CardDescription>{recipe.assemblyNote}</CardDescription>}
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-y-2 rounded-xl bg-secondary/40 px-4 py-3">
              {recipe.assembly.map((layer, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <ChevronRightIcon className="size-3.5 text-muted-foreground" />}
                  <span
                    className={
                      layer === "Crema"
                        ? "rounded-full bg-primary/25 px-3 py-1 text-sm font-medium text-primary-foreground shadow-inner"
                        : layer === "Ducales"
                          ? "rounded-full bg-amber-500/25 px-3 py-1 text-sm font-medium shadow-inner"
                          : "rounded-full bg-foreground/10 px-3 py-1 text-sm font-medium shadow-inner"
                    }
                  >
                    {layer}
                  </span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preparación */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <ListOrderedIcon className="size-4" />
            </span>
            <CardTitle className="font-display text-xl">Preparación paso a paso</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-0">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3 border-b py-3 last:border-0">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="pt-1 text-sm leading-relaxed text-foreground/90">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Cosas a tener en cuenta */}
      {recipe.notes && recipe.notes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <SparklesIcon className="size-4" />
              </span>
              <CardTitle className="font-display text-xl">A tener en cuenta</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2.5">
              {recipe.notes.map((note, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="leading-relaxed text-foreground/90">{note}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Calculadora */}
      <PriceCalculator recipe={recipe} prices={prices} />
    </div>
  );
}