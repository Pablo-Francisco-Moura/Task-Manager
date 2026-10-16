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
import { themeStorageKey } from "@/constants/app";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import type { TypeTheme } from "@/types";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function getSystemTheme(): TypeTheme {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStoredTheme(): TypeTheme {
  try {
    const savedTheme = window.localStorage.getItem(themeStorageKey);
    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }
  } catch {
    // Fall back to the browser preference when storage is unavailable.
  }

  return getSystemTheme();
}

function applyThemeClass(theme: TypeTheme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
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
      window.localStorage.setItem(themeStorageKey, theme);
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
