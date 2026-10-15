import { getLocalProjects } from "@/lib/localDataRepository";
import type { TypeGetProjectResponse } from "@/types";

export async function getProjects() {
  return getLocalProjects() satisfies TypeGetProjectResponse;
}
