export type TypeWorkspaceRouteResult =
  | { kind: "unauthenticated" }
  | { kind: "notFound" }
  | {
      kind: "authorized";
      activeWorkspaceId: string;
      isAccountSession: boolean;
      role: "owner" | "member";
      workspace: { id: string; name: string };
    };