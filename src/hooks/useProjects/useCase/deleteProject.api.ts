import { deleteLocalProject } from "@/lib/localDataRepository";

export async function deleteProject(id: number) {
  deleteLocalProject(id);
}
