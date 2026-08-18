import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: true,
  isLight: false
});

const STORAGE_KEY = "aeternum_theme";

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") return saved;
    } catch {
      // Ignora erro de acesso ao localStorage
    }
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (theme === "light") {
      root.classList.remove("a26-theme-dark");
      root.classList.add("a26-theme-light");
      body.classList.remove("a26-theme-dark");
      body.classList.add("a26-theme-light");
    } else {
      root.classList.remove("a26-theme-light");
      root.classList.add("a26-theme-dark");
      body.classList.remove("a26-theme-light");
      body.classList.add("a26-theme-dark");
    }

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignora erro de escrita no localStorage
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = newTheme => {
    if (newTheme === "light" || newTheme === "dark") {
      setThemeState(newTheme);
    }
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      isDark: theme === "dark",
      isLight: theme === "light"
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
