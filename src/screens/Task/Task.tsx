"use client";

import { Tasks } from "@/components/Tasks";
import { Toolbar } from "@/components/Toolbar/Toolbar";
import styles from "./TaskScreen.module.css";

export function TaskScreen() {
  return (
    <section className={`${styles.taskScreen} screen-content task-screen`}>
      <Toolbar />
      <Tasks />
    </section>
  );
}
