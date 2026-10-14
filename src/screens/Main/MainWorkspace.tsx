"use client";

import { TabBar } from "@/components";
import { TaskScreen } from "../Task";
import { useMainStore } from "@/store/mainStore";
import { ProjectScreen } from "../Project";

export function MainWorkspace() {
  const selectedTab = useMainStore((state) => state.selectedTab);

  return (
    <>
      <TabBar />
      {selectedTab === "project" ? <ProjectScreen /> : <TaskScreen />}
    </>
  );
}
