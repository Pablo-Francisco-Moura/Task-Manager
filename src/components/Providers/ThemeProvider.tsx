"use client";

import React, {
  useMemo,
  useState,
  useEffect,
  useContext,
  createContext,
  useLayoutEffect,
} from "react";
import { createMuiTheme } from "./createMuiTheme";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import type { TypeTheme } from "@/types";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function readStoredTheme(): TypeTheme {
  try {
    const savedTheme = window.localStorage.getItem("theme");
    return savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : "light";
  } catch {
    return "light";
  }
}

function applyThemeClass(theme: TypeTheme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}

interface IThemeContextProps {
  theme: TypeTheme;
  toggleTheme: () => void;
}
interface IThemeProviderProps {
  children: React.ReactNode;
}

const ThemeContext = createContext<IThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: IThemeProviderProps) => {
  const [theme, setTheme] = useState<TypeTheme>("light");
  const [isInitialized, setIsInitialized] = useState(false);
  const muiTheme = useMemo(() => createMuiTheme(theme), [theme]);

  useIsomorphicLayoutEffect(() => {
    const initialTheme = readStoredTheme();
    setTheme(initialTheme);
    applyThemeClass(initialTheme);
    setIsInitialized(true);
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!isInitialized) return;

    applyThemeClass(theme);
    try {
      window.localStorage.setItem("theme", theme);
    } catch {
      // Keep the in-memory theme usable when storage is unavailable.
    }
  }, [isInitialized, theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
