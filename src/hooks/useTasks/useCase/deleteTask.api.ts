import { deleteLocalTask } from "@/lib/localDataRepository";

export async function deleteTask(id: number) {
  deleteLocalTask(id);
}
