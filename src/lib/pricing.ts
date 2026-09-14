import type { Recipe } from "./types.ts";
import { ingredientLabel } from "./utils.ts";

export interface PriceItem {
  price: number;
  unit: string;
}

export interface PriceEntry {
  date: string;
  items: Record<string, PriceItem>;
}

export interface PricesData {
  currency: string;
  history: PriceEntry[];
}

export type BaseUnit = "ml" | "g" | "unidad";
type UnitKind = "volume" | "mass" | "count";

interface UnitInfo {
  kind: UnitKind;
  toBase: number;
  base: BaseUnit;
}

const BASE_TO_CANONICAL: Record<BaseUnit, number> = {
  ml: 1 / 1000, // a litros
  g: 1 / 1000, // a kilogramos
  unidad: 1,
};

export function unitInfo(unit: string): UnitInfo | null {
  const u = unit.trim().toLowerCase();
  if (["ml", "mililitro", "mililitros"].includes(u)) return { kind: "volume", toBase: 1, base: "ml" };
  if (["l", "litro", "litros"].includes(u)) return { kind: "volume", toBase: 1000, base: "ml" };
  if (["cucharadita", "cucharaditas", "cdta"].includes(u)) return { kind: "volume", toBase: 5, base: "ml" };
  if (["cucharada", "cucharadas", "cda"].includes(u)) return { kind: "volume", toBase: 15, base: "ml" };
  if (["g", "gr", "gramo", "gramos"].includes(u)) return { kind: "mass", toBase: 1, base: "g" };
  if (["kg", "kilo", "kilos"].includes(u)) return { kind: "mass", toBase: 1000, base: "g" };
  if (["unidad", "unidades", "ud", "uds", "u", "un", "pza", "pieza", "piezas"].includes(u))
    return { kind: "count", toBase: 1, base: "unidad" };
  return null;
}

export interface IngredientTotal {
  name: string;
  amountBase: number;
  baseUnit: BaseUnit;
  amountLabel: string;
  sources: string[];
  sourceLabel: string;
}

export function aggregateIngredients(recipe: Recipe): IngredientTotal[] {
  const map = new Map<string, IngredientTotal & { kind: UnitKind }>();

  const add = (name: string, amount: number, unit: string, label: string) => {
    const info = unitInfo(unit);
    if (!info || amount <= 0) return;

    const amountBase = amount * info.toBase;
    const existing = map.get(name);

    if (!existing) {
      map.set(name, {
        name,
        amountBase,
        baseUnit: info.base,
        kind: info.kind,
        amountLabel: label,
        sources: [label],
        sourceLabel: label,
      });
      return;
    }

    // Solo suma si comparten el mismo tipo de unidad (volumen, masa o unidades).
    if (existing.kind !== info.kind) return;

    // Convierte la nueva cantidad a la unidad base ya registrada.
    const canonicalNew = amountBase * BASE_TO_CANONICAL[info.base];
    const converted = canonicalNew / BASE_TO_CANONICAL[existing.baseUnit];
    existing.amountBase += converted;
    existing.sources.push(label);
    existing.sourceLabel = existing.sources.join(" + ");
  };

  for (const group of recipe.ingredientGroups) {
    for (const ing of group.ingredients) {
      const fmt = ingredientLabel(ing.amount, ing.unit, ing.displayAmount);
      add(ing.name, ing.amount, ing.unit, fmt);
    }
  }

  return [...map.values()].map(({ name, amountBase, baseUnit, amountLabel, sources, sourceLabel }) => ({
    name,
    amountBase,
    baseUnit,
    amountLabel,
    sources,
    sourceLabel,
  }));
}

export interface PriceLine {
  name: string;
  amount: number;
  amountLabel: string;
  baseAmountUnit: string;
  sourceLabel: string;
  marketPrice: number;
  marketUnit: string;
  cost: number;
  missing: boolean;
  incompatible: boolean;
  overridden: boolean;
}

export interface RecipeCost {
  lines: PriceLine[];
  total: number;
  perUnit: number;
  missing: string[];
  incompatible: string[];
}

export function pickPriceEntry(
  history: PriceEntry[],
  recipeDate: string,
  mode: "recipe" | "latest"
): { entry: PriceEntry; date: string } {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return { entry: { date: "", items: {} }, date: "" };
  if (mode === "latest") {
    const entry = sorted[sorted.length - 1];
    return { entry, date: entry.date };
  }
  const onOrBefore = sorted.filter((e) => e.date <= recipeDate);
  const entry = onOrBefore.length > 0 ? onOrBefore[onOrBefore.length - 1] : sorted[0];
  return { entry, date: entry.date };
}

export function computeRecipeCost(
  recipe: Recipe,
  entry: PriceEntry,
  overrides: Record<string, number> = {}
): RecipeCost {
  const totals = aggregateIngredients(recipe);
  let total = 0;
  const missing: string[] = [];
  const incompatible: string[] = [];

  const computeCost = (amount: number, unit: string, unitPrice: number, marketUnit: string): number => {
    const r = canonicalFromUnit(amount, unit);
    const p = canonicalFromUnit(1, marketUnit);
    if (!r || !p || r.kind !== p.kind) return -1;
    return (r.value / p.value) * unitPrice;
  };

  const lines: PriceLine[] = totals.map((t) => {
    const override = overrides[t.name];
    const item = entry.items[t.name];

    if (override != null && Number.isFinite(override)) {
      const marketUnit = item?.unit ?? "";
      const cost = computeCost(t.amountBase, t.baseUnit, override, marketUnit);
      const incompatibleLine = cost < 0;
      if (incompatibleLine) {
        incompatible.push(t.name);
      } else {
        total += cost;
      }
      return {
        name: t.name,
        amount: t.amountBase,
        amountLabel: t.amountLabel,
        sourceLabel: t.sourceLabel,
        marketPrice: override,
        marketUnit,
        baseAmountUnit: t.baseUnit,
        cost: incompatibleLine ? 0 : cost,
        missing: false,
        incompatible: incompatibleLine,
        overridden: true,
      };
    }

    if (!item) {
      missing.push(t.name);
      return {
        name: t.name,
        amount: t.amountBase,
        amountLabel: t.amountLabel,
        sourceLabel: t.sourceLabel,
        marketPrice: 0,
        marketUnit: "",
        baseAmountUnit: t.baseUnit,
        cost: 0,
        missing: true,
        incompatible: false,
        overridden: false,
      };
    }

    const cost = computeCost(t.amountBase, t.baseUnit, item.price, item.unit);
    if (cost < 0) {
      incompatible.push(t.name);
      return {
        name: t.name,
        amount: t.amountBase,
        amountLabel: t.amountLabel,
        sourceLabel: t.sourceLabel,
        marketPrice: item.price,
        marketUnit: item.unit,
        baseAmountUnit: t.baseUnit,
        cost: 0,
        missing: false,
        incompatible: true,
        overridden: false,
      };
    }

    total += cost;
    return {
      name: t.name,
      amount: t.amountBase,
      amountLabel: t.amountLabel,
      sourceLabel: t.sourceLabel,
      marketPrice: item.price,
      marketUnit: item.unit,
      baseAmountUnit: t.baseUnit,
      cost,
      missing: false,
      incompatible: false,
      overridden: false,
    };
  });

  return {
    lines,
    total,
    perUnit: recipe.yieldAmount > 0 ? total / recipe.yieldAmount : total,
    missing,
    incompatible,
  };
}

function canonicalFromUnit(amount: number, unit: string): { kind: UnitKind; value: number } | null {
  const info = unitInfo(unit);
  if (!info) return null;
  const factor = BASE_TO_CANONICAL[info.base];
  return { kind: info.kind, value: amount * info.toBase * factor };
}

export function formatCurrency(value: number, currency: string, maxFractionDigits = 0): string {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: maxFractionDigits,
    }).format(value);
  } catch {
    return `$${value.toLocaleString("es-CO")}`;
  }
}