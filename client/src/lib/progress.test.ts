import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";

// Bundle the real sync function with only its I/O dependencies substituted.
// No Supabase session or network access is needed to exercise its response handling.
const bundle = await build({
  entryPoints: [new URL("./progress.ts", import.meta.url).pathname],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  plugins: [{
    name: "sync-io",
    setup(context) {
      context.onResolve({ filter: /^@\/lib\/(supabase|authenticated-fetch)$/ }, (args) => ({
        path: args.path,
        namespace: "sync-test",
      }));
      context.onLoad({ filter: /.*/, namespace: "sync-test" }, (args) => ({
        loader: "js",
        contents: args.path.endsWith("supabase")
          ? "export default { auth: { updateUser: async () => ({ error: null }) } };"
          : "export const authenticatedFetch = (...args) => globalThis.__syncTestFetch(...args);",
      }));
    },
  }],
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`;
const { syncUserToDatabase } = await import(moduleUrl) as typeof import("./progress");

const mockStorage = { getItem: (_key: string) => null };
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: mockStorage });
const user = { id: "test-user", user_metadata: { quiz_completed: true } };

async function syncWith(response: Response | Error) {
  (globalThis as typeof globalThis & {
    __syncTestFetch: () => Promise<Response>;
  }).__syncTestFetch = async () => {
    if (response instanceof Error) throw response;
    return response;
  };
  return syncUserToDatabase(user);
}

test("only a validated 200 response can report a quiz result or no result", async () => {
  assert.deepEqual(await syncWith(Response.json({ ok: true, hasQuizResult: true })), {
    status: "success", hasQuizResult: true,
  });
  assert.deepEqual(await syncWith(Response.json({ ok: true, hasQuizResult: false })), {
    status: "success", hasQuizResult: false,
  });
});

test("the known 409 response is distinct from a transient failure", async () => {
  assert.deepEqual(await syncWith(Response.json(
    { ok: false, code: "IDENTITY_CONFLICT" }, { status: 409 },
  )), { status: "identity_conflict" });
  assert.deepEqual(await syncWith(Response.json(
    { ok: false, code: "SYNC_FAILED" }, { status: 409 },
  )), { status: "error" });
});

test("500, network failure, and malformed success never become hasQuizResult false", async () => {
  assert.deepEqual(await syncWith(Response.json(
    { ok: false, error: "sensitive database detail" }, { status: 500 },
  )), { status: "error" });
  assert.deepEqual(await syncWith(new Error("network unavailable")), { status: "error" });
  assert.deepEqual(await syncWith(Response.json({ ok: true })), { status: "error" });
  assert.deepEqual(await syncWith(Response.json({ ok: false, hasQuizResult: false })), { status: "error" });
  assert.deepEqual(await syncWith(new Response("not json")), { status: "error" });
});