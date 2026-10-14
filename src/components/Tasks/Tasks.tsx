import { Task } from "../Task/Task";
import { Form } from "../Form";
import { Dialog } from "@mui/material";
import { useForm } from "react-hook-form";
import { TaskForm } from "@/components/TaskForm";
import { useState } from "react";
import { TaskBoard } from "./TaskBoard";
import { deleteTask } from "@/hooks/useTasks/useCase/deleteTask.api";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { updateTask } from "@/hooks/useTasks/useCase/updateTask.api";
import { reorderTasks } from "@/hooks/useTasks/useCase/reorderTasks.api";
import { AlertMessage } from "@/components/AlertMessage";
import { useMainStore } from "@/store/mainStore";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useTranslation } from "react-i18next";
import { useProjectStore } from "@/store/projectStore";
import { useFeedbackStore } from "@/store/feedbackStore";
import { useProjects, useTasks } from "@/hooks";
import { MAX_DESCRIPTION_LENGTH } from "@/constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Task as TypeTask, TaskStatus } from "@prisma/client";
import type { TypeReorderTasksInput } from "@/types";
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
      showFeedback(t("task.delete.success"));
    },
    onError: () => showFeedback(t("task.delete.error"), "error"),
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
      showFeedback(t("task.update.success"));
    },
  });

  const updateStatusMutation = useMutation({
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
      }
      showFeedback(t("task.status.updated"));
    },
    onError: () => showFeedback(t("task.update.error"), "error"),
  });

  const reorderTasksMutation = useMutation({
    mutationFn: reorderTasks,
    onMutate: async ({ projectId, orderedTaskIdsByStatus }) => {
      const queryKey = [QUERY_KEYS.TASKS, projectId] as const;
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData<TypeTask[]>(queryKey);

      if (previousTasks) {
        const positions = new Map<
          number,
          { status: TaskStatus; position: number }
        >();
        for (const status of ["todo", "in_progress", "done"] as const) {
          orderedTaskIdsByStatus[status].forEach((id, position) => {
            positions.set(id, { status, position });
          });
        }
        queryClient.setQueryData<TypeTask[]>(
          queryKey,
          previousTasks.map((task) => {
            const placement = positions.get(task.id);
            return placement ? { ...task, ...placement } : task;
          }),
        );
      }

      return { queryKey, previousTasks };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(context.queryKey, context.previousTasks);
      }
      showFeedback(t("task.reorder.error"), "error");
    },
    onSuccess: (orderedTasks, variables) => {
      queryClient.setQueryData(
        [QUERY_KEYS.TASKS, variables.projectId],
        orderedTasks,
      );
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TASKS, variables.projectId],
      });
    },
  });

  // Edit form.
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isValid, errors },
  } = useForm<{ name: string; description: string }>({
    mode: "onChange",
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

  const handleStatusChange = (task: TypeTask, status: TaskStatus) => {
    updateStatusMutation.mutate({ id: task.id, status });
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
        <AlertMessage type="loading" message={t("project.loading")} />
      </div>
    );
  }

  if (isProjectsError) {
    return (
      <div className="content-state">
        <AlertMessage
          type="error"
          message={t("project.loadError")}
          retryLabel={t("common.retry")}
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
        <h3>{t("project.empty")}</h3>
        <button
          type="button"
          className="text-action"
          onClick={() => setSelectedTab("project")}
        >
          {t("project.add")}
        </button>
      </div>
    );
  }

  if (projects && !selectedProject) {
    return (
      <div className="content-state" role="status">
        <AlertMessage message={t("project.select")} />
      </div>
    );
  }

  if (isTasksLoading) {
    return (
      <div className="content-state" role="status">
        <AlertMessage type="loading" message={t("task.loading")} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="content-state">
        <AlertMessage
          type="error"
          message={t("task.loadError")}
          retryLabel={t("common.retry")}
          onRetry={() => void refetchTasks()}
        />
      </div>
    );
  }

  return (
    <div className="task-workspace">
      <div className="task-heading">
        <div>
          <p className="screen-eyebrow">{t("navigation.tasks")}</p>
          <h2 className="screen-title task-title">{selectedProject?.name}</h2>
          <p className="task-count">
            <span className="task-count-value">{tasks?.length ?? 0}</span>
            {t(
              (tasks?.length ?? 0) === 1
                ? "task.count.singular"
                : "task.count.plural",
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
          <span>{t("task.create.submit")}</span>
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
        <>
          <div className="task-mobile-list">
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
                    onStatusChange={handleStatusChange}
                  />
                ))}
            </ul>
          </div>
          <TaskBoard
            tasks={tasks}
            isSaving={reorderTasksMutation.isPending}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            onReorder={(orderedTaskIdsByStatus) => {
              if (selectedProject) {
                reorderTasksMutation.mutate({
                  projectId: selectedProject.id,
                  orderedTaskIdsByStatus,
                } satisfies TypeReorderTasksInput);
              }
            }}
          />
        </>
      ) : (
        <div className="empty-state task-empty-state">
          <span className="empty-state-mark" aria-hidden="true">
            <ChecklistOutlinedIcon />
          </span>
          <h3>{t("task.empty")}</h3>
          <button
            type="button"
            className="text-action"
            onClick={() => toggleOpenAddTask(true)}
          >
            {t("task.create.submit")}
          </button>
        </div>
      )}

      <Dialog open={openEditDialog} onClose={handleEditClose}>
        <Form
          title={t("task.update.label")}
          error={updateMutation.isError ? t("task.update.error") : undefined}
          nameError={errors.name?.message}
          submitDisabled={!isValid}
          inputId={`task-edit-name-${editTask?.id ?? "pending"}`}
          onClose={handleEditClose}
          register={register}
          onSubmit={handleSubmit(onEditSubmit)}
          placeholder={t("task.name")}
          submitLabel={t("common.save")}
          descriptionField={{
            inputId: `task-edit-description-${editTask?.id ?? "pending"}`,
            label: t("task.description"),
            placeholder: t("task.enterDescription"),
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
        description={`${t("task.delete.confirm")} "${taskToDelete?.name}"? ${t("task.delete.irreversible")}`}
      />
    </div>
  );
}
