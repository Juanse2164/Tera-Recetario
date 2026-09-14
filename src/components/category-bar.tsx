import { cn } from "@/lib/utils";
import { categoryLabel } from "@/lib/categories";
import { Button } from "@/components/ui/button";

export interface CategoryOption {
  id: string;
  count: number;
}

export function CategoryBar({
  categories,
  active,
  onSelect,
}: {
  categories: CategoryOption[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {categories.map((c) => (
        <Button
          key={c.id}
          type="button"
          size="sm"
          variant={active === c.id ? "default" : "outline"}
          className={cn("rounded-full", active === c.id && "shadow-sm")}
          onClick={() => onSelect(c.id)}
        >
          {categoryLabel(c.id)}
          <span
            className={cn(
              "rounded-full px-1.5 text-[10px] font-semibold",
              active === c.id ? "bg-primary-foreground/15 text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {c.count}
          </span>
        </Button>
      ))}
    </div>
  );
}