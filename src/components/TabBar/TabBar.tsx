import { TabButton } from "../TabButton";
import { useMainStore } from "@/store/mainStore";

export function TabBar() {
  const selectedTab = useMainStore((s) => s.selectedTab);
  const setSelectedTab = useMainStore((s) => s.setSelectedTab);

  return (
    <div className="px-4 flex gap-4 w-full justify-between py-2 bg-white border-b border-gray-200">
      <TabButton
        label="Projects"
        onClick={() => setSelectedTab("project")}
        selected={selectedTab === "project"}
      />
      <TabButton
        label="Tasks"
        onClick={() => setSelectedTab("task")}
        selected={selectedTab === "task"}
      />
    </div>
  );
}
