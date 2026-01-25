import { Button } from "../Button";
import { Project } from "@prisma/client";
import { useState } from "react";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useProjects } from "@/hooks";
import { AlertMessage } from "../AlertMessage";
import { useMainStore } from "@/store/mainStore";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { deleteProject } from "@/hooks/useProjects/useCase/deleteProject.api";
import { useProjectStore } from "@/store/projectStore";
import { IconButton, Tooltip } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import DeleteIcon from "@mui/icons-material/Delete";

interface Props {
  openAddProject: boolean;
  toggleOpenAddProject: (value: boolean) => void;
}

export function Projects({ openAddProject, toggleOpenAddProject }: Props) {
  const setSelectedTab = useMainStore((s) => s.setSelectedTab);
  const setSelectedProject = useProjectStore((s) => s.setSelectedProject);

  const { projects, isLoading, isError } = useProjects();

  const [openDialog, setOpenDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: number) => deleteProject(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS] });
      await queryClient.refetchQueries({ queryKey: [QUERY_KEYS.PROJECTS] });

      setProjectToDelete(null);
      setOpenDialog(false);
    },
  });

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setOpenDialog(true);
  };

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      mutation.mutate(projectToDelete.id);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setProjectToDelete(null);
  };

  return (
    <>
      {isLoading && <AlertMessage message="Carregando projetos..." />}
      {isError && <AlertMessage message="Erro ao carregar projetos." />}
      {projects && (
        <div
          className="w-full min-h-300 max-w-2xl bg-white shadow-md rounded-md p-4 mb-4 mx-2
     border border-grey-200 overflow-y-auto gap-4 flex flex-col items-center overflow-y-auto"
        >
          {projects.length > 0
            ? projects
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((project: Project) => (
                  <div
                    key={project.id}
                    className="w-full flex justify-between items-center gap-4"
                  >
                    <Button
                      key={project.id}
                      label={project.name}
                      onClick={() => {
                        setSelectedProject(project);
                        setSelectedTab("task");
                      }}
                    />
                    <Tooltip arrow title={`Delete Project: ${project.name}`}>
                      <IconButton onClick={() => handleDeleteClick(project)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </div>
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
      )}
      <ConfirmDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        description={`Tem certeza que deseja deletar o projeto "${projectToDelete?.name}"? Essa ação não pode ser desfeita.`}
      />
    </>
  );
}
