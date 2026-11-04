import type { TypeLocalTaskStatus } from "./localData";
import type { TypeWorkspaceMemberColorIndex } from "./workspaceMembers";

export type TypeProjectActivity = {
  id: number;
  task: TypeProjectActivityTask | null;
  isOwn: boolean;
  actorId: string;
  content: string | null;
  details: Record<string, unknown> | null;
  canEdit: boolean;
  taskName: string | null;
  projectId: number;
  actorName: string;
  isDeleted: boolean;
  canDelete: boolean;
  createdAt: string;
  actorUsername: string | null;
  actorColorIndex: TypeWorkspaceMemberColorIndex | null;
  type:
    | "comment"
    | "comment_deleted"
    | "task_moved"
    | "member_added"
    | "task_created"
    | "task_updated"
    | "task_deleted"
    | "member_removed"
    | "project_created"
    | "project_updated";
};

export type TypeProjectActivityNotification = {
  id: number;
  projectId: number;
  projectName: string;
  actorId: string;
  actorColorIndex: TypeWorkspaceMemberColorIndex | null;
  actorName: string;
  actorUsername: string | null;
  type: TypeProjectActivity["type"];
  content: string | null;
  taskName: string | null;
  details: Record<string, unknown> | null;
  isDeleted: boolean;
  createdAt: string;
};

export type TypeProjectActivityTask = {
  id: number;
  name: string;
  dueAt: string | null;
  status: TypeLocalTaskStatus;
  dueDate: string | null;
  priority: "low" | "normal" | "high";
  position: number;
  projectId: number;
  createdAt: string;
  updatedAt: string;
  description: string | null;
};

export type TypeTaskMovementDetails = {
  toStatus: TypeLocalTaskStatus | null;
  fromStatus: TypeLocalTaskStatus | null;
  toPosition: number | null;
  fromPosition: number | null;
};

export type TypeProjectActivityDetail = {
  to: string;
  from: string;
  field: string;
};
