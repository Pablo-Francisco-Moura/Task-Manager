"use client";

import { Project } from "@prisma/client";
import { useState } from "react";
import { useProjects } from "@/hooks";
import { ProjectForm } from "@/components/ProjectForm/ProjectForm";
import { AlertMessage } from "@/components";
import { useMainStore } from "@/store/mainStore";
import { useProjectStore } from "@/store/projectStore";
import AddIcon from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";

export function ProjectScreen() {
  const setSelectedTab = useMainStore((s) => s.setSelectedTab);
  const setSelectedProject = useProjectStore((s) => s.setSelectedProject);

  const [openAddProject, toggleOpenAddProject] = useState(false);

  const { projects, isLoading, isError } = useProjects();

  const sortedProjects = projects
    ?.slice()
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );

  return (
    <div className="flex flex-col w-full items-center gap-4 bg-gray-50 pb-4">
      <div className="flex items-center gap-2 px-4 pt-4">
        <h2 className="flex text-lg font-semibold mb-0.5 text-black">
          Projects
        </h2>
        <IconButton
          onClick={() => toggleOpenAddProject(!openAddProject)}
          className="mb-4"
        >
          <AddIcon />
        </IconButton>
      </div>
      {openAddProject && (
        <ProjectForm toggleOpenAddProject={toggleOpenAddProject} />
      )}
      {isLoading && <AlertMessage message="Carregando projetos..." />}
      {isError && <AlertMessage message="Erro ao carregar projetos." />}
      <div className="flex flex-col gap-4 justify-center w-full px-4">
        {sortedProjects && sortedProjects.length > 0
          ? sortedProjects.map((project: Project) => (
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
