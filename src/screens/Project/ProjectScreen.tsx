"use client";

import { Tasks } from "@/components/Tasks";
import { Toolbar } from "@/components/Toolbar/Toolbar";

export function ProjectScreen() {
  return (
    <div className="flex flex-col min-h-screen w-full items-center gap-4 bg-gray-50">
      <Toolbar />
      <div className="flex-1 flex w-full justify-center">
        <Tasks />
      </div>
    </div>
  );
}
