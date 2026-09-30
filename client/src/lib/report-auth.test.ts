import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createReportAuthGate,
  readFreshReportUser,
  type ReportAuthState,
  type ReportAuthUser,
} from "./report-auth";

const confirmedUser = {
  id: "test-user",
  email: "test@example.invalid",
  email_confirmed_at: "2026-01-01T00:00:00Z",
};

function setup(getUser: () => Promise<ReportAuthUser | null>) {
  const states: ReportAuthState[] = [];
  const routes: string[] = [];
  const unlocked: string[] = [];
  const gate = createReportAuthGate({
    getUser,
    onStateChange: (state) => {
      states.push(state);
      if (state === "guest" || state === "pending") {
        routes.push("/signup?redirect=/report");
      }
    },
    onUnlock: (user) => unlocked.push(user.id),
  });
  return { gate, states, routes, unlocked };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const reportSource = readFileSync(new URL("../pages/report.tsx", import.meta.url), "utf8");

for (const version of ["V2", "legacy"]) {
  test(`${version} local result alone cannot unlock the full Report; direct access routes to Signup`, async () => {
    const { gate, states, routes, unlocked } = setup(async () =>
      readFreshReportUser({
        data: { user: null },
        error: { name: "AuthSessionMissingError" },
      }),
    );
    await gate.validate();

    assert.deepEqual(states, ["loading", "guest"]);
    assert.deepEqual(routes, ["/signup?redirect=/report"]);
    assert.deepEqual(unlocked, []);
    assert.match(reportSource, /readActiveClientDnaResult\([\s\S]*?V2_RESULT_STORAGE_KEY[\s\S]*?LEGACY_RESULT_STORAGE_KEY/);
    assert.match(reportSource, /\{authState === "unlocked" && \(/);
    assert.match(reportSource, /navigate\("\/signup\?redirect=\/report"\)/);
  });
}

test("a confirmed-looking local session is not authorization without a fresh valid getUser response", async () => {
  const { gate, states, unlocked } = setup(async () =>
    readFreshReportUser({ data: { user: null }, error: null }),
  );
  await gate.validate();
  assert.equal(states.at(-1), "guest");
  assert.deepEqual(unlocked, []);
  assert.match(reportSource, /readFreshReportUser\(await supabase\.auth\.getUser\(\)\)/);
  assert.doesNotMatch(reportSource, /supabase\.auth\.getSession\(\)/);
  assert.doesNotMatch(reportSource, /applySession\(session\?\.user/);
});

test("a freshly validated confirmed user unlocks without a Signup redirect", async () => {
  const { gate, states, routes, unlocked } = setup(async () => confirmedUser);
  await gate.validate();
  assert.deepEqual(states, ["loading", "unlocked"]);
  assert.deepEqual(routes, []);
  assert.deepEqual(unlocked, ["test-user"]);
});

test("an unconfirmed user cannot unlock", async () => {
  const { gate, states, routes, unlocked } = setup(async () => ({
    ...confirmedUser,
    email_confirmed_at: null,
  }));
  await gate.validate();
  assert.equal(states.at(-1), "pending");
  assert.deepEqual(routes, ["/signup?redirect=/report"]);
  assert.deepEqual(unlocked, []);
});

for (const id of [undefined, null, "", "   "]) {
  test(`a missing or malformed ID (${String(id)}) cannot unlock`, async () => {
    const { gate, states, unlocked } = setup(async () => ({ ...confirmedUser, id }));
    await gate.validate();
    assert.equal(states.at(-1), "guest");
    assert.deepEqual(unlocked, []);
  });
}

test("a server Auth error remains locked and retry can authorize later", async () => {
  let attempts = 0;
  const { gate, states, routes, unlocked } = setup(async () => {
    if (++attempts === 1) {
      return readFreshReportUser({
        data: { user: null },
        error: { name: "AuthRetryableFetchError" },
      });
    }
    return confirmedUser;
  });
  await gate.validate();
  assert.deepEqual(states, ["loading", "error"]);
  assert.deepEqual(routes, []);
  assert.deepEqual(unlocked, []);
  assert.match(reportSource, /\{authState === "error" && \(/);
  assert.match(reportSource, /authGateRef\.current\?\.validate\(\)/);
  assert.match(reportSource, /\/signup\?mode=signin&redirect=\/report/);

  await gate.validate();
  assert.equal(states.at(-1), "unlocked");
  assert.deepEqual(unlocked, ["test-user"]);
});

test("a rejected getUser promise also presents a retryable error", async () => {
  const { gate, states, routes, unlocked } = setup(async () => {
    throw new Error("network unavailable");
  });
  await gate.validate();
  assert.deepEqual(states, ["loading", "error"]);
  assert.deepEqual(routes, []);
  assert.deepEqual(unlocked, []);
});

test("a rejected validation cannot overwrite a newer guest state", async () => {
  const pending = deferred<ReportAuthUser | null>();
  const { gate, states, unlocked } = setup(() => pending.promise);
  const validation = gate.validate();
  gate.signOut();
  pending.reject(new Error("old network error"));
  await validation;
  assert.equal(states.at(-1), "guest");
  assert.deepEqual(unlocked, []);
});

test("an older confirmed validation cannot override sign-out or a newer guest result", async () => {
  const old = deferred<ReportAuthUser | null>();
  let calls = 0;
  const { gate, states, unlocked } = setup(() => ++calls === 1 ? old.promise : Promise.resolve(null));
  const first = gate.validate();
  gate.signOut();
  await gate.validate();
  old.resolve(confirmedUser);
  await first;
  assert.equal(states.at(-1), "guest");
  assert.deepEqual(unlocked, []);
});

test("a newer validation wins over an older one even without sign-out", async () => {
  const old = deferred<ReportAuthUser | null>();
  let calls = 0;
  const { gate, states, unlocked } = setup(
    () => ++calls === 1 ? old.promise : Promise.resolve(null),
  );
  const first = gate.validate();
  await gate.validate();
  old.resolve(confirmedUser);
  await first;
  assert.equal(states.at(-1), "guest");
  assert.deepEqual(unlocked, []);
});

test("password recovery's freshly validated confirmed session stays usable", async () => {
  const { gate, states, routes } = setup(async () => confirmedUser);
  await gate.validate();
  assert.equal(states.at(-1), "unlocked");
  assert.deepEqual(routes, []);
  assert.doesNotMatch(reportSource, /auth\.signOut\(/);
});

test("unlock side effects occur only after validation and once for repeated Auth events", async () => {
  const pending = deferred<ReportAuthUser | null>();
  let calls = 0;
  const { gate, states, unlocked } = setup(
    () => ++calls === 1 ? pending.promise : Promise.resolve(confirmedUser),
  );
  const first = gate.validate();
  assert.deepEqual(unlocked, []);
  pending.resolve(confirmedUser);
  await first;
  await gate.validate();
  await gate.validate();
  assert.equal(states.at(-1), "unlocked");
  assert.deepEqual(unlocked, ["test-user"]);
  assert.match(reportSource, /onUnlock: \(user\) => \{[\s\S]*?saveUserProgress\(\{ reportUnlocked: true \}\);[\s\S]*?saveOnboardingStep\("report"\)/);
});

test("disposal prevents a late request from unlocking or producing side effects", async () => {
  const pending = deferred<ReportAuthUser | null>();
  const { gate, unlocked, states } = setup(() => pending.promise);
  const validation = gate.validate();
  gate.dispose();
  pending.resolve(confirmedUser);
  await validation;
  assert.deepEqual(states, ["loading"]);
  assert.deepEqual(unlocked, []);
});

test("Report preserves V2/legacy result loading and existing post-Report routing", () => {
  assert.match(reportSource, /readActiveClientDnaResult\([\s\S]*?V2_RESULT_STORAGE_KEY[\s\S]*?LEGACY_RESULT_STORAGE_KEY/);
  assert.match(reportSource, /clientResult\s*\?\s*getPostReportRoute\(clientResult\)/);
});