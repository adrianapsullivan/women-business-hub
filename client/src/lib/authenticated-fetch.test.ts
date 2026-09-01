import assert from "node:assert/strict";
import test from "node:test";

import { createAuthenticatedFetch } from "./authenticated-fetch";

test("authenticated fetch supplies the verified Supabase access token and preserves headers", async () => {
  let observedInput: RequestInfo | URL | undefined;
  let observedInit: RequestInit | undefined;
  const authenticatedFetch = createAuthenticatedFetch(
    async () => "supabase-access-token",
    async (input, init) => {
      observedInput = input;
      observedInit = init;
      return new Response(null, { status: 204 });
    },
  );

  const response = await authenticatedFetch("/api/auth/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });

  assert.equal(response.status, 204);
  assert.equal(observedInput, "/api/auth/sync");
  const headers = new Headers(observedInit?.headers);
  assert.equal(headers.get("Authorization"), "Bearer supabase-access-token");
  assert.equal(headers.get("Content-Type"), "application/json");
});

test("authenticated fetch refuses to call the API without a Supabase session", async () => {
  let called = false;
  const authenticatedFetch = createAuthenticatedFetch(
    async () => null,
    async () => {
      called = true;
      return new Response(null, { status: 204 });
    },
  );

  await assert.rejects(
    authenticatedFetch("/api/progress/member"),
    /Authenticated Supabase session required/,
  );
  assert.equal(called, false);
});
