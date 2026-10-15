import { updateLocalProject } from "@/lib/localDataRepository";
import type {
  TypeUpdateProjectInput,
  TypeUpdateProjectResponse,
} from "@/types";

export async function updateProject({
  id,
  name,
  description,
}: TypeUpdateProjectInput): Promise<TypeUpdateProjectResponse> {
  return updateLocalProject(id, { name, description });
}
