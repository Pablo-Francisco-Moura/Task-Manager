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
