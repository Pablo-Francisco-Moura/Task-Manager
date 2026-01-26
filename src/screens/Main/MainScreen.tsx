"use client";

import { TaskScreen } from "../Task";
import { useMainStore } from "@/store/mainStore";
import { ProjectScreen } from "../Project";
import { AppBarTop, TabBar } from "@/components";

export function MainScreen() {
  const selectedTab = useMainStore((s) => s.selectedTab);

  return (
    <div className="flex flex-col min-h-screen w-full items-center gap-4 bg-gray-50 dark:bg-gray-700 overflow-x-hidden transition-colors">
      <AppBarTop />
      <TabBar />

      {selectedTab === "project" ? <ProjectScreen /> : <TaskScreen />}
    </div>
  );
}
