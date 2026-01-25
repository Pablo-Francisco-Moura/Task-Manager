"use client";

import { Project } from "@prisma/client";
import { useProjects } from "@/hooks";
import { AlertMessage } from "@/components";
import { useMainStore } from "@/store/mainStore";
import { useProjectStore } from "@/store/projectStore";

export function ProjectScreen() {
  const setSelectedTab = useMainStore((s) => s.setSelectedTab);
  const setSelectedProject = useProjectStore((s) => s.setSelectedProject);

  const { projects, isLoading, isError } = useProjects();

  return (
    <div className="flex flex-col w-full items-center gap-4 bg-gray-50 pb-4">
      <h2 className="text-xl font-bolds text-black">Projetos</h2>
      {isLoading && <AlertMessage message="Carregando projetos..." />}
      {isError && <AlertMessage message="Erro ao carregar projetos." />}
      <div className="flex flex-col gap-4 justify-center w-full px-4">
        {projects && projects.length > 0
          ? projects.map((project: Project) => (
              <button
                key={project.id}
                className="w-full border-2 rounded px-6 py-2 text-base font-semibold transition-colors duration-150 border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100"
                onClick={() => {
                  setSelectedProject(project);
                  setSelectedTab("task");
                }}
              >
                {project.name}
              </button>
            ))
          : !isLoading && (
              <div className="text-gray-500">Nenhum projeto encontrado.</div>
            )}
      </div>
    </div>
  );
}
