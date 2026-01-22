import { useQuery } from "@tanstack/react-query";
import { getProjects } from "./useCase/getProjects.api";
import { QUERY_KEYS } from "@/constants";

export function useProjects() {
  const {
    data: projects,
    isError,
    isLoading,
  } = useQuery({
    queryKey: [QUERY_KEYS.PROJECTS],
    queryFn: getProjects,
  });

  return { projects, isError, isLoading };
}
