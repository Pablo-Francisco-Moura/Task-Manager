import { metadataTitle } from "../constants/app";
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: metadataTitle,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-lt-installed="true" suppressHydrationWarning>
      <head>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {`try {
            const savedTheme = localStorage.getItem("theme");
            document.documentElement.classList.add(savedTheme === "dark" ? "dark" : "light");
          } catch {
            document.documentElement.classList.add("light");
          }`}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
