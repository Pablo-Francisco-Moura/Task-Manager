import { describe, expect, it } from "vitest";
import { recolorBrandIconPixels } from "./brandIcon";

describe("recolorBrandIconPixels", () => {
  it("recolors the original artwork while preserving transparent and neutral pixels", () => {
    const pixels = new Uint8ClampedArray([
      32, 80, 144, 255,
      255, 255, 255, 255,
      0, 0, 0, 0,
    ]);

    const result = recolorBrandIconPixels(pixels, "#c02055", "#3540c0");

    expect(Array.from(result.slice(0, 4))).not.toEqual(
      Array.from(pixels.slice(0, 4)),
    );
    expect(Array.from(result.slice(4))).toEqual(Array.from(pixels.slice(4)));
  });

  it("uses the selected colors for each recoloring", () => {
    const pixels = new Uint8ClampedArray([32, 80, 144, 255]);

    const first = recolorBrandIconPixels(pixels, "#c02055", "#3540c0");
    const second = recolorBrandIconPixels(pixels, "#20a060", "#e0a020");

    expect(Array.from(first)).not.toEqual(Array.from(second));
  });
});
