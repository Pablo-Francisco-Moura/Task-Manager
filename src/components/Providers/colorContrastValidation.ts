import {
  REQUIRED_TEXT_CONTRAST,
  REQUIRED_UI_CONTRAST,
} from "@/constants";
import { contrastRatio, getThemeColors } from "./colorTokens";
import type { TypeColorSettings, TypeTheme, TypeThemeColors } from "@/types";

function hasAccessibleThemeContrast(colors: TypeThemeColors) {
  const textBackgrounds = [
    colors.background,
    colors.surface,
    colors.brandSoft,
  ];

  return (
    textBackgrounds.every(
      (background) =>
        contrastRatio(colors.brandText, background) >= REQUIRED_TEXT_CONTRAST,
    ) &&
    contrastRatio(colors.brandContrast, colors.brand) >=
      REQUIRED_TEXT_CONTRAST &&
    contrastRatio(colors.brand, colors.background) >= REQUIRED_UI_CONTRAST &&
    contrastRatio(colors.brand, colors.surface) >= REQUIRED_UI_CONTRAST &&
    textBackgrounds.every(
      (background) =>
        contrastRatio(colors.accent, background) >= REQUIRED_TEXT_CONTRAST,
    ) &&
    contrastRatio(colors.accentContrast, colors.accent) >=
      REQUIRED_TEXT_CONTRAST &&
    contrastRatio(colors.accentContrast, colors.accentDark) >=
      REQUIRED_TEXT_CONTRAST
  );
}

export function hasAccessibleColorSettings(settings: TypeColorSettings) {
  const themes: TypeTheme[] = ["light", "dark"];
  return themes.every((theme) =>
    hasAccessibleThemeContrast(getThemeColors(theme, settings)),
  );
}
