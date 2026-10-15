import { metadataTitle } from "../constants/app";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: metadataTitle,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-lt-installed="true">
      <body>{children}</body>
    </html>
  );
}
