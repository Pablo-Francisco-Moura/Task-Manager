import { ACCOUNT_SESSION_STORAGE_KEY } from "@/constants/session";
import type {
  TypeLocalTask,
  TypeLocalProject,
  TypeSerializedTask,
  TypeSerializedProject,
  TypeSerializedProjectWithTasks,
} from "@/types";

export const ACCOUNT_SESSION_EXPIRED_EVENT = "account-session-expired";

export class AccountWorkspaceRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "AccountWorkspaceRequestError";
  }
}

export function isAccountSessionExpired(error: unknown): boolean {
  return error instanceof AccountWorkspaceRequestError && error.status === 401;
}

export function hasStoredAccountSession(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const savedSession = window.localStorage.getItem(
      ACCOUNT_SESSION_STORAGE_KEY,
    );
    if (!savedSession) return false;

    const parsedSession = JSON.parse(savedSession) as {
      displayName?: unknown;
      workspaceName?: unknown;
    };
    return (
      typeof parsedSession.displayName === "string" ||
      typeof parsedSession.workspaceName === "string"
    );
  } catch {
    return false;
  }
}

export async function accountWorkspaceRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : "Account workspace request failed";
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event(ACCOUNT_SESSION_EXPIRED_EVENT));
    }
    throw new AccountWorkspaceRequestError(
      message,
      response.status,
      typeof payload?.code === "string" ? payload.code : undefined,
    );
  }

  return payload as T;
}

export async function getProjectActivityUnreadCount(
  projectId: number,
): Promise<number> {
  const result = await accountWorkspaceRequest<{ unreadCount: number }>(
    `/api/project/${projectId}/activity/unread-count`,
  );
  return result.unreadCount;
}

export function mapAccountTask(task: TypeSerializedTask): TypeLocalTask {
  return {
    ...task,
    dueDate: task.dueDate ? new Date(task.dueDate) : null,
    dueAt: task.dueAt ? new Date(task.dueAt) : null,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
  };
}

export function mapAccountProjectWithTasks(
  project: TypeSerializedProjectWithTasks,
) {
  return {
    ...project,
    createdAt: new Date(project.createdAt),
    updatedAt: new Date(project.updatedAt),
    tasks: project.tasks.map(mapAccountTask),
  };
}

export function mapAccountProject(
  project: TypeSerializedProject,
): TypeLocalProject {
  return {
    ...project,
    createdAt: new Date(project.createdAt),
    updatedAt: new Date(project.updatedAt),
  };
}
