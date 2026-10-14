import { Task } from "../Task/Task";
import { Form } from "../Form";
import { Dialog } from "@mui/material";
import { useForm } from "react-hook-form";
import { TaskForm } from "@/components/TaskForm";
import { useState } from "react";
import { deleteTask } from "@/hooks/useTasks/useCase/deleteTask.api";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { updateTask } from "@/hooks/useTasks/useCase/updateTask.api";
import { AlertMessage } from "@/components/AlertMessage";
import { useMainStore } from "@/store/mainStore";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useTranslation } from "react-i18next";
import { useProjectStore } from "@/store/projectStore";
import { Task as TypeTask } from "@prisma/client";
import { useFeedbackStore } from "@/store/feedbackStore";
import { useProjects, useTasks } from "@/hooks";
import { MAX_DESCRIPTION_LENGTH } from "@/constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AddIcon from "@mui/icons-material/Add";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";

export function Tasks() {
  const setSelectedTab = useMainStore((s) => s.setSelectedTab);
  const selectedProject = useProjectStore((s) => s.selectedProject);

  const [editTask, setEditTask] = useState<TypeTask | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TypeTask | null>(null);
  const [openAddTask, toggleOpenAddTask] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showFeedback = useFeedbackStore((state) => state.showFeedback);

  // Mutation to delete task.
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => deleteTask(id),
    onSuccess: async () => {
      if (selectedProject?.id) {
        await queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.PROJECTS, selectedProject?.id],
        });
        await queryClient.refetchQueries({
          queryKey: [QUERY_KEYS.PROJECTS, selectedProject?.id],
        });

        await queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.TASKS, selectedProject.id],
        });
        await queryClient.refetchQueries({
          queryKey: [QUERY_KEYS.TASKS, selectedProject.id],
        });
      }
      setTaskToDelete(null);
      setOpenDialog(false);
      showFeedback(t("taskDeleted"));
    },
    onError: () => showFeedback(t("errorDeletingTask"), "error"),
  });

  // Mutation to edit task.
  const updateMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: async (updatedTask) => {
      if (selectedProject?.id) {
        queryClient.setQueryData<TypeTask[]>(
          [QUERY_KEYS.TASKS, selectedProject.id],
          (currentTasks) =>
            currentTasks?.map((task) =>
              task.id === updatedTask.id ? updatedTask : task,
            ),
        );
        await queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.TASKS, selectedProject.id],
        });
        await queryClient.refetchQueries({
          queryKey: [QUERY_KEYS.TASKS, selectedProject.id],
        });
      }

      setEditTask(null);
      setOpenEditDialog(false);
      showFeedback(t("taskUpdated"));
    },
  });

  // Edit form.
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<{ name: string; description: string }>({
    defaultValues: { name: "", description: "" },
  });

  // Handlers
  const handleDeleteClick = (task: TypeTask) => {
    setTaskToDelete(task);
    setOpenDialog(true);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      deleteMutation.mutate(taskToDelete.id);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setTaskToDelete(null);
  };

  const handleEditClick = (task: TypeTask) => {
    setEditTask(task);
    reset({ name: task.name, description: task.description ?? "" });
    setOpenEditDialog(true);
  };

  const handleEditClose = () => {
    setOpenEditDialog(false);
    setEditTask(null);
  };

  const onEditSubmit = async (data: { name: string; description: string }) => {
    if (editTask) {
      await updateMutation.mutateAsync({
        id: editTask.id,
        name: data.name,
        projectId: editTask.projectId,
        description: data.description,
      });
    }
  };

  const {
    projects,
    isError: isProjectsError,
    isLoading: isProjectsLoading,
    refetch: refetchProjects,
  } = useProjects();
  const {
    tasks,
    isError,
    isLoading: isTasksLoading,
    refetch: refetchTasks,
  } = useTasks(selectedProject?.id);

  if (isProjectsLoading && projects === undefined) {
    return (
      <div className="content-state" role="status">
        <AlertMessage type="loading" message={t("loadingProjects")} />
      </div>
    );
  }

  if (isProjectsError) {
    return (
      <div className="content-state">
        <AlertMessage
          type="error"
          message={t("errorLoadingProjects")}
          retryLabel={t("retry")}
          onRetry={() => void refetchProjects()}
        />
      </div>
    );
  }

  if (projects && projects.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-mark" aria-hidden="true">
          <FolderOpenOutlinedIcon />
        </span>
        <h3>{t("noProjectsFound")}</h3>
        <button
          type="button"
          className="text-action"
          onClick={() => setSelectedTab("project")}
        >
          {t("addProject")}
        </button>
      </div>
    );
  }

  if (projects && !selectedProject) {
    return (
      <div className="content-state" role="status">
        <AlertMessage message={t("selectProject")} />
      </div>
    );
  }

  if (isTasksLoading) {
    return (
      <div className="content-state" role="status">
        <AlertMessage type="loading" message={t("loadingTasks")} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="content-state">
        <AlertMessage
          type="error"
          message={t("errorLoadingTasks")}
          retryLabel={t("retry")}
          onRetry={() => void refetchTasks()}
        />
      </div>
    );
  }

  return (
    <div className="task-workspace">
      <div className="task-heading">
        <div>
          <p className="screen-eyebrow">{t("tasks")}</p>
          <h2 className="screen-title task-title">{selectedProject?.name}</h2>
          <p className="task-count">
            <span className="task-count-value">{tasks?.length ?? 0}</span>
            {t(
              (tasks?.length ?? 0) === 1
                ? "taskCountSingular"
                : "taskCountPlural",
            )}
          </p>
        </div>
        <button
          type="button"
          className="primary-action"
          onClick={() => toggleOpenAddTask(!openAddTask)}
          aria-expanded={openAddTask}
        >
          <AddIcon fontSize="small" />
          <span>{t("registerTask")}</span>
        </button>
      </div>

      {selectedProject && openAddTask && (
        <div className="form-surface task-form-surface">
          <TaskForm
            onClose={() => toggleOpenAddTask(false)}
            projectId={selectedProject.id}
          />
        </div>
      )}

      {tasks && tasks.length > 0 ? (
        <ul className="task-list">
          {[...tasks]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((task: TypeTask, index: number) => (
              <Task
                key={task.id}
                task={task}
                position={index + 1}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
              />
            ))}
        </ul>
      ) : (
        <div className="empty-state task-empty-state">
          <span className="empty-state-mark" aria-hidden="true">
            <ChecklistOutlinedIcon />
          </span>
          <h3>{t("noTasks")}</h3>
          <button
            type="button"
            className="text-action"
            onClick={() => toggleOpenAddTask(true)}
          >
            {t("registerTask")}
          </button>
        </div>
      )}

      <Dialog open={openEditDialog} onClose={handleEditClose}>
        <Form
          title={t("editTask")}
          error={updateMutation.isError ? t("errorUpdatingTask") : undefined}
          inputId={`task-edit-name-${editTask?.id ?? "pending"}`}
          onClose={handleEditClose}
          register={register}
          onSubmit={handleSubmit(onEditSubmit)}
          placeholder={t("taskName")}
          submitLabel={t("save")}
          descriptionField={{
            inputId: `task-edit-description-${editTask?.id ?? "pending"}`,
            label: t("taskDescription"),
            placeholder: t("enterTaskDescription"),
            maxLength: MAX_DESCRIPTION_LENGTH,
          }}
          isSubmitting={isSubmitting || updateMutation.isPending}
        />
      </Dialog>

      <ConfirmDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        description={`${t("confirmDeleteTask")} "${taskToDelete?.name}"? ${t("infoToDeleteTask")}`}
      />
    </div>
  );
}
