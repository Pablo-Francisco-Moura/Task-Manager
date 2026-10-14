import { TabButton } from "../TabButton";
import { useMainStore } from "@/store/mainStore";
import { useTranslation } from "react-i18next";
import styles from "./TabBar.module.css";

export function TabBar() {
  const selectedTab = useMainStore((s) => s.selectedTab);
  const setSelectedTab = useMainStore((s) => s.setSelectedTab);

  const { t } = useTranslation();

  return (
    <nav
      aria-label={t("navigation.mainLabel")}
      className={`${styles.navigation} app-nav mt-6 flex w-full items-center gap-2 border-b`}
    >
      <TabButton
        label={t("navigation.projects")}
        onClick={() => setSelectedTab("project")}
        selected={selectedTab === "project"}
      />
      <TabButton
        label={t("navigation.tasks")}
        onClick={() => setSelectedTab("task")}
        selected={selectedTab === "task"}
      />
    </nav>
  );
}
