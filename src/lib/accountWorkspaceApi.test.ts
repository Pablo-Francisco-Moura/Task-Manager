import {
  accountWorkspaceRequest,
  ACCOUNT_SESSION_EXPIRED_EVENT,
} from "./accountWorkspaceApi";
import { afterEach, describe, expect, test, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("account workspace requests", () => {
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
