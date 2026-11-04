"use client";

import { TabBar } from "@/components";
import { TaskScreen } from "../Task";
import { useMainStore } from "@/store/mainStore";
import { ProjectScreen } from "../Project";
import { MembersScreen } from "../Members";
import { useProjectStore } from "@/store/projectStore";
import styles from "./MainWorkspace.module.css";

export function MainWorkspace() {
  const selectedTab = useMainStore((state) => state.selectedTab);
  const activeWorkspaceId = useProjectStore((state) => state.activeWorkspaceId);

  return (
    <div className={styles.workspace}>
      <TabBar />
      <div className={styles.content}>
        {selectedTab === "task" ? (
          <TaskScreen />
        ) : selectedTab === "members" && activeWorkspaceId ? (
          <MembersScreen />
        ) : (
          <ProjectScreen />
        )}
      </div>
    </div>
  );
}
