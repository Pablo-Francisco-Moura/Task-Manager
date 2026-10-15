import { getLocalTasks } from "@/lib/localDataRepository";
import type { TypeGetTaskResponse } from "@/types";

export async function getTasks(projectId?: number) {
  if (!projectId) return [];
  return getLocalTasks(projectId) satisfies TypeGetTaskResponse;
}
