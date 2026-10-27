import { describe, expect, test } from "vitest";
import { slugifyWorkspaceName, workspaceUrl } from "./workspaceUrl";

describe("workspace URLs", () => {
  test("creates readable slugs from workspace names", () => {
    expect(slugifyWorkspaceName("Equipe de Produto")).toBe("equipe-de-produto");
    expect(slugifyWorkspaceName("  São Paulo  ")).toBe("sao-paulo");
  });

  test("uses the stable workspace ID in its URL", () => {
    expect(
      workspaceUrl({ id: "workspace-id", name: "Equipe de Produto" }),
    ).toBe("/workspace/workspace-id/equipe-de-produto");
  });

  test("uses a fallback slug for names without ASCII letters", () => {
    expect(slugifyWorkspaceName("東京")).toBe("workspace");
  });
});
