import { Form } from "../Form";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useMainStore } from "@/store/mainStore";
import { updateProject } from "@/hooks";
import { useTranslation } from "react-i18next";
import { useProjectStore } from "@/store/projectStore";
import { useFeedbackStore } from "@/store/feedbackStore";
import { Project as TypeProject } from "@prisma/client";
import { IconButton, Tooltip, Dialog } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TypeProjectWithTasks } from "@/types";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";

interface IProps {
  project: TypeProjectWithTasks;
  setOpenDialog: (open: boolean) => void;
  setProjectToDelete: (project: TypeProjectWithTasks | null) => void;
}

export function Project({
  project,
  setOpenDialog,
  setProjectToDelete,
}: IProps) {
  const setSelectedTab = useMainStore((s) => s.setSelectedTab);
  const selectedProject = useProjectStore((s) => s.selectedProject);
  const setSelectedProject = useProjectStore((s) => s.setSelectedProject);

  const [editProject, setEditProject] = useState<TypeProject | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showFeedback = useFeedbackStore((state) => state.showFeedback);

  // Mutation to update project.
  const updateMutation = useMutation({
    mutationFn: updateProject,
    onSuccess: async (updatedProject) => {
      if (selectedProject?.id === updatedProject.id) {
        setSelectedProject(updatedProject);
      }

      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS] });
      await queryClient.refetchQueries({ queryKey: [QUERY_KEYS.PROJECTS] });

      setEditProject(null);
      setOpenEditDialog(false);
      showFeedback(t("projectUpdated"));
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
  const handleDeleteClick = (project: TypeProjectWithTasks) => {
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
    <article className="project-card">
      <button
        type="button"
        className="project-card-main"
        onClick={() => {
          setSelectedProject(project);
          setSelectedTab("task");
        }}
      >
        <span className="project-card-icon">
          <FolderOutlinedIcon />
        </span>
        <span className="project-card-copy">
          <span className="project-card-label">{t("projectSpace")}</span>
          <span className="project-card-name">{project.name}</span>
        </span>
        <ArrowForwardIcon className="project-card-arrow" fontSize="small" />
      </button>
      <div className="project-card-actions">
        <Tooltip arrow title={`${t("editProject")}: ${project.name}`}>
          <IconButton
            aria-label={`${t("editProject")}: ${project.name}`}
            onClick={() => handleEditClick(project)}
            size="small"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Dialog open={openEditDialog} onClose={handleEditClose}>
          <Form
            title={t("editProject")}
            error={
              updateMutation.isError ? t("errorUpdatingProject") : undefined
            }
            onClose={handleEditClose}
            onSubmit={handleSubmit(onEditSubmit)}
            register={register}
            placeholder={t("projectName")}
            submitLabel={t("save")}
            isSubmitting={isSubmitting || updateMutation.isPending}
          />
        </Dialog>
        <Tooltip arrow title={`${t("deleteProject")}: ${project.name}`}>
          <IconButton
            aria-label={`${t("deleteProject")}: ${project.name}`}
            onClick={() => handleDeleteClick(project)}
            size="small"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    </article>
  );
}
