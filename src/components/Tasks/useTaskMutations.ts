import { QUERY_KEYS } from "@/constants/queryKeys";
import { deleteTask } from "@/hooks/useTasks/useCase/deleteTask.api";
import { updateTask } from "@/hooks/useTasks/useCase/updateTask.api";
import { reorderTasks } from "@/hooks/useTasks/useCase/reorderTasks.api";
import { useTranslation } from "react-i18next";
import { useFeedbackStore } from "@/store/feedbackStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TypeLocalTask, TypeLocalTaskStatus } from "@/types/localData";

interface IProps {
  projectId: number | undefined;
  activeWorkspaceId: string | null;
  onDeleteSuccess: () => void;
  onUpdateSuccess: () => void;
}

export function useTaskMutations({
  projectId,
  activeWorkspaceId,
  onDeleteSuccess,
  onUpdateSuccess,
}: IProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showFeedback = useFeedbackStore((state) => state.showFeedback);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => deleteTask(id),
    onSuccess: async () => {
      if (projectId) {
        await queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.PROJECTS, projectId],
        });
        await queryClient.refetchQueries({
          queryKey: [QUERY_KEYS.PROJECTS, projectId],
        });
        await queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.TASKS, projectId],
        });
        await queryClient.refetchQueries({
          queryKey: [QUERY_KEYS.TASKS, projectId],
        });
      }
      onDeleteSuccess();
      showFeedback(t("task.delete.success"));
    },
    onError: () => showFeedback(t("task.delete.error"), "error"),
  });

  const updateMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: async (updatedTask) => {
      if (projectId) {
        queryClient.setQueryData<TypeLocalTask[]>(
          [QUERY_KEYS.TASKS, projectId, activeWorkspaceId],
          (currentTasks) =>
            currentTasks?.map((task) =>
              task.id === updatedTask.id ? updatedTask : task,
            ),
        );
        await queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.TASKS, projectId],
        });
        await queryClient.refetchQueries({
          queryKey: [QUERY_KEYS.TASKS, projectId],
        });
      }
      onUpdateSuccess();
      showFeedback(t("task.update.success"));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: async (updatedTask) => {
      if (projectId) {
        queryClient.setQueryData<TypeLocalTask[]>(
          [QUERY_KEYS.TASKS, projectId, activeWorkspaceId],
          (currentTasks) =>
            currentTasks?.map((task) =>
              task.id === updatedTask.id ? updatedTask : task,
            ),
        );
        await queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.TASKS, projectId],
        });
      }
      showFeedback(t("task.status.updated"));
    },
    onError: () => showFeedback(t("task.update.error"), "error"),
  });

  const reorderTasksMutation = useMutation({
    mutationFn: reorderTasks,
    onMutate: async ({
      projectId: reorderProjectId,
      orderedTaskIdsByStatus,
    }) => {
      const queryKey = [
        QUERY_KEYS.TASKS,
        reorderProjectId,
        activeWorkspaceId,
      ] as const;
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData<TypeLocalTask[]>(queryKey);

      if (previousTasks) {
        const positions = new Map<
          number,
          { status: TypeLocalTaskStatus; position: number }
        >();
        for (const status of ["todo", "in_progress", "done"] as const) {
          orderedTaskIdsByStatus[status].forEach((id, position) => {
            positions.set(id, { status, position });
          });
        }
        queryClient.setQueryData<TypeLocalTask[]>(
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
        [QUERY_KEYS.TASKS, variables.projectId, activeWorkspaceId],
        orderedTasks,
      );
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TASKS, variables.projectId],
      });
    },
  });

  return {
    deleteMutation,
    updateMutation,
    updateStatusMutation,
    reorderTasksMutation,
  };
}
