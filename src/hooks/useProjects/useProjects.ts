import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { getProjects } from "./useCase/getProjects.api";
import { useProjectStore } from "@/store/projectStore";

export function useProjects() {
  const activeWorkspaceId = useProjectStore((state) => state.activeWorkspaceId);
  const {
    data: projects,
    isError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.PROJECTS, activeWorkspaceId],
    queryFn: getProjects,
  });

  return { projects, isError, isLoading, refetch };
}
