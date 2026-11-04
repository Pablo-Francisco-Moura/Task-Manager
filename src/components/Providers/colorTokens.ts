import {
  BASE_THEME_COLORS,
  COLOR_ACCENT_HOVER_SCALE,
  COLOR_ACCENT_HOVER_STEPS,
  COLOR_BRAND_SOFT_MIX_MAX,
  COLOR_BRAND_SOFT_MIX_STEP,
  COLOR_CONTRAST_SEARCH_STEPS,
  DEFAULT_COLOR_SETTINGS,
  REQUIRED_TEXT_CONTRAST,
} from "@/constants";
import type { TypeColorSettings, TypeThemeColors, TypeTheme } from "@/types";

function normalizeHex(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[\da-f]{6}$/i.test(value)
    ? value.toLowerCase()
    : fallback;
}

export function normalizeColorSettings(value: unknown): TypeColorSettings {
  const settings =
    value && typeof value === "object"
      ? (value as Partial<TypeColorSettings>)
      : {};

  return {
    brand: normalizeHex(settings.brand, DEFAULT_COLOR_SETTINGS.brand),
    accent: normalizeHex(settings.accent, DEFAULT_COLOR_SETTINGS.accent),
  };
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex, "#000000").slice(1);
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function linearize(channel: number) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function contrastRatio(first: string, second: string) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function rgbToHsl(hex: string) {
  const { r: rawR, g: rawG, b: rawB } = hexToRgb(hex);
  const r = rawR / 255;
  const g = rawG / 255;
  const b = rawB / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / delta) % 6;
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      default:
        h = (r - g) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number) {
  const normalizedHue = ((h % 360) + 360) % 360;
  const lightness = Math.min(1, Math.max(0, l));
  const chroma = (1 - Math.abs(2 * lightness - 1)) * s;
  const hueSection = normalizedHue / 60;
  const secondary = chroma * (1 - Math.abs((hueSection % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;

  if (hueSection < 1) [r, g, b] = [chroma, secondary, 0];
  else if (hueSection < 2) [r, g, b] = [secondary, chroma, 0];
  else if (hueSection < 3) [r, g, b] = [0, chroma, secondary];
  else if (hueSection < 4) [r, g, b] = [0, secondary, chroma];
  else if (hueSection < 5) [r, g, b] = [secondary, 0, chroma];
  else [r, g, b] = [chroma, 0, secondary];

  const match = lightness - chroma / 2;
  return rgbToHex((r + match) * 255, (g + match) * 255, (b + match) * 255);
}

function minimumContrast(color: string, backgrounds: string[]) {
  return Math.min(
    ...backgrounds.map((background) => contrastRatio(color, background)),
  );
}

function ensureTextContrast(
  requestedColor: string,
  backgrounds: string[],
  theme: TypeTheme,
  minimum = REQUIRED_TEXT_CONTRAST,
) {
  const requested = normalizeHex(requestedColor, "#000000");
  if (minimumContrast(requested, backgrounds) >= minimum) return requested;

  const { h, s, l } = rgbToHsl(requested);
  const targetLightness = theme === "light" ? 0 : 1;
  for (let step = 1; step <= COLOR_CONTRAST_SEARCH_STEPS; step += 1) {
    const progress = step / COLOR_CONTRAST_SEARCH_STEPS;
    const candidate = hslToHex(h, s, l + (targetLightness - l) * progress);
    if (minimumContrast(candidate, backgrounds) >= minimum) return candidate;
  }

  return theme === "light" ? "#000000" : "#ffffff";
}

function mixColors(first: string, second: string, amount: number) {
  const a = hexToRgb(first);
  const b = hexToRgb(second);
  return rgbToHex(
    a.r + (b.r - a.r) * amount,
    a.g + (b.g - a.g) * amount,
    a.b + (b.b - a.b) * amount,
  );
}

function getAccessibleBrandSoft(brand: string, surface: string) {
  for (
    let amount = COLOR_BRAND_SOFT_MIX_MAX;
    amount >= 0;
    amount -= COLOR_BRAND_SOFT_MIX_STEP
  ) {
    const candidate = mixColors(surface, brand, amount);
    if (contrastRatio(brand, candidate) >= REQUIRED_TEXT_CONTRAST) {
      return candidate;
    }
  }
  return surface;
}

const WORKSPACE_MEMBER_BASE_COLORS = [
  "#b42318",
  "#b54708",
  "#7a5a00",
  "#3f6212",
  "#027a7a",
  "#175cd3",
  "#6941c6",
  "#a11574",
  "#475467",
];

function chooseContrastText(backgrounds: string[]) {
  const blackContrast = minimumContrast("#000000", backgrounds);
  const whiteContrast = minimumContrast("#ffffff", backgrounds);
  return blackContrast >= whiteContrast ? "#000000" : "#ffffff";
}

function getAccentHover(accent: string, theme: TypeTheme) {
  const { h, s, l } = rgbToHsl(accent);
  const direction = theme === "light" ? -1 : 1;
  let best = accent;

  for (let step = 1; step <= COLOR_ACCENT_HOVER_STEPS; step += 1) {
    const candidate = hslToHex(
      h,
      s,
      l + direction * (step / COLOR_ACCENT_HOVER_SCALE),
    );
    if (candidate === best) continue;
    const contrastText = chooseContrastText([accent, candidate]);
    if (
      contrastRatio(contrastText, accent) >= REQUIRED_TEXT_CONTRAST &&
      contrastRatio(contrastText, candidate) >= REQUIRED_TEXT_CONTRAST
    ) {
      best = candidate;
    } else {
      break;
    }
  }

  return best;
}

export function getThemeColors(
  theme: TypeTheme,
  settings: TypeColorSettings,
): TypeThemeColors {
  const base = BASE_THEME_COLORS[theme];
  const requestedBrand = normalizeHex(
    settings.brand,
    DEFAULT_COLOR_SETTINGS.brand,
  );
  const brand =
    theme === "light"
      ? requestedBrand
      : ensureTextContrast(
          requestedBrand,
          [base.background, base.surface],
          theme,
        );
  const brandText = ensureTextContrast(
    brand,
    [base.background, base.surface],
    theme,
  );
  const brandSoft = getAccessibleBrandSoft(brandText, base.surface);
  const workspaceMemberColors = WORKSPACE_MEMBER_BASE_COLORS.map((color) =>
    ensureTextContrast(
      color,
      [base.background, base.surface, brandSoft],
      theme,
    ),
  );
  const accent = ensureTextContrast(
    settings.accent,
    [base.background, base.surface, brandSoft],
    theme,
  );
  const accentDark = getAccentHover(accent, theme);

  return {
    ...base,
    brand,
    brandText,
    brandSoft,
    brandContrast: chooseContrastText([brand]),
    accent,
    accentDark,
    accentContrast: chooseContrastText([accent, accentDark]),
    workspaceMemberColors,
  };
}

export function applyThemeColors(colors: TypeThemeColors) {
  const root = document.documentElement;
  root.style.setProperty("--brand", colors.brand);
  root.style.setProperty("--brand-text", colors.brandText);
  root.style.setProperty("--brand-soft", colors.brandSoft);
  root.style.setProperty("--brand-contrast", colors.brandContrast);
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--accent-dark", colors.accentDark);
  root.style.setProperty("--accent-contrast", colors.accentContrast);
  colors.workspaceMemberColors.forEach((color, index) => {
    root.style.setProperty(`--workspace-member-color-${index + 1}`, color);
  });
}
