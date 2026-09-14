export const CATEGORY_LABELS: Record<string, string> = {
  postres: "Postres",
  "platos-principales": "Platos principales",
  aperitivos: "Aperitivos",
  entradas: "Entradas",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}