import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatQty(value: number): string {
  if (Number.isInteger(value)) {
    return value.toLocaleString("es-CO");
  }
  return value.toLocaleString("es-CO", { maximumFractionDigits: 2 });
}

export function ingredientLabel(amount: number, unit: string, displayAmount?: string): string {
  if (displayAmount) {
    const target = displayAmount;
    const lowered = target.toLowerCase();
    const boosted = unit.toLowerCase();
    if (lowered.includes(boosted)) return target;
    if (/[a-záéíóúüñ]/i.test(target)) return target;
    return `${target} ${unit}`;
  }
  return `${formatQty(amount)} ${unit}`;
}