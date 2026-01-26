import { Form } from "../Form";
import { Button } from "../Button";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useMainStore } from "@/store/mainStore";
import { updateProject } from "@/hooks";
import { useProjectStore } from "@/store/projectStore";
import { Project as TypeProject } from "@prisma/client";
import { IconButton, Tooltip, Dialog } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

interface Props {
  project: TypeProject;
  setOpenDialog: (open: boolean) => void;
  setProjectToDelete: (project: TypeProject | null) => void;
}

export function Project({ project, setOpenDialog, setProjectToDelete }: Props) {
  const setSelectedTab = useMainStore((s) => s.setSelectedTab);
  const setSelectedProject = useProjectStore((s) => s.setSelectedProject);

  const [editProject, setEditProject] = useState<TypeProject | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const queryClient = useQueryClient();

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
  const handleDeleteClick = (project: TypeProject) => {
    setProjectToDelete(project);
    setOpenDialog(true);
  };

  const handleEditClick = (project: TypeProject) => {
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
          error={updateMutation.isError ? "Error updating project" : undefined}
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
  );
}
