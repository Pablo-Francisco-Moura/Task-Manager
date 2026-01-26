import { ThemeSwitch } from "../ThemeSwitch";
import { useTranslation } from "react-i18next";

export function AppBarTop() {
  const { t } = useTranslation();

  return (
    <header className="w-full bg-blue-600 dark:bg-gray-800 shadow-md transition-colors">
      <div className="w-full py-3 px-4 flex items-center justify-between">
        <h1 className="text-white dark:text-gray-100 text-lg font-bold tracking-wide">
          {t("projectManagement")}
        </h1>
        <ThemeSwitch />
      </div>
    </header>
  );
}
