export type TypeSessionVariables = {
  userId: string;
  workspaceId: string;
};

export type TypeSessionEnv = {
  Variables: TypeSessionVariables;
};

export type TypeAccountSessionState = {
  displayName: string;
  workspaceName: string;
  workspaceId?: string;
};

export type TypeWorkspaceMembership = {
  id: string;
  name: string;
  kind: "personal" | "shared";
  role: "owner" | "member";
};

export type TypeGuestProfileState = {
  displayName: string;
};

export type TypeAccountDialogMode = "signIn" | "signUp";
