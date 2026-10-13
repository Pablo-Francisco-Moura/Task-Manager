"use client";

import { Tasks } from "@/components/Tasks";
import { Toolbar } from "@/components/Toolbar/Toolbar";

export function TaskScreen() {
  return (
    <section className="screen-content task-screen">
      <Toolbar />
      <Tasks />
    </section>
  );
}
