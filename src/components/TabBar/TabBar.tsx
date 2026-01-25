import { Button } from "../Button";
import { useMainStore } from "@/store/mainStore";

export function TabBar() {
  const selectedTab = useMainStore((s) => s.selectedTab);
  const setSelectedTab = useMainStore((s) => s.setSelectedTab);

  return (
    <div className="px-4 flex gap-4 w-full justify-between py-2 bg-white border-b border-gray-200">
      <Button
        label="Projeto"
        onClick={() => setSelectedTab("project")}
        selected={selectedTab === "project"}
      />
      <Button
        label="Task"
        onClick={() => setSelectedTab("task")}
        selected={selectedTab === "task"}
      />
    </div>
  );
}
