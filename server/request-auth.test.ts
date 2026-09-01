import assert from "node:assert/strict";
import test from "node:test";

import {
  RequestAuthenticationError,
  verifyAuthorizationHeader,
} from "./request-auth";

test("verified bearer authentication returns only the identity established by Supabase", async () => {
  const observedTokens: string[] = [];
  const identity = await verifyAuthorizationHeader(
    "Bearer verified-access-token",
    async (token) => {
      observedTokens.push(token);
      return {
        id: "auth-user-123",
        email: "Member@Example.com",
      };
    },
  );

  assert.deepEqual(observedTokens, ["verified-access-token"]);
  assert.deepEqual(identity, {
    id: "auth-user-123",
    email: "Member@Example.com",
  });
});

test("verified bearer authentication rejects missing, malformed, and invalid credentials", async () => {
  const cases = [
    undefined,
    "",
    "Basic abc123",
    "Bearer",
    "Bearer ",
    "Bearer invalid",
  ];

  for (const authorization of cases) {
    await assert.rejects(
      verifyAuthorizationHeader(authorization, async () => null),
      (error: unknown) =>
        error instanceof RequestAuthenticationError && error.statusCode === 401,
    );
  }
});
