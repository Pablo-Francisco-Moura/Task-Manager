"use client";

import { Toolbar } from "@/components/Toolbar/Toolbar";
import { useProjects } from "@/hooks";
import { AppBarTop, ExampleListProjects, Spinner } from "@/components";

export function ProjectScreen() {
  const { projects } = useProjects();

  return (
    <div className="flex flex-col items-center mt-4">
      <AppBarTop />
      <Toolbar />
      {projects ? <ExampleListProjects projects={projects} /> : <Spinner />}
    </div>
  );
}
