import { useMemo, useState } from "react";
import {
  CalculatorIcon,
  RotateCcwIcon,
  ShoppingBasketIcon,
  TriangleAlertIcon,
} from "lucide-react";

import type { Recipe } from "@/lib/types";
import {
  computeRecipeCost,
  formatCurrency,
  pickPriceEntry,
  type PricesData,
} from "@/lib/pricing";
import { cn, formatQty } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PriceMode = "recipe" | "latest";

export function PriceCalculator({ recipe, prices }: { recipe: Recipe; prices: PricesData }) {
  const [portions, setPortions] = useState("1");
  const [priceMode, setPriceMode] = useState<PriceMode>("recipe");
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const entry = useMemo(
    () => pickPriceEntry(prices.history, recipe.dateAdded, priceMode).entry,
    [prices, recipe, priceMode]
  );

  const parsedOverrides = useMemo(() => {
    const parsed: Record<string, number> = {};
    for (const [name, value] of Object.entries(overrides)) {
      const num = parseFloat(value);
      if (Number.isFinite(num) && num >= 0) parsed[name] = num;
    }
    return parsed;
  }, [overrides]);

  const cost = useMemo(
    () => computeRecipeCost(recipe, entry, parsedOverrides),
    [recipe, entry, parsedOverrides]
  );

  const n = Math.max(1, parseFloat(portions) || 1);
  const total = cost.total * n;
  const unitsProduced = recipe.yieldAmount * n;
  const hasOverrides = Object.keys(parsedOverrides).length > 0;
  const hasIssues = cost.missing.length > 0 || cost.incompatible.length > 0;

  return (
    <Card id="costos" className="scroll-mt-20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <CalculatorIcon className="size-4" />
          </span>
          <CardTitle className="font-display text-xl">Calculadora de costos</CardTitle>
        </div>
        <CardDescription>
          Valor aproximado de los ingredientes por unidad.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {/* Controles */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`portions-${recipe.id}`}>Porciones</Label>
            <Input
              id={`portions-${recipe.id}`}
              type="number"
              min={1}
              step={1}
              value={portions}
              onChange={(e) => setPortions(e.target.value)}
              className="h-9 w-24"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Precios de referencia</Label>
            <Select value={priceMode} onValueChange={(v) => setPriceMode(v as PriceMode)}>
              <SelectTrigger className="h-9 w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recipe">Fecha de la receta ({entry.date || "—"})</SelectItem>
                <SelectItem value="latest">Más recientes ({prices.history[prices.history.length - 1]?.date || "—"})</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasOverrides && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOverrides({})}
              className="mb-0.5"
            >
              <RotateCcwIcon />
              Restablecer precios
            </Button>
          )}
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-secondary/40 p-4">
            <p className="text-xs text-muted-foreground">Produciré</p>
            <p className="mt-1 font-display text-lg font-semibold">
              {formatQty(unitsProduced)} {recipe.yieldUnit}
              {n > 1 ? ` × ${formatQty(n)}` : ""}
            </p>
          </div>
          <div className="rounded-xl border bg-secondary/40 p-4">
            <p className="text-xs text-muted-foreground">Costo total aprox.</p>
            <p className="mt-1 font-display text-lg font-semibold">{formatCurrency(total, prices.currency)}</p>
          </div>
          <div className="rounded-xl border bg-primary/20 p-4">
            <p className="text-xs text-muted-foreground">Valor aprox. por {recipe.yieldUnit}</p>
            <p className="mt-1 font-display text-2xl font-bold text-primary">
              {formatCurrency(cost.perUnit, prices.currency)}
            </p>
          </div>
        </div>

        {/* Avisos */}
        {hasIssues && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-foreground">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
            <span>
              {cost.missing.length > 0 && (
                <span>
                  Faltan precios para {cost.missing.join(", ")}. Agrégalos en{" "}
                  <code className="rounded bg-muted px-1">public/data/prices.json</code>.{" "}
                </span>
              )}
              {cost.incompatible.length > 0 && (
                <span>Unidades incompatibles para {cost.incompatible.join(", ")}.</span>
              )}
            </span>
          </div>
        )}

        {hasOverrides && (
          <p className="text-xs text-muted-foreground">
            Algunos precios fueron editados en esta sesión. Los cambios no se guardan; actualiza{" "}
            <code className="rounded bg-muted px-1">public/data/prices.json</code> para guardarlos.
          </p>
        )}

        {/* Desglose */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <ShoppingBasketIcon className="size-4 text-muted-foreground" />
            Ingredientes necesarios para el plato
            <Badge variant="secondary" className="ml-auto">
              Precios del {entry.date || "—"}
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-2 font-medium">Ingrediente</th>
                  <th className="pb-2 pr-2 font-medium">Cantidad ×{formatQty(n)}</th>
                  <th className="pb-2 pr-2 font-medium">Precio de mercado</th>
                  <th className="pb-2 text-right font-medium">Costo</th>
                </tr>
              </thead>
              <tbody>
                {cost.lines.map((line) => (
                  <tr key={line.name} className={cn("border-b last:border-0", line.missing && "bg-destructive/5")}>
                    <td className="py-2.5 pr-2">
                      <span className="font-medium">{line.name}</span>
                      {line.sourceLabel && line.sourceLabel !== line.amountLabel && (
                        <span className="block text-[11px] text-muted-foreground">
                          ({line.sourceLabel})
                        </span>
                      )}
                      {line.missing && (
                        <span className="mt-0.5 block text-[11px] text-destructive">Sin precio registrado</span>
                      )}
                      {line.incompatible && (
                        <span className="mt-0.5 block text-[11px] text-destructive">Unidades incompatibles</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-2 font-medium whitespace-nowrap">
                      {formatQty(line.amount * n)} {line.baseAmountUnit}
                    </td>
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={line.marketUnit ? (overrides[line.name] ?? String(line.marketPrice)) : ""}
                          disabled={!line.marketUnit}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOverrides((prev) => {
                              const next = { ...prev };
                              if (val === "") delete next[line.name];
                              else next[line.name] = val;
                              return next;
                            });
                          }}
                          className={cn(
                            "h-8 w-24 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                            line.overridden && "border-primary bg-primary/10"
                          )}
                          aria-label={`Precio por ${line.marketUnit || "unidad"} de ${line.name}`}
                        />
                        <span className="text-xs text-muted-foreground">/{line.marketUnit || "—"}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-semibold whitespace-nowrap">
                      {formatCurrency(line.cost * n, prices.currency, line.cost * n > 0 && line.cost * n < 100 ? 1 : 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-3 text-right text-sm font-medium">
                    Total ×{formatQty(n)}
                  </td>
                  <td className="pt-3 text-right font-display text-base font-bold text-primary">
                    {formatCurrency(total, prices.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}