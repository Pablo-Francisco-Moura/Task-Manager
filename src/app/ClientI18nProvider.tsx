"use client";

import { I18nextProvider } from "react-i18next";
import { createI18nInstance } from "./i18n";
import React, { useEffect, useState } from "react";
import type { TypeLocale } from "@/types";

interface IProps {
  children: React.ReactNode;
  language: TypeLocale;
}

export default function ClientI18nProvider({ children, language }: IProps) {
  const [i18n] = useState(() => createI18nInstance(language));

  useEffect(() => {
    try {
      const savedLanguage = window.localStorage.getItem("language");
      if (savedLanguage === "pt" || savedLanguage === "en") {
        void i18n.changeLanguage(savedLanguage);
        document.documentElement.lang = savedLanguage === "pt" ? "pt-BR" : "en";
      }
    } catch {
      // Keep the default locale when browser storage is unavailable.
    }
  }, [i18n]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
