import { describe, expect, test } from "vitest";
import { resolveAccountDialogContent } from "./AppBarTop";

describe("account dialog labels", () => {
  test("uses the sign-in copy for the sign-in flow", () => {
    expect(
      resolveAccountDialogContent("signIn", (key) => {
        const labels: Record<string, string> = {
          "account.signIn.title": "Sign in to your account",
          "account.signIn.submit": "Sign in",
          "account.create.title": "Create your account",
          "account.create.submit": "Create account",
        };

        return labels[key] ?? key;
      }),
    ).toEqual({
      title: "Sign in to your account",
      submit: "Sign in",
    });
  });

  test("uses the sign-up copy for the sign-up flow", () => {
    expect(
      resolveAccountDialogContent("signUp", (key) => {
        const labels: Record<string, string> = {
          "account.signIn.title": "Sign in to your account",
          "account.signIn.submit": "Sign in",
          "account.create.title": "Create your account",
          "account.create.submit": "Create account",
        };

        return labels[key] ?? key;
      }),
    ).toEqual({
      title: "Create your account",
      submit: "Create account",
    });
  });
});
