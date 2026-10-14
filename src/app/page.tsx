import { MainScreen } from "@/screens/Main";
import ClientI18nProvider from "./ClientI18nProvider";
import { Providers } from "@/components/Providers/Providers";
import { ThemeProvider } from "@/components/Providers/ThemeProvider";

export default function HomePage() {
  return (
    <ClientI18nProvider>
      <ThemeProvider>
        <Providers>
          <MainScreen />
        </Providers>
      </ThemeProvider>
    </ClientI18nProvider>
  );
}
