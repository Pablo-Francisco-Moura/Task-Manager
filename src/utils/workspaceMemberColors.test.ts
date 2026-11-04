import { describe, expect, it } from "vitest";
import { getWorkspaceMemberColorIndices } from "./workspaceMemberColors";

describe("getWorkspaceMemberColorIndices", () => {
  it("keeps the owner primary and assigns nine distinct colors to members", () => {
    const members = [
      { userId: "owner", role: "owner" as const, joinedAt: "2026-01-01" },
      ...Array.from({ length: 10 }, (_, index) => ({
        userId: `member-${String(index).padStart(2, "0")}`,
        role: "member" as const,
        joinedAt: "2026-01-02",
      })),
    ];

    const colors = getWorkspaceMemberColorIndices(members);

    expect(colors.get("owner")).toBe(0);
    expect(
      new Set(
        Array.from({ length: 9 }, (_, index) =>
          colors.get(`member-${String(index).padStart(2, "0")}`),
        ),
      ),
    ).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    expect(colors.get("member-09")).toBe(colors.get("member-00"));
  });

  it("uses saved member colors and keeps the owner primary", () => {
    const colors = getWorkspaceMemberColorIndices([
      {
        userId: "owner",
        role: "owner",
        joinedAt: "2026-01-01",
        colorIndex: 8,
      },
      {
        userId: "member",
        role: "member",
        joinedAt: "2026-01-02",
        colorIndex: 4,
      },
    ]);

    expect(colors.get("owner")).toBe(0);
    expect(colors.get("member")).toBe(4);
  });
});
