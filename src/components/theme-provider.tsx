import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "pink" | "blue" | "yellow";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "pink",
  setTheme: () => {},
});

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem("tera-theme");
    if (stored === "pink" || stored === "blue" || stored === "yellow") return stored;
  } catch {
    // sin acceso a localStorage
  }
  return "pink";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("tera-theme", theme);
    } catch {
      // sin acceso a localStorage
    }
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}