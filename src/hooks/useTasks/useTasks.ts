import { useQuery } from "@tanstack/react-query";
import { getTasks } from "./useCase/getTasks.api";
import { QUERY_KEYS } from "@/constants";

export function useTasks(projectId?: number) {
  const {
    data: tasks,
    isError,
    isLoading,
  } = useQuery({
    queryKey: [QUERY_KEYS.TASKS, projectId],
    queryFn: () => getTasks(projectId),
    enabled: !!projectId,
  });

  return { tasks, isError, isLoading };
}
