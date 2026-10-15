import { createLocalProject } from "@/lib/localDataRepository";
import type {
  TypeCreateProjectInput,
  TypeCreateProjectResponse,
} from "@/types";

export async function createProject(
  data: TypeCreateProjectInput,
): Promise<TypeCreateProjectResponse> {
  return createLocalProject(data);
}
