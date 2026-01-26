import { Form } from "../Form";
import { Button } from "../Button";
import { Project } from "@prisma/client";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { AlertMessage } from "../AlertMessage";
import { useMainStore } from "@/store/mainStore";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { deleteProject } from "@/hooks/useProjects/useCase/deleteProject.api";
import { useProjectStore } from "@/store/projectStore";
import { useProjects, updateProject } from "@/hooks";
import { IconButton, Tooltip, Dialog } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import EditIcon from "@mui/icons-material/Edit";
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
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const queryClient = useQueryClient();

  // Mutation to delete project.
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => deleteProject(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS] });
      await queryClient.refetchQueries({ queryKey: [QUERY_KEYS.PROJECTS] });

      setProjectToDelete(null);
      setOpenDialog(false);
    },
  });

  // Mutation to update project.
  const updateMutation = useMutation({
    mutationFn: updateProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS] });
      await queryClient.refetchQueries({ queryKey: [QUERY_KEYS.PROJECTS] });

      setEditProject(null);
      setOpenEditDialog(false);
    },
  });

  // Edit form.
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<{ name: string }>({
    defaultValues: { name: "" },
  });

  // Handlers
  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setOpenDialog(true);
  };

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      deleteMutation.mutate(projectToDelete.id);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setProjectToDelete(null);
  };

  const handleEditClick = (project: Project) => {
    setEditProject(project);
    reset({ name: project.name });
    setOpenEditDialog(true);
  };

  const handleEditClose = () => {
    setOpenEditDialog(false);
    setEditProject(null);
  };

  const onEditSubmit = async (data: { name: string }) => {
    if (editProject) {
      await updateMutation.mutateAsync({ id: editProject.id, name: data.name });
    }
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
                    <Tooltip arrow title={`Edit Project: ${project.name}`}>
                      <IconButton onClick={() => handleEditClick(project)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Dialog open={openEditDialog} onClose={handleEditClose}>
                      <Form
                        title="Edit Project"
                        error={
                          updateMutation.isError
                            ? "Error updating project"
                            : undefined
                        }
                        onClose={handleEditClose}
                        onSubmit={handleSubmit(onEditSubmit)}
                        register={register}
                        placeholder="Project name"
                        submitLabel="Save"
                        isSubmitting={isSubmitting || updateMutation.isPending}
                      />
                    </Dialog>
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
