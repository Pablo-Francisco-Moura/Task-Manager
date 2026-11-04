import {
  accountWorkspaceRequest,
  ACCOUNT_SESSION_EXPIRED_EVENT,
  getProjectActivityUnreadCount,
} from "./accountWorkspaceApi";
import { afterEach, describe, expect, test, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("account workspace requests", () => {
  test("should load unread project activity as a shared numeric query value", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ unreadCount: 3 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getProjectActivityUnreadCount(42)).resolves.toBe(3);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/project/42/activity/unread-count",
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  test("should preserve API error codes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "An active invitation already includes these projects",
            code: "ACTIVE_INVITE_EXISTS",
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    await expect(accountWorkspaceRequest("/api/invite")).rejects.toMatchObject(
      {
        status: 409,
        code: "ACTIVE_INVITE_EXISTS",
      },
    );
  });

  test("should dispatch a session-expired event for unauthorized responses", async () => {
    const browserEvents = new EventTarget();
    const onExpired = vi.fn();
    browserEvents.addEventListener(ACCOUNT_SESSION_EXPIRED_EVENT, onExpired);
    vi.stubGlobal("window", browserEvents as unknown as Window);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Account session expired" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(accountWorkspaceRequest("/api/project")).rejects.toMatchObject(
      {
        message: "Account session expired",
        status: 401,
      },
    );
    expect(onExpired).toHaveBeenCalledOnce();
  });
});
