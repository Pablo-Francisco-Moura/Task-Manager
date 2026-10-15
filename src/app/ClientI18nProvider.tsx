"use client";

import { I18nextProvider } from "react-i18next";
import { createI18nInstance } from "./i18n";
import { languageStorageKey } from "@/constants/app";
import React, { useEffect, useState } from "react";
import type { TypeLocale } from "@/types";

function readStoredLanguage(): TypeLocale {
  try {
    const savedLanguage = window.localStorage.getItem(languageStorageKey);
    if (savedLanguage === "pt" || savedLanguage === "en") {
      return savedLanguage;
    }
  } catch {
    // Fall back to the browser preference when storage is unavailable.
  }

  const preferredLanguage =
    typeof navigator !== "undefined" ? navigator.language : "pt-BR";
  return preferredLanguage.startsWith("en") ? "en" : "pt";
}

interface IProps {
  children: React.ReactNode;
  language: TypeLocale;
}

export default function ClientI18nProvider({ children, language }: IProps) {
  const [i18n] = useState(() => createI18nInstance(language));

  useEffect(() => {
    const nextLanguage = readStoredLanguage();

    try {
      window.localStorage.setItem(languageStorageKey, nextLanguage);
    } catch {
      // Keep the browser preference active when storage is unavailable.
    }

    void i18n.changeLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage === "pt" ? "pt-BR" : "en";
  }, [i18n]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
