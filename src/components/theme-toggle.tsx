import { cn } from "@/lib/utils";
import { useTheme, type Theme } from "@/components/theme-provider";

const THEMES: { id: Theme; label: string; dot: string }[] = [
  { id: "pink", label: "Rosa", dot: "bg-[#ff9ec4]" },
  { id: "blue", label: "Azul", dot: "bg-[#9ecbff]" },
  { id: "yellow", label: "Amarillo", dot: "bg-[#ffe08a]" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-full border bg-background/70 p-1" aria-label="Cambiar tema">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTheme(t.id)}
          title={`Tema ${t.label}`}
          aria-pressed={theme === t.id}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            theme === t.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className={cn("size-2.5 rounded-full", t.dot)} />
          {t.label}
        </button>
      ))}
    </div>
  );
}