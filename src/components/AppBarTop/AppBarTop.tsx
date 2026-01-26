import { useTranslation } from "react-i18next";

export function AppBarTop() {
  const { t } = useTranslation();

  return (
    <header className="w-full bg-blue-600 shadow-md">
      <div className="container mx-auto py-3 ml-4 flex items-start">
        <h1 className="text-white text-lg font-bold tracking-wide">
          {t("projectManagement")}
        </h1>
      </div>
    </header>
  );
}
