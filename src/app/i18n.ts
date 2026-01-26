import { initReactI18next } from "react-i18next";
import pt from "../locale/pt.json";
import en from "../locale/en.json";
import i18n from "i18next";

const getBrowserLanguage = () => {
  if (typeof window === "undefined") return "pt";
  const lang = window.navigator.language.split("-")[0];
  return ["pt", "en"].includes(lang) ? lang : "pt";
};

const resources = {
  pt: { translation: pt },
  en: { translation: en },
};

i18n.use(initReactI18next).init({
  resources,
  lng: getBrowserLanguage(),
  fallbackLng: "pt",
  interpolation: { escapeValue: false },
});

export default i18n;
