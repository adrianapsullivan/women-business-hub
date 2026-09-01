import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import test from "node:test";

import express from "express";

import { registerRoutes, setReportAccessCookie } from "./routes";

async function withApi(
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const app = express();
  app.use(express.json());
  const server = createServer(app);
  await registerRoutes(server, app);

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("legacy plaintext password endpoints are retired", async () => {
  await withApi(async (baseUrl) => {
    for (const path of ["/api/auth/signup", "/api/auth/login"]) {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "member@example.com",
          password: "must-never-be-processed",
        }),
      });

      assert.equal(response.status, 410);
      assert.deepEqual(await response.json(), {
        message: "Legacy password authentication is retired; use Supabase Auth",
      });
    }
  });
});

test("user-owned legacy APIs reject unauthenticated requests before storage access", async () => {
  await withApi(async (baseUrl) => {
    const requests = [
      fetch(`${baseUrl}/api/quiz/result/caller-supplied-user`),
      fetch(`${baseUrl}/api/foundation/progress/caller-supplied-user`),
      fetch(`${baseUrl}/api/onboarding/progress/caller-supplied-user`),
      fetch(`${baseUrl}/api/progress/caller-supplied-user`),
      fetch(`${baseUrl}/api/mission/status/caller-supplied-user`),
      fetch(`${baseUrl}/api/auth/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "caller-supplied-user",
          email: "attacker@example.com",
        }),
      }),
    ];

    const responses = await Promise.all(requests);
    for (const response of responses) {
      assert.equal(response.status, 401);
    }
  });
});

test("V2 persistence remains controlled-unavailable before migration", async () => {
  await withApi(async (baseUrl) => {
    const invalidSubmission = await fetch(`${baseUrl}/api/dna/v2/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Ada",
        email: "ada@example.com",
        answers: [],
      }),
    });
    assert.equal(invalidSubmission.status, 503);
    assert.deepEqual(await invalidSubmission.json(), {
      message: "Entrepreneur DNA V2 persistence is not available",
    });

    const reportWithoutCapability = await fetch(
      `${baseUrl}/api/dna/v2/report`,
    );
    assert.equal(reportWithoutCapability.status, 404);

    const claimWithoutAuthentication = await fetch(
      `${baseUrl}/api/dna/v2/claim`,
      { method: "POST" },
    );
    assert.equal(claimWithoutAuthentication.status, 401);
  });
});

test("a malformed report cookie returns the normal unavailable response", async () => {
  await withApi(async (baseUrl) => {
    const malformedResponse = await fetch(`${baseUrl}/api/dna/v2/report`, {
      headers: {
        Cookie: "wbe_dna_report_access=%E0%A4%A",
      },
    });

    assert.equal(malformedResponse.status, 404);
    assert.deepEqual(await malformedResponse.json(), {
      message: "DNA result not found",
    });

    const unavailableResponse = await fetch(`${baseUrl}/api/dna/v2/report`, {
      headers: {
        Cookie: "wbe_dna_report_access=well-formed-but-disabled",
      },
    });
    assert.equal(unavailableResponse.status, 404);
    assert.deepEqual(await unavailableResponse.json(), {
      message: "DNA result not found",
    });
  });
});

test("the incompatible public waitlist write is retired before storage access", async () => {
  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Ada",
        email: "ada@example.com",
        dnaType: "Strategic Builder",
      }),
    });

    assert.equal(response.status, 410);
    assert.deepEqual(await response.json(), {
      message: "Waitlist registration is not available",
    });
  });
});

test("server-owned storage never performs writes with the public anonymous client", () => {
  const storageSource = readFileSync(
    new URL("./storage.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    storageSource,
    /getSupabaseAdminClient\s+as\s+getSupabaseClient/,
  );
  assert.doesNotMatch(
    storageSource,
    /import\s+\{\s*getSupabaseClient\s*\}\s+from/,
  );
  assert.doesNotMatch(storageSource, /getUserByEmail|createUser\s*\(/);
  assert.doesNotMatch(storageSource, /data\.password|row\.password/);
});

test("a recovered report token is issued as a fresh HttpOnly session cookie", () => {
  let issuedCookie: {
    name: string;
    value: string;
    options: Record<string, unknown>;
  } | null = null;
  const response = {
    cookie(name: string, value: string, options: Record<string, unknown>) {
      issuedCookie = { name, value, options };
    },
  };

  setReportAccessCookie(
    response as never,
    "fresh-rotated-token",
    "2026-11-26T12:00:00.000Z",
  );

  assert.ok(issuedCookie);
  assert.equal(issuedCookie.name, "wbe_dna_report_access");
  assert.equal(issuedCookie.value, "fresh-rotated-token");
  assert.equal(issuedCookie.options.httpOnly, true);
  assert.equal(issuedCookie.options.sameSite, "lax");
  assert.equal(issuedCookie.options.path, "/");
  assert.deepEqual(
    issuedCookie.options.expires,
    new Date("2026-11-26T12:00:00.000Z"),
  );
});
