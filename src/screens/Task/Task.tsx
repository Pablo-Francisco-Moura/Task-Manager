"use client";

import { Tasks } from "@/components/Tasks";
import { Toolbar } from "@/components/Toolbar/Toolbar";

export function TaskScreen() {
  return (
    <>
      <Toolbar />
      <div className="flex-1 flex w-full justify-center bg-gray-50 dark:bg-gray-700 transition-colors">
        <Tasks />
      </div>
    </>
  );
}
