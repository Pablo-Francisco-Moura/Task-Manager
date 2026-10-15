import { createLocalTask } from "@/lib/localDataRepository";
import type { TypeCreateTaskInput, TypeCreateTaskResponse } from "@/types";

export async function createTask(
  data: TypeCreateTaskInput,
): Promise<TypeCreateTaskResponse> {
  return createLocalTask({
    ...data,
    dueAt: data.dueAt ? new Date(data.dueAt) : null,
    dueDate: data.dueDate ? new Date(`${data.dueDate}T00:00:00.000Z`) : null,
  });
}
