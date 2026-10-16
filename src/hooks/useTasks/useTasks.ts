import { useQuery } from "@tanstack/react-query";
import { getTasks } from "./useCase/getTasks.api";
import { QUERY_KEYS } from "@/constants";
import { useProjectStore } from "@/store/projectStore";

export function useTasks(projectId?: number) {
  const activeWorkspaceId = useProjectStore((state) => state.activeWorkspaceId);
  const {
    data: tasks,
    isError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.TASKS, projectId, activeWorkspaceId],
    queryFn: () => getTasks(projectId),
    enabled: !!projectId,
  });

  return { tasks, isError, isLoading, refetch };
}
