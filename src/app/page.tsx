import { headers } from "next/headers";
import { MainScreen } from "@/screens/Main";
import ClientI18nProvider from "./ClientI18nProvider";
import { Providers } from "@/components/Providers/Providers";
import { ThemeProvider } from "@/components/Providers/ThemeProvider";
import { getLocaleFromAcceptLanguage } from "@/utils";

export default async function HomePage() {
  const requestHeaders = await headers();
  const language = getLocaleFromAcceptLanguage(
    requestHeaders.get("accept-language"),
  );

  return (
    <ClientI18nProvider language={language}>
      <ThemeProvider>
        <Providers>
          <MainScreen />
        </Providers>
      </ThemeProvider>
    </ClientI18nProvider>
  );
}
