import type { TypeThemeColors } from "@/types";

interface HslColor {
  h: number;
  s: number;
  l: number;
}

let originalIconPromise: Promise<HTMLImageElement> | undefined;
let latestUpdate = 0;

function hexToRgb(hex: string) {
  if (!/^#[\da-f]{6}$/i.test(hex)) {
    throw new Error(`Invalid brand icon color: ${hex}`);
  }

  return {
    r: Number.parseInt(hex.slice(1, 3), 16) / 255,
    g: Number.parseInt(hex.slice(3, 5), 16) / 255,
    b: Number.parseInt(hex.slice(5, 7), 16) / 255,
  };
}

function rgbToHsl(r: number, g: number, b: number): HslColor {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = (h * 60 + 360) % 360;
  }

  return { h, s, l };
}

function hexToHsl(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

function hslToRgb({ h, s, l }: HslColor) {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const section = h / 60;
  const second = chroma * (1 - Math.abs((section % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;

  if (section < 1) [r, g, b] = [chroma, second, 0];
  else if (section < 2) [r, g, b] = [second, chroma, 0];
  else if (section < 3) [r, g, b] = [0, chroma, second];
  else if (section < 4) [r, g, b] = [0, second, chroma];
  else if (section < 5) [r, g, b] = [second, 0, chroma];
  else [r, g, b] = [chroma, 0, second];

  const match = l - chroma / 2;
  return [(r + match) * 255, (g + match) * 255, (b + match) * 255];
}

function interpolateHue(from: number, to: number, amount: number) {
  const difference = ((to - from + 540) % 360) - 180;
  return (from + difference * amount + 360) % 360;
}

export function recolorBrandIconPixels(
  pixels: Uint8ClampedArray,
  brand: string,
  accent: string,
) {
  const recolored = new Uint8ClampedArray(pixels);
  const brandColor = hexToHsl(brand);
  const accentColor = hexToHsl(accent);

  for (let index = 0; index < recolored.length; index += 4) {
    const alpha = recolored[index + 3];
    if (alpha === 0) continue;

    const original = rgbToHsl(
      recolored[index] / 255,
      recolored[index + 1] / 255,
      recolored[index + 2] / 255,
    );
    if (original.s < 0.12) continue;

    const brandWeight = Math.min(1, Math.max(0, (225 - original.h) / 45));
    const target = {
      h: interpolateHue(accentColor.h, brandColor.h, brandWeight),
      s: Math.min(
        1,
        Math.max(
          0,
          accentColor.s + (brandColor.s - accentColor.s) * brandWeight,
        ),
      ),
      l: Math.min(
        1,
        Math.max(
          0,
          accentColor.l +
            (brandColor.l - accentColor.l) * brandWeight +
            (original.l - (0.36 + 0.17 * brandWeight)),
        ),
      ),
    };
    const [r, g, b] = hslToRgb(target);
    recolored[index] = r;
    recolored[index + 1] = g;
    recolored[index + 2] = b;
  }

  return recolored;
}

function loadOriginalIcon() {
  if (!originalIconPromise) {
    originalIconPromise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => {
        originalIconPromise = undefined;
        reject(
          new Error("Could not load the original brand icon at /icon.png"),
        );
      };
      image.src = "/icon.png";
    });
  }
  return originalIconPromise;
}

export function updateBrandIconFavicon(colors: TypeThemeColors) {
  const updateId = ++latestUpdate;

  void loadOriginalIcon()
    .then((image) => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Could not create a canvas context for the brand icon");
      }

      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      imageData.data.set(
        recolorBrandIconPixels(imageData.data, colors.brand, colors.accent),
      );
      context.putImageData(imageData, 0, 0);

      if (updateId !== latestUpdate) return;

      const dataUrl = canvas.toDataURL("image/png");
      document.documentElement.style.setProperty(
        "--brand-icon-image",
        `url("${dataUrl}")`,
      );
      document
        .querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')
        .forEach((link) => {
          link.href = dataUrl;
        });
    })
    .catch((error: unknown) => {
      console.error("Failed to recolor the original brand icon.", error);
    });
}
