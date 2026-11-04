import { Task } from "../Task/Task";
import { Dialog } from "@mui/material";
import { TaskForm } from "@/components/TaskForm";
import { TaskBoard } from "./TaskBoard";
import { TaskFilters } from "./TaskFilters";
import { filterTasks } from "./filterTasks";
import { AlertMessage } from "@/components/AlertMessage";
import { useMainStore } from "@/store/mainStore";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useTranslation } from "react-i18next";
import { TaskEmptyState } from "./TaskEmptyState";
import { useProjectStore } from "@/store/projectStore";
import { useTaskMutations } from "./useTaskMutations";
import { ProjectEmptyState } from "./ProjectEmptyState";
import { useEffect, useState } from "react";
import { toTaskDueAtISOString } from "@/utils/taskDueDate";
import { useProjects, useTasks } from "@/hooks";
import { ProjectActivityDrawer } from "./ProjectActivityDrawer";
import { TaskEditDialog, type TypeTaskEditFormValues } from "./TaskEditDialog";
import type {
  TypeLocalTask,
  TypeLocalTaskStatus,
  TypeLocalTaskPriority,
} from "@/types/localData";
import type { TypeReorderTasksInput } from "@/types";

interface IProps {
  isChatOpen: boolean;
  openAddTask: boolean;
  onOpenChat: () => void;
  onCloseChat: () => void;
  onCloseAddTask: () => void;
}

export function Tasks({
  isChatOpen,
  openAddTask,
  onOpenChat,
  onCloseChat,
  onCloseAddTask,
}: IProps) {
  const setSelectedTab = useMainStore((s) => s.setSelectedTab);
  const selectedProject = useProjectStore((s) => s.selectedProject);
  const requestedActivityProjectId = useProjectStore(
    (s) => s.requestedActivityProjectId,
  );
  const setSelectedProject = useProjectStore((s) => s.setSelectedProject);
  const clearRequestedActivityProject = useProjectStore(
    (s) => s.clearRequestedActivityProject,
  );
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
  useEffect(() => {
    if (requestedActivityProjectId === null) return;
    if (projects === undefined) {
      if (isProjectsError) clearRequestedActivityProject();
      return;
    }

    const project = projects.find(
      ({ id }) => id === requestedActivityProjectId,
    );
    if (project) {
      setSelectedProject(project);
      onOpenChat();
    }
    clearRequestedActivityProject();
  }, [
    clearRequestedActivityProject,
    isProjectsError,
    onOpenChat,
    projects,
    requestedActivityProjectId,
    setSelectedProject,
  ]);
  const allTasks = tasks ?? [];
  const filteredTasks = filterTasks(
    allTasks,
    search,
    statusFilter,
    priorityFilter,
  );
  const canReorder =
    !search.trim() && statusFilter === "all" && priorityFilter === "all";
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
      <ProjectEmptyState
        canManageProjects={canManageProjects}
        onAddProject={() => setSelectedTab("project")}
      />
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
      <TaskFilters
        search={search}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onPriorityFilterChange={setPriorityFilter}
      />
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
            onReorder={(orderedTaskIdsByStatus, movedTaskId) => {
              if (selectedProject && canReorder) {
                reorderTasksMutation.mutate({
                  projectId: selectedProject.id,
                  orderedTaskIdsByStatus,
                  movedTaskId,
                } satisfies TypeReorderTasksInput);
              }
            }}
          />
        </>
      ) : (
        <TaskEmptyState hasTasks={allTasks.length > 0} />
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
