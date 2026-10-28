import {
  workspaceUrl,
  workspacePublicId,
  slugifyWorkspaceName,
  decodeWorkspacePublicId,
} from "./workspaceUrl";
import { describe, expect, test } from "vitest";

describe("workspace URLs", () => {
  test("creates readable slugs from workspace names", () => {
    expect(slugifyWorkspaceName("Equipe de Produto")).toBe("equipe-de-produto");
    expect(slugifyWorkspaceName("  São Paulo  ")).toBe("sao-paulo");
  });

  test("uses a short public workspace identifier in its URL", () => {
    const id = "815fba39-5ce7-441b-92af-77405cc60d06";
    const publicId = workspacePublicId(id);

    expect(publicId).not.toBe(id);
    expect(publicId).toMatch(/^[0-9A-Za-z]+$/);
    expect(decodeWorkspacePublicId(publicId)).toBe(id);
    expect(workspaceUrl({ id, name: "Equipe de Produto" })).toBe(
      `/workspace/${publicId}/equipe-de-produto`,
    );
  });

  test("uses a fallback slug for names without ASCII letters", () => {
    expect(slugifyWorkspaceName("東京")).toBe("workspace");
  });
});
