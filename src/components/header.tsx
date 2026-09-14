import { BookHeartIcon } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <BookHeartIcon className="size-5" />
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold leading-none">Tera · Recetario</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">Platos, ingredientes y costos</p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}