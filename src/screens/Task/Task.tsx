"use client";

import { Tasks } from "@/components/Tasks";
import { Toolbar } from "@/components/Toolbar/Toolbar";
import { useState } from "react";
import styles from "./TaskScreen.module.css";
import type {
  TypeLocalTaskPriority,
  TypeLocalTaskStatus,
} from "@/types/localData";

export function TaskScreen() {
  const [openAddTask, setOpenAddTask] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TypeLocalTaskStatus | "all">(
    "all",
  );
  const [priorityFilter, setPriorityFilter] = useState<
    TypeLocalTaskPriority | "all"
  >("all");

  return (
    <section className={`${styles.taskScreen} screen-content task-screen`}>
      <Toolbar
        openAddTask={openAddTask}
        search={search}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        onToggleAddTask={() => setOpenAddTask((isOpen) => !isOpen)}
        onOpenChat={() => setIsChatOpen(true)}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onPriorityFilterChange={setPriorityFilter}
      />
      <Tasks
        openAddTask={openAddTask}
        search={search}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        onCloseAddTask={() => setOpenAddTask(false)}
        isChatOpen={isChatOpen}
        onCloseChat={() => setIsChatOpen(false)}
        onOpenChat={() => setIsChatOpen(true)}
      />
    </section>
  );
}
