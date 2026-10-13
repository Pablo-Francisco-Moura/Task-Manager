"use client";

import { I18nextProvider } from "react-i18next";
import React, { useEffect, useState } from "react";
import i18n from "./i18n";

interface IProps {
  children: React.ReactNode;
}

export default function ClientI18nProvider({ children }: IProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (i18n.isInitialized) setReady(true);
    else i18n.on("initialized", () => setReady(true));
  }, []);

  if (!ready) return null;

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
