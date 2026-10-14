import type { TypeLocale } from "@/types";

export function getLocaleFromAcceptLanguage(
  acceptLanguage: string | null,
): TypeLocale {
  const preferences = (acceptLanguage ?? "")
    .split(",")
    .map((preference, index) => {
      const [languageTag, ...parameters] = preference.trim().split(";");
      const qualityParameter = parameters.find((parameter) =>
        parameter.trim().startsWith("q="),
      );
      const quality = qualityParameter
        ? Number(qualityParameter.trim().slice(2))
        : 1;

      return {
        language: languageTag.split("-")[0].toLowerCase(),
        quality: Number.isFinite(quality) ? quality : 0,
        order: index,
      };
    })
    .filter((preference) => preference.quality > 0)
    .sort((left, right) => right.quality - left.quality || left.order - right.order);

  const preferredLanguage = preferences.find((preference) =>
    ["en", "pt"].includes(preference.language),
  );

  return preferredLanguage?.language === "en" ? "en" : "pt";
}
