import { Project } from "../Project/Project";
import { useState } from "react";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useProjects } from "@/hooks";
import { AlertMessage } from "../AlertMessage";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { deleteProject } from "@/hooks/useProjects/useCase/deleteProject.api";
import { useTranslation } from "react-i18next";
import { useFeedbackStore } from "@/store/feedbackStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TypeProjectWithTasks } from "@/types";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";

interface IProps {
  openAddProject: boolean;
  toggleOpenAddProject: (value: boolean) => void;
}

export function Projects({ openAddProject, toggleOpenAddProject }: IProps) {
  const { t } = useTranslation();
  const { projects, isLoading, isError, refetch } = useProjects();

  const [openDialog, setOpenDialog] = useState(false);

  const [projectToDelete, setProjectToDelete] =
    useState<TypeProjectWithTasks | null>(null);

  const queryClient = useQueryClient();
  const showFeedback = useFeedbackStore((state) => state.showFeedback);

  // Mutation to delete project.
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => deleteProject(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS] });
      await queryClient.refetchQueries({ queryKey: [QUERY_KEYS.PROJECTS] });

      setProjectToDelete(null);
      setOpenDialog(false);
      showFeedback(t("project.delete.success"));
    },
    onError: () => showFeedback(t("project.delete.error"), "error"),
  });

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      deleteMutation.mutate(projectToDelete.id);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setProjectToDelete(null);
  };

  return (
    <>
      {isLoading && (
        <div className="content-state" role="status">
          <AlertMessage type="loading" message={t("project.loading")} />
        </div>
      )}
      {isError && (
        <div className="content-state" role="alert">
          <AlertMessage
            type="error"
            message={t("project.loadError")}
            retryLabel={t("common.retry")}
            onRetry={() => void refetch()}
          />
        </div>
      )}
      {projects && projects.length > 0 && (
        <div className="projects-grid">
          {[...projects]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((project: TypeProjectWithTasks) => (
              <Project
                key={project.id}
                project={project}
                setOpenDialog={setOpenDialog}
                setProjectToDelete={setProjectToDelete}
              />
            ))}
        </div>
      )}
      {projects && projects.length === 0 && !isLoading && (
        <div className="empty-state">
          <span className="empty-state-mark" aria-hidden="true">
            <FolderOpenOutlinedIcon />
          </span>
          <h3>{t("project.empty")}</h3>
          <button
            type="button"
            className="text-action"
            onClick={() => toggleOpenAddProject(true)}
            disabled={openAddProject}
          >
            {t("project.add")}
          </button>
        </div>
      )}
      <ConfirmDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        relatedItems={projectToDelete?.tasks.map((task) => task.name)}
        relatedItemsLabel={t("project.tasksDeletedWithProject")}
        description={`${t("project.delete.confirm")} "${projectToDelete?.name}"? ${t("project.delete.irreversible")}`}
      />
    </>
  );
}
