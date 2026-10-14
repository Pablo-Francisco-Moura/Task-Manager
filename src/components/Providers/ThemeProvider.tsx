"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface IThemeContextProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

interface IThemeProviderProps {
  children: React.ReactNode;
}

const ThemeContext = createContext<IThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: IThemeProviderProps) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (
      (savedTheme === "light" || savedTheme === "dark") &&
      savedTheme !== theme
    ) {
      setTheme(savedTheme);
      return;
    }

    document.documentElement.classList.remove(
      theme === "light" ? "dark" : "light",
    );
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
