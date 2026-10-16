import { Task } from "../Task/Task";
import {
  Stack,
  Dialog,
  Select,
  MenuItem,
  TextField,
  InputLabel,
  FormControl,
} from "@mui/material";
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
import type {
  TypeLocalTask,
  TypeLocalTaskPriority,
  TypeLocalTaskStatus,
} from "@/types/localData";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import { ProjectActivityDrawer } from "./ProjectActivityDrawer";

interface IProps {
  openAddTask: boolean;
  onCloseAddTask: () => void;
  isChatOpen: boolean;
  onCloseChat: () => void;
}

export function Tasks({
  openAddTask,
  onCloseAddTask,
  isChatOpen,
  onCloseChat,
}: IProps) {
  const setSelectedTab = useMainStore((s) => s.setSelectedTab);
  const selectedProject = useProjectStore((s) => s.selectedProject);
  const activeWorkspaceId = useProjectStore((s) => s.activeWorkspaceId);

  const [editTask, setEditTask] = useState<TypeLocalTask | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TypeLocalTask | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TypeLocalTaskStatus | "all">(
    "all",
  );
  const [priorityFilter, setPriorityFilter] = useState<
    TypeLocalTaskPriority | "all"
  >("all");
  const workspaceRole = useProjectStore((state) => state.workspaceRole);

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
  const allTasks = tasks ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredTasks = allTasks.filter(
    (task) =>
      (!normalizedSearch ||
        `${task.name} ${task.description ?? ""}`
          .toLowerCase()
          .includes(normalizedSearch)) &&
      (statusFilter === "all" || task.status === statusFilter) &&
      (priorityFilter === "all" || task.priority === priorityFilter),
  );
  const canReorder =
    !normalizedSearch && statusFilter === "all" && priorityFilter === "all";
  const canManageProjects =
    activeWorkspaceId === null || workspaceRole === "owner";

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
        <h3>
          {canManageProjects ? t("project.empty") : t("project.noneAvailable")}
        </h3>
        {canManageProjects ? (
          <button
            type="button"
            className="text-action"
            onClick={() => setSelectedTab("project")}
          >
            {t("project.add")}
          </button>
        ) : null}
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
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label={t("task.search")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ flex: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="task-status-filter-label">
            {t("task.filterStatus")}
          </InputLabel>
          <Select
            labelId="task-status-filter-label"
            label={t("task.filterStatus")}
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(
                event.target.value as TypeLocalTaskStatus | "all",
              );
            }}
          >
            <MenuItem value="all">{t("task.allStatuses")}</MenuItem>
            <MenuItem value="todo">{t("task.status.todo")}</MenuItem>
            <MenuItem value="in_progress">
              {t("task.status.inProgress")}
            </MenuItem>
            <MenuItem value="done">{t("task.status.done")}</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="task-priority-filter-label">
            {t("task.filterPriority")}
          </InputLabel>
          <Select
            labelId="task-priority-filter-label"
            label={t("task.filterPriority")}
            value={priorityFilter}
            onChange={(event) => {
              setPriorityFilter(
                event.target.value as TypeLocalTaskPriority | "all",
              );
            }}
          >
            <MenuItem value="all">{t("task.allPriorities")}</MenuItem>
            <MenuItem value="low">{t("task.priority.low")}</MenuItem>
            <MenuItem value="normal">{t("task.priority.normal")}</MenuItem>
            <MenuItem value="high">{t("task.priority.high")}</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <ProjectActivityDrawer
        open={isChatOpen}
        projectId={selectedProject?.id ?? null}
        onClose={onCloseChat}
      />
      <Dialog
        open={Boolean(selectedProject && openAddTask)}
        onClose={onCloseAddTask}
      >
        {selectedProject && (
          <TaskForm onClose={onCloseAddTask} projectId={selectedProject.id} />
        )}
      </Dialog>

      {allTasks.length > 0 && filteredTasks.length > 0 ? (
        <>
          <div className="task-mobile-list">
            <ul className="task-list">
              {[...filteredTasks]
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
            tasks={filteredTasks}
            isSaving={reorderTasksMutation.isPending || !canReorder}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            onReorder={(orderedTaskIdsByStatus) => {
              if (selectedProject && canReorder) {
                reorderTasksMutation.mutate({
                  projectId: selectedProject.id,
                  orderedTaskIdsByStatus,
                } satisfies TypeReorderTasksInput);
              }
            }}
          />
        </>
      ) : allTasks.length > 0 ? (
        <div className="empty-state">
          <h3>{t("task.noMatches")}</h3>
        </div>
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
