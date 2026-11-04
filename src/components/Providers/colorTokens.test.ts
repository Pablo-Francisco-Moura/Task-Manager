import { describe, expect, it } from "vitest";
import { DEFAULT_COLOR_SETTINGS } from "@/constants";
import { contrastRatio, getThemeColors } from "./colorTokens";

describe("workspace member colors", () => {
  it.each(["light", "dark"] as const)(
    "provides nine distinct accessible member colors in %s mode",
    (theme) => {
      const { workspaceMemberColors, background, surface, brandSoft } =
        getThemeColors(theme, DEFAULT_COLOR_SETTINGS);

      expect(workspaceMemberColors).toHaveLength(9);
      expect(new Set(workspaceMemberColors).size).toBe(9);
      for (const color of workspaceMemberColors) {
        expect(contrastRatio(color, background)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(color, surface)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(color, brandSoft)).toBeGreaterThanOrEqual(4.5);
      }
    },
  );
});
