"use client";

import { Tasks } from "@/components/Tasks";
import { Toolbar } from "@/components/Toolbar/Toolbar";

export function ProjectScreen() {
  return (
    <>
      <Toolbar />
      <div className="flex-1 flex w-full justify-center">
        <Tasks />
      </div>
    </>
  );
}
