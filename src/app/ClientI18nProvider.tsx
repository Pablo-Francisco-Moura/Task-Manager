"use client";

import { I18nextProvider } from "react-i18next";
import { createI18nInstance } from "./i18n";
import React, { useState } from "react";
import type { TypeLocale } from "@/types";

interface IProps {
  children: React.ReactNode;
  language: TypeLocale;
}

export default function ClientI18nProvider({ children, language }: IProps) {
  const [i18n] = useState(() => createI18nInstance(language));

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
