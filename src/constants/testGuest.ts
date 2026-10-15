export const TEST_GUEST_IDENTITY = {
  userId: "00000000-0000-4000-8000-000000000001",
  workspaceId: "00000000-0000-4000-8000-000000000002",
  sessionToken: "test-guest-session-token",
};

export const TEST_GUEST_COOKIE = `guest_session=${TEST_GUEST_IDENTITY.sessionToken}`;
