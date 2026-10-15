"use client";

import { ThemeSwitch } from "../ThemeSwitch";
import { useTranslation } from "react-i18next";
import { Button, ButtonGroup } from "@mui/material";
import styles from "./AppBarTop.module.css";
import WorkspacesOutlinedIcon from "@mui/icons-material/WorkspacesOutlined";

export function AppBarTop() {
  const { t, i18n } = useTranslation();
  const language = i18n.language.startsWith("en") ? "en" : "pt";

  const selectLanguage = (nextLanguage: "pt" | "en") => {
    void i18n.changeLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage === "pt" ? "pt-BR" : "en";
    try {
      window.localStorage.setItem("language", nextLanguage);
    } catch {
      // The current selection still applies for this session.
    }
  };

  return (
    <header className={`${styles.header} app-header w-full transition-colors`}>
      <div className="app-header-inner mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="app-brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <WorkspacesOutlinedIcon fontSize="small" />
          </span>
          <h1 className="app-brand-title truncate">{t("app.title")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <ButtonGroup size="small" aria-label={t("app.language")}>
            <Button
              aria-pressed={language === "pt"}
              onClick={() => selectLanguage("pt")}
              variant={language === "pt" ? "contained" : "outlined"}
            >
              PT
            </Button>
            <Button
              aria-pressed={language === "en"}
              onClick={() => selectLanguage("en")}
              variant={language === "en" ? "contained" : "outlined"}
            >
              EN
            </Button>
          </ButtonGroup>
          <ThemeSwitch />
        </div>
      </div>
    </header>
  );
}
