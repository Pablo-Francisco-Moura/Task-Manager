export type TypeWorkspaceInviteStatus =
  | "pending"
  | "revoked"
  | "expired"
  | "accepted"
  | "declined";

export interface TypeProjectOption {
  id: number;
  name: string;
}

export interface TypeSentWorkspaceInvite {
  id: number;
  status: TypeWorkspaceInviteStatus;
  projects: TypeProjectOption[];
  createdAt: string;
  expiresAt: string;
  projectIds: number[];
  targetUser: {
    username: string | null;
    displayName: string;
  };
}

export interface TypeWorkspaceInviteFeedItem {
  id: number;
  status: TypeWorkspaceInviteStatus;
  readAt: string | null;
  projects: Array<{ id: number; name: string }>;
  createdAt: string;
  projectIds: number[];
  workspace: {
    id: string;
    name: string;
    kind: "personal" | "shared";
    createdAt: string;
  };
  createdBy: {
    id: string;
    username: string | null;
    displayName: string;
  };
}

export interface TypeWorkspaceInviteTarget {
  id: string;
  displayName: string;
  username: string;
  hasActiveInvite: boolean;
  activeInviteProjectIds: number[];
}

export interface TypeCreateWorkspaceInviteResponse {
  id: number;
  status: TypeWorkspaceInviteStatus;
  updatedExisting: boolean;
}
