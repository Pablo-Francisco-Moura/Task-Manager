"use client";

import { Tasks } from "@/components/Tasks";
import { Toolbar } from "@/components/Toolbar/Toolbar";
import { useState } from "react";
import styles from "./TaskScreen.module.css";

export function TaskScreen() {
  const [openAddTask, setOpenAddTask] = useState(false);

  return (
    <section className={`${styles.taskScreen} screen-content task-screen`}>
      <Toolbar
        openAddTask={openAddTask}
        onToggleAddTask={() => setOpenAddTask((isOpen) => !isOpen)}
      />
      <Tasks
        openAddTask={openAddTask}
        onCloseAddTask={() => setOpenAddTask(false)}
      />
    </section>
  );
}
