import type {
  TypeColorSettings,
  TypeTheme,
  TypeThemeColors,
} from "@/types";

export const REQUIRED_TEXT_CONTRAST = 4.5;
export const REQUIRED_UI_CONTRAST = 3;

export const COLOR_CONTRAST_SEARCH_STEPS = 1000;
export const COLOR_BRAND_SOFT_MIX_MAX = 0.12;
export const COLOR_BRAND_SOFT_MIX_STEP = 0.002;
export const COLOR_ACCENT_HOVER_STEPS = 160;
export const COLOR_ACCENT_HOVER_SCALE = 1000;

export const DEFAULT_COLOR_SETTINGS: TypeColorSettings = {
  brand: "#2d8f6b",
  accent: "#2d43b4",
};

export const BASE_THEME_COLORS: Record<
  TypeTheme,
  Pick<
    TypeThemeColors,
    "background" | "surface" | "foreground" | "muted" | "line" | "danger"
  >
> = {
  light: {
    background: "#f4f6f3",
    surface: "#ffffff",
    foreground: "#202925",
    muted: "#626d66",
    line: "#dce3dd",
    danger: "#b53d35",
  },
  dark: {
    background: "#171e1b",
    surface: "#202925",
    foreground: "#edf2ee",
    muted: "#a6b2aa",
    line: "#708176",
    danger: "#ff9388",
  },
};
