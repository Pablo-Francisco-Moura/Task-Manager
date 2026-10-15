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
};
