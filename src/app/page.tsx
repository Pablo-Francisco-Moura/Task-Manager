"use client";

import { MainScreen } from "@/screens/Main";
import ClientI18nProvider from "./ClientI18nProvider";

export default function HomePage() {
  return (
    <ClientI18nProvider>
      <MainScreen />
    </ClientI18nProvider>
  );
}
