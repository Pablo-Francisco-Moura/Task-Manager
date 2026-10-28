import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import type { TypeLocale } from "@/types";
import pt from "../locale/pt.json";
import en from "../locale/en.json";
import ptActivity from "../locale/pt.activity.json";
import enActivity from "../locale/en.activity.json";
import ptWorkspace from "../locale/pt.workspace.json";
import enWorkspace from "../locale/en.workspace.json";

const resources = {
  pt: { translation: { ...pt, ...ptActivity, ...ptWorkspace } },
  en: { translation: { ...en, ...enActivity, ...enWorkspace } },
};

export function createI18nInstance(language: TypeLocale) {
  const instance = createInstance();
  void instance.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: "pt",
    initImmediate: false,
    interpolation: { escapeValue: false },
  });

  return instance;
}
