import { Task } from "@prisma/client";
import { AlertMessage } from "@/components/AlertMessage";
import { useProjectStore } from "@/store/projectStore";
import { useProjects, useTasks } from "@/hooks";
import React from "react";

export function Tasks() {
  const selectedProject = useProjectStore((s) => s.selectedProject);

  const { projects, isLoading: isProjectsLoading } = useProjects();
  const { tasks, isLoading, isError } = useTasks(selectedProject?.id);

  if (isProjectsLoading && projects === undefined) {
    return <AlertMessage message="Carregando projetos..." />;
  }

  if (projects && !selectedProject) {
    return <AlertMessage message="Selecione um projeto para ver as tarefas." />;
  }

  if (isLoading) {
    return <AlertMessage message="Carregando tarefas..." />;
  }

  if (isError) {
    return <AlertMessage type="error" message="Erro ao buscar tarefas." />;
  }

  if (!tasks || tasks.length === 0) {
    return <AlertMessage message="Nenhuma tarefa associada a este projeto." />;
  }

  return (
    <div
      className="w-full min-h-300 max-w-2xl bg-white shadow-md rounded-md p-4 mb-4 mx-2
     border border-grey-200 overflow-y-auto"
    >
      <h6 className="flex text-lg font-semibold mb-2 text-black">
        Tarefas do {selectedProject?.name}
      </h6>
      <ul className="list-none pl-0 ml-4 mt-6">
        {[...tasks]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((task: Task) => (
            <li key={task.id} className="text-gray-800 mb-1">
              {task.name}
            </li>
          ))}
      </ul>
    </div>
  );
}
