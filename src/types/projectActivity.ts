import type { TypeLocalTaskStatus } from "./localData";

export type TypeProjectActivity = {
  id: number;
  actorId: string;
  content: string | null;
  details: Record<string, unknown> | null;
  canEdit: boolean;
  taskName: string | null;
  actorName: string;
  isDeleted: boolean;
  canDelete: boolean;
  createdAt: string;
  type:
    | "project_created"
    | "project_updated"
    | "member_added"
    | "member_removed"
    | "task_created"
    | "task_updated"
    | "task_moved"
    | "task_deleted"
    | "comment";
};

export type TypeTaskMovementDetails = {
  fromStatus: TypeLocalTaskStatus | null;
  toStatus: TypeLocalTaskStatus | null;
  fromPosition: number | null;
  toPosition: number | null;
};

export type TypeProjectActivityDetail = {
  field: string;
  from: string;
  to: string;
  isSummary: boolean;
};
