import assert from "node:assert/strict";
import test from "node:test";
import type { Response } from "express";
import { build } from "esbuild";
import { sendSyncFailure } from "./routes";
import { isUserEmailIdentityConflict, UserEmailIdentityConflictError } from "./storage";

function captureResponse(error: unknown) {
  let status = 200;
  let body: unknown;
  const response = {
    status(code: number) {
      status = code;
      return this;
    },
    json(value: unknown) {
      body = value;
      return this;
    },
  };
  sendSyncFailure(response as unknown as Response, error);
  return { status, body };
}

test("only the known email unique violation is classified as an identity conflict", () => {
  assert.equal(isUserEmailIdentityConflict({
    code: "23505",
    message: 'duplicate key value violates unique constraint "users_email_key"',
  }), true);
  assert.equal(isUserEmailIdentityConflict({
    code: "23505",
    message: 'duplicate key value violates unique constraint "users_pkey"',
  }), false);
  assert.equal(isUserEmailIdentityConflict({
    code: "23503",
    message: 'users_email_key',
  }), false);
});

test("identity conflicts and database failures expose only sanitized outcomes", () => {
  assert.deepEqual(captureResponse(new UserEmailIdentityConflictError()), {
    status: 409,
    body: { ok: false, code: "IDENTITY_CONFLICT" },
  });

  const sensitiveFailure = new Error("private database details must not reach the client");
  assert.deepEqual(captureResponse(sensitiveFailure), {
    status: 500,
    body: { ok: false, code: "SYNC_FAILED" },
  });
});

test("quiz-result lookup distinguishes no row from a database failure", async () => {
  const bundle = await build({
    entryPoints: [new URL("./storage.ts", import.meta.url).pathname],
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
    plugins: [{
      name: "lookup-io",
      setup(context) {
        context.onResolve({ filter: /^\.\/supabase$/ }, () => ({
          path: "supabase",
          namespace: "lookup-test",
        }));
        context.onLoad({ filter: /.*/, namespace: "lookup-test" }, () => ({
          loader: "js",
          contents: `
            function chain() {
              return {
                select: () => chain(), eq: () => chain(),
                order: () => chain(), limit: () => chain(),
                maybeSingle: () => globalThis.__quizLookupResponse(),
              };
            }
            export function getSupabaseAdminClient() {
              return { from: () => chain() };
            }
          `,
        }));
      },
    }],
  });
  const url = `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`;
  const { storage: isolatedStorage } = await import(url) as typeof import("./storage");
  const setResponse = (value: unknown) => {
    (globalThis as typeof globalThis & {
      __quizLookupResponse: () => Promise<unknown>;
    }).__quizLookupResponse = async () => value;
  };

  setResponse({ data: null, error: null });
  assert.equal(await isolatedStorage.getQuizResultByUserId("test-user"), null);

  setResponse({ data: { id: "result" }, error: null });
  assert.deepEqual(await isolatedStorage.getQuizResultByUserId("test-user"), { id: "result" });

  setResponse({ data: null, error: { code: "XX000", message: "private details" } });
  await assert.rejects(
    isolatedStorage.getQuizResultByUserId("test-user"),
    /quiz_results lookup failed/,
  );
});