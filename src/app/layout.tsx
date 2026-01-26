import type { Metadata } from "next";
import { Providers } from "@/components/Providers/Providers";
import { metadataTitle } from "../constants/app";
import "./globals.css";

export const metadata: Metadata = {
  title: metadataTitle,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-lt-installed="true">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
