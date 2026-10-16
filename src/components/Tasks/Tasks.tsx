import { Task } from "../Task/Task";
import { Button, Dialog } from "@mui/material";
import { TaskForm } from "@/components/TaskForm";
import { useState } from "react";
import { TaskBoard } from "./TaskBoard";
import { AlertMessage } from "@/components/AlertMessage";
import { useMainStore } from "@/store/mainStore";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useTranslation } from "react-i18next";
import { useProjectStore } from "@/store/projectStore";
import { useTaskMutations } from "./useTaskMutations";
import { toTaskDueAtISOString } from "@/utils/taskDueDate";
import { useProjects, useTasks } from "@/hooks";
import { TaskEditDialog, type TypeTaskEditFormValues } from "./TaskEditDialog";
import type { TypeReorderTasksInput } from "@/types";
import type { TypeLocalTask, TypeLocalTaskStatus } from "@/types/localData";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import { ProjectActivityDrawer } from "./ProjectActivityDrawer";

interface IProps {
  openAddTask: boolean;
  onCloseAddTask: () => void;
}

export function Tasks({ openAddTask, onCloseAddTask }: IProps) {
  const setSelectedTab = useMainStore((s) => s.setSelectedTab);
  const selectedProject = useProjectStore((s) => s.selectedProject);
  const activeWorkspaceId = useProjectStore((s) => s.activeWorkspaceId);

  const [editTask, setEditTask] = useState<TypeLocalTask | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TypeLocalTask | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  const { t } = useTranslation();
  const {
    deleteMutation,
    updateMutation,
    updateStatusMutation,
    reorderTasksMutation,
  } = useTaskMutations({
    projectId: selectedProject?.id,
    activeWorkspaceId,
    onDeleteSuccess: () => {
      setTaskToDelete(null);
      setOpenDialog(false);
    },
    onUpdateSuccess: () => {
      setEditTask(null);
      setOpenEditDialog(false);
    },
  });

  // Handlers
  const handleDeleteClick = (task: TypeLocalTask) => {
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

  const handleEditClick = (task: TypeLocalTask) => {
    setEditTask(task);
    setOpenEditDialog(true);
  };

  const handleEditClose = () => {
    setOpenEditDialog(false);
    setEditTask(null);
  };

  const onEditSubmit = async (data: TypeTaskEditFormValues) => {
    if (editTask) {
      const dueAt = toTaskDueAtISOString(data.dueDate, data.dueTime);
      await updateMutation.mutateAsync({
        id: editTask.id,
        name: data.name,
        status: data.status,
        dueDate: dueAt ? null : data.dueDate || null,
        dueAt,
        priority: data.priority,
        projectId: editTask.projectId,
        description: data.description,
      });
    }
  };

  const handleStatusChange = (
    task: TypeLocalTask,
    status: TypeLocalTaskStatus,
  ) => {
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
      <div className="flex justify-end pb-3">
        <Button
          size="small"
          variant="outlined"
          startIcon={<HistoryOutlinedIcon />}
          onClick={() => setIsActivityOpen(true)}
        >
          {t("activity.title")}
        </Button>
      </div>
      <ProjectActivityDrawer
        open={isActivityOpen}
        projectId={selectedProject?.id ?? null}
        onClose={() => setIsActivityOpen(false)}
      />
      <Dialog
        open={Boolean(selectedProject && openAddTask)}
        onClose={onCloseAddTask}
      >
        {selectedProject && (
          <TaskForm onClose={onCloseAddTask} projectId={selectedProject.id} />
        )}
      </Dialog>

      {tasks && tasks.length > 0 ? (
        <>
          <div className="task-mobile-list">
            <ul className="task-list">
              {[...tasks]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((task: TypeLocalTask, index: number) => (
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
        </div>
      )}

      <TaskEditDialog
        task={editTask}
        open={openEditDialog}
        isSubmitting={updateMutation.isPending}
        hasError={updateMutation.isError}
        onClose={handleEditClose}
        onSubmit={onEditSubmit}
      />

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
