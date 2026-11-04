export type TypeMemberProject = { id: number; name: string };

export type TypeWorkspaceMemberColorIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type TypeWorkspaceMemberIdentity = {
  userId: string;
  role: "owner" | "member";
  joinedAt: Date | string;
};

export type TypeWorkspaceMember = {
  role: "owner" | "member";
  colorIndex: TypeWorkspaceMemberColorIndex;
  userId: string;
  username: string | null;
  joinedAt: string;
  projects: TypeMemberProject[];
  displayName: string;
  isCurrentUser: boolean;
};

export type TypeWorkspaceRoster = {
  members: TypeWorkspaceMember[];
  projects: TypeMemberProject[];
};
