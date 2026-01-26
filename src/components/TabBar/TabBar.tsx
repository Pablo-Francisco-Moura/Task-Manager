import { TabButton } from "../TabButton";
import { useMainStore } from "@/store/mainStore";
import { useTranslation } from "react-i18next";

export function TabBar() {
  const selectedTab = useMainStore((s) => s.selectedTab);
  const setSelectedTab = useMainStore((s) => s.setSelectedTab);

  const { t } = useTranslation();

  return (
    <div className="px-4 flex gap-4 w-full justify-between py-2 bg-white border-b border-gray-200">
      <TabButton
        label={t("projects")}
        onClick={() => setSelectedTab("project")}
        selected={selectedTab === "project"}
      />
      <TabButton
        label={t("tasks")}
        onClick={() => setSelectedTab("task")}
        selected={selectedTab === "task"}
      />
    </div>
  );
}
