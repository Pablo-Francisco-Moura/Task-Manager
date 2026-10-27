export type TypeMemberProject = { id: number; name: string };

export type TypeWorkspaceMember = {
  role: "owner" | "member";
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
