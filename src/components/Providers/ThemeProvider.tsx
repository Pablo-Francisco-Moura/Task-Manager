"use client";

import {
  useMemo,
  useState,
  useEffect,
  useContext,
  createContext,
  useLayoutEffect,
} from "react";
import { createMuiTheme } from "./createMuiTheme";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { colorSettingsStorageKey, themeStorageKey } from "@/constants/app";
import { DEFAULT_COLOR_SETTINGS } from "@/constants";
import {
  getThemeColors,
  applyThemeColors,
  normalizeColorSettings,
} from "./colorTokens";
import { hasAccessibleColorSettings } from "./colorContrastValidation";
import type {
  TypeColorSettings,
  TypeTheme,
  TypeThemeContextProps,
  TypeThemeProviderProps,
} from "@/types";

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

function readStoredColorSettings(): TypeColorSettings {
  try {
    const savedSettings = window.localStorage.getItem(colorSettingsStorageKey);
    if (!savedSettings) return DEFAULT_COLOR_SETTINGS;

    const settings = normalizeColorSettings(JSON.parse(savedSettings));
    const migratedSettings = {
      brand:
        settings.brand === "#254b3d"
          ? DEFAULT_COLOR_SETTINGS.brand
          : settings.brand,
      accent:
        settings.accent === "#a6432e"
          ? DEFAULT_COLOR_SETTINGS.accent
          : settings.accent,
    };
    return hasAccessibleColorSettings(migratedSettings)
      ? migratedSettings
      : DEFAULT_COLOR_SETTINGS;
  } catch {
    return DEFAULT_COLOR_SETTINGS;
  }
}

function applyThemeClass(theme: TypeTheme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

const ThemeContext = createContext<TypeThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: TypeThemeProviderProps) => {
  const [theme, setTheme] = useState<TypeTheme>("light");
  const [colorSettings, setStoredColorSettings] =
    useState<TypeColorSettings>(DEFAULT_COLOR_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);
  const effectiveColors = useMemo(
    () => getThemeColors(theme, colorSettings),
    [theme, colorSettings],
  );
  const muiTheme = useMemo(
    () => createMuiTheme(theme, effectiveColors),
    [theme, effectiveColors],
  );
  const updateColorSettings = (settings: TypeColorSettings) => {
    const normalizedSettings = normalizeColorSettings(settings);
    if (hasAccessibleColorSettings(normalizedSettings)) {
      setStoredColorSettings(normalizedSettings);
    }
  };

  useIsomorphicLayoutEffect(() => {
    const initialTheme = readStoredTheme();
    const initialColorSettings = readStoredColorSettings();
    setTheme(initialTheme);
    setStoredColorSettings(initialColorSettings);
    applyThemeClass(initialTheme);
    applyThemeColors(getThemeColors(initialTheme, initialColorSettings));
    setIsInitialized(true);
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!isInitialized) return;

    applyThemeClass(theme);
    applyThemeColors(effectiveColors);
    try {
      window.localStorage.setItem(themeStorageKey, theme);
      window.localStorage.setItem(
        colorSettingsStorageKey,
        JSON.stringify(colorSettings),
      );
    } catch {
      // Keep the in-memory theme usable when storage is unavailable.
    }
  }, [colorSettings, effectiveColors, isInitialized, theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        colorSettings,
        setColorSettings: updateColorSettings,
      }}
    >
      <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
