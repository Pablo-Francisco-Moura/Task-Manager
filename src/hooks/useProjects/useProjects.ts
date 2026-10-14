import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { getProjects } from "./useCase/getProjects.api";

export function useProjects() {
  const {
    data: projects,
    isError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.PROJECTS],
    queryFn: getProjects,
  });

  return { projects, isError, isLoading, refetch };
}
