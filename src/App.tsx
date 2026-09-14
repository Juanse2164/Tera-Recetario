import { useEffect, useMemo, useState } from "react";
import { LoaderCircleIcon, TriangleAlertIcon } from "lucide-react";

import type { Recipe, RecipesFile } from "@/lib/types";
import type { PricesData } from "@/lib/pricing";
import { Header } from "@/components/header";
import { CategoryBar, type CategoryOption } from "@/components/category-bar";
import { RecipeGrid } from "@/components/recipe-grid";
import { RecipeDetail } from "@/components/recipe-detail";

export default function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [prices, setPrices] = useState<PricesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/data/recipes.json").then((r) => {
        if (!r.ok) throw new Error("No se pudieron cargar las recetas");
        return r.json() as Promise<RecipesFile>;
      }),
      fetch("/data/prices.json").then((r) => {
        if (!r.ok) throw new Error("No se pudieron cargar los precios");
        return r.json() as Promise<PricesData>;
      }),
    ])
      .then(([r, p]) => {
        setRecipes(r.recipes ?? []);
        setPrices(p);
        setLoading(false);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Ocurrió un error al cargar los datos");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [selectedId]);

  const selected = useMemo(
    () => (selectedId ? recipes.find((r) => r.id === selectedId) ?? null : null),
    [recipes, selectedId]
  );

  const categories: CategoryOption[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of recipes) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    const ids = ["todos", ...[...counts.keys()]];
    return ids.map((id) => ({ id, count: id === "todos" ? recipes.length : (counts.get(id) ?? 0) }));
  }, [recipes]);

  const visible = useMemo(
    () => (category === "todos" ? recipes : recipes.filter((r) => r.category === category)),
    [recipes, category]
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
            <LoaderCircleIcon className="size-8 animate-spin" />
            <p className="text-sm">Cargando el recetario…</p>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md rounded-2xl border border-destructive/40 bg-destructive/10 px-6 py-10 text-center">
            <TriangleAlertIcon className="mx-auto mb-3 size-8 text-destructive" />
            <h2 className="font-display text-xl font-semibold">No pudimos cargar los datos</h2>
            <p className="mt-2 text-sm text-foreground/80">{error}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Verifica que existan public/data/recipes.json y public/data/prices.json.
            </p>
          </div>
        ) : selected ? (
          <RecipeDetail
            recipe={selected}
            prices={prices ?? { currency: "COP", history: [] }}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">¿Qué cocinamos hoy?</h2>
              <p className="text-sm text-muted-foreground">
                {recipes.length} {recipes.length === 1 ? "receta" : "recetas"} guardadas en{" "}
                <code className="rounded bg-muted px-1">public/data/recipes.json</code>
              </p>
            </div>

            <CategoryBar categories={categories} active={category} onSelect={setCategory} />

            <RecipeGrid
              recipes={visible}
              prices={prices ?? { currency: "COP", history: [] }}
              onOpen={(recipe) => setSelectedId(recipe.id)}
            />
          </div>
        )}
      </main>

      <footer className="border-t bg-background/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">Tera · Recetario — platos, ingredientes y costos.</p>
          <p className="text-xs text-muted-foreground">
            Precios de referencia en <code className="rounded bg-muted px-1">public/data/prices.json</code>
          </p>
        </div>
      </footer>
    </div>
  );
}