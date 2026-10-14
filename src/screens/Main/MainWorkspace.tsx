"use client";

import { TabBar } from "@/components";
import { TaskScreen } from "../Task";
import { useMainStore } from "@/store/mainStore";
import { ProjectScreen } from "../Project";
import styles from "./MainWorkspace.module.css";

export function MainWorkspace() {
  const selectedTab = useMainStore((state) => state.selectedTab);

  return (
    <div className={styles.workspace}>
      <TabBar />
      {selectedTab === "project" ? <ProjectScreen /> : <TaskScreen />}
    </div>
  );
}
