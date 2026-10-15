import { Providers } from "@/components/Providers/Providers";
import { MainScreen } from "@/screens/Main";
import { ThemeProvider } from "@/components/Providers/ThemeProvider";
import ClientI18nProvider from "./ClientI18nProvider";

export default function HomePage() {
  return (
    <ClientI18nProvider language="pt">
      <ThemeProvider>
        <Providers>
          <MainScreen />
        </Providers>
      </ThemeProvider>
    </ClientI18nProvider>
  );
}
