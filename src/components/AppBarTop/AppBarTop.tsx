"use client";

import { ThemeSwitch } from "../ThemeSwitch";
import { useTranslation } from "react-i18next";
import styles from "./AppBarTop.module.css";
import WorkspacesOutlinedIcon from "@mui/icons-material/WorkspacesOutlined";

export function AppBarTop() {
  const { t } = useTranslation();

  return (
    <header className={`${styles.header} app-header w-full transition-colors`}>
      <div className="app-header-inner mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="app-brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <WorkspacesOutlinedIcon fontSize="small" />
          </span>
          <div className="min-w-0">
            <p className="app-brand-kicker">Workspace</p>
            <h1 className="app-brand-title truncate">{t("app.title")}</h1>
          </div>
        </div>
        <ThemeSwitch />
      </div>
    </header>
  );
}
