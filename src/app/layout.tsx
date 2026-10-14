import { headers } from "next/headers";
import { metadataTitle } from "../constants/app";
import { getLocaleFromAcceptLanguage } from "@/utils";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: metadataTitle,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const locale = getLocaleFromAcceptLanguage(
    requestHeaders.get("accept-language"),
  );

  return (
    <html lang={locale === "pt" ? "pt-BR" : "en"} data-lt-installed="true">
      <body>{children}</body>
    </html>
  );
}
