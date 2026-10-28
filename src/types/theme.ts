import type { ReactNode } from "react";
import type { TypeColorSettings } from "./color";

export type TypeTheme = "light" | "dark";

export interface TypeThemeContextProps {
  theme: TypeTheme;
  colorSettings: TypeColorSettings;
  toggleTheme: () => void;
  setColorSettings: (settings: TypeColorSettings) => void;
}

export interface TypeThemeProviderProps {
  children: ReactNode;
}
