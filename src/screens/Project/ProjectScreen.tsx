"use client";

import { Button } from "@/components/Button/Button";
import { Project } from "@prisma/client";
import { useState } from "react";
import { SubTitle } from "@/components/SubTitle";
import { useProjects } from "@/hooks";
import { ProjectForm } from "@/components/ProjectForm/ProjectForm";
import { AlertMessage } from "@/components/AlertMessage/AlertMessage";
import { useMainStore } from "@/store/mainStore";
import { useProjectStore } from "@/store/projectStore";

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
      <SubTitle
        label="Projects"
        onClick={() => toggleOpenAddProject(!openAddProject)}
      />
      {openAddProject && (
        <ProjectForm toggleOpenAddProject={toggleOpenAddProject} />
      )}
      {isLoading && <AlertMessage message="Carregando projetos..." />}
      {isError && <AlertMessage message="Erro ao carregar projetos." />}
      <div className="flex flex-col gap-4 justify-center w-full px-4">
        {sortedProjects && sortedProjects.length > 0
          ? sortedProjects.map((project: Project) => (
              <Button
                key={project.id}
                label={project.name}
                onClick={() => {
                  setSelectedProject(project);
                  setSelectedTab("task");
                }}
              />
            ))
          : !isLoading && (
              <div className="flex gap-4 flex-col items-center justify-center w-full p-4">
                <AlertMessage message="Nenhum projeto encontrado!" />
                <Button
                  full={false}
                  label="Add Project"
                  onClick={() => toggleOpenAddProject(true)}
                  disabled={openAddProject}
                />
              </div>
            )}
      </div>
    </div>
  );
}
