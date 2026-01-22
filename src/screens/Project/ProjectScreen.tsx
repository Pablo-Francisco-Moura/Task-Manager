"use client";

import { ExampleListProjects, Spinner } from "@/components";
import { useProjects } from "@/hooks";

export function ProjectScreen() {
  const { projects } = useProjects();
  return (
    <div className="flex flex-col items-center mt-4">
      <h1 className="text-3xl">Desafio Técnico</h1>
      {projects ? <ExampleListProjects projects={projects} /> : <Spinner />}
    </div>
  );
}
