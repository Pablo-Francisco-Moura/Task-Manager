"use client";

import { TaskScreen } from "../Task";
import { useMainStore } from "@/store/mainStore";
import { ProjectScreen } from "../Project";
import { AppBarTop, TabBar } from "@/components";

export function MainScreen() {
  const selectedTab = useMainStore((s) => s.selectedTab);

  return (
    <div className="app-shell flex min-h-screen w-full flex-col overflow-x-hidden transition-colors">
      <AppBarTop />

      <main className="app-main mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-12 sm:px-6 lg:px-8">
        <TabBar />
        {selectedTab === "project" ? <ProjectScreen /> : <TaskScreen />}
      </main>
    </div>
  );
}
