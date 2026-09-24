import assert from "node:assert/strict";
import test from "node:test";
import {
  getValidSignupUser,
  resolveInitialSignupAuth,
  runCancellableAuthenticatedRouting,
} from "./signup-auth";

test("getValidSignupUser rejects a signup response without a user id", () => {
  assert.equal(getValidSignupUser({ user: null }), null);
  assert.equal(getValidSignupUser({ user: { id: "" } }), null);
});

test("getValidSignupUser returns a signup user with a valid id", () => {
  const user = { id: "user-123", email: "new@example.com" };

  assert.equal(getValidSignupUser({ user }), user);
});

test("resolveInitialSignupAuth does not complete before getUser resolves", async () => {
  let resolveGetUser!: (value: { user: null }) => void;
  const getUser = () =>
    new Promise<{ user: null }>((resolve) => {
      resolveGetUser = resolve;
    });
  let settled = false;

  const resultPromise = resolveInitialSignupAuth(getUser, async () => {}).then(
    (result) => {
      settled = true;
      return result;
    },
  );

  await Promise.resolve();
  assert.equal(settled, false);

  resolveGetUser({ user: null });
  assert.equal(await resultPromise, "ready");
});

test("resolveInitialSignupAuth routes an existing confirmed user before signup is enabled", async () => {
  const user = { id: "existing-user", email_confirmed_at: "2026-09-01T00:00:00Z" };
  const routed: string[] = [];

  const result = await resolveInitialSignupAuth(
    async () => ({ user }),
    async (authenticatedUser) => {
      routed.push(authenticatedUser.id);
    },
  );

  assert.equal(result, "redirected");
  assert.deepEqual(routed, ["existing-user"]);
});

test("resolveInitialSignupAuth returns an error state when getUser rejects", async () => {
  const result = await resolveInitialSignupAuth(
    async () => {
      throw new Error("authentication unavailable");
    },
    async () => {},
  );

  assert.equal(result, "error");
});

test("resolveInitialSignupAuth returns an error state when existing-user routing rejects", async () => {
  const user = { id: "existing-user", email_confirmed_at: "2026-09-01T00:00:00Z" };

  const result = await resolveInitialSignupAuth(
    async () => ({ user }),
    async () => {
      throw new Error("routing unavailable");
    },
  );

  assert.equal(result, "error");
});

test("resolveInitialSignupAuth does not begin routing after cancellation", async () => {
  let cancelled = false;
  let resolveGetUser!: (value: {
    user: { id: string; email_confirmed_at: string };
  }) => void;
  const routed: string[] = [];
  const resultPromise = resolveInitialSignupAuth(
    () =>
      new Promise((resolve) => {
        resolveGetUser = resolve;
      }),
    async (user) => {
      routed.push(user.id);
    },
    () => cancelled,
  );

  cancelled = true;
  resolveGetUser({
    user: { id: "existing-user", email_confirmed_at: "2026-09-01T00:00:00Z" },
  });

  assert.equal(await resultPromise, "cancelled");
  assert.deepEqual(routed, []);
});

test("runCancellableAuthenticatedRouting stops after synchronization without committing", async () => {
  let cancelled = false;
  let resolveSync!: (value: string) => void;
  let progressLoads = 0;
  const committed: string[] = [];
  const resultPromise = runCancellableAuthenticatedRouting({
    isCancelled: () => cancelled,
    synchronize: () =>
      new Promise<string>((resolve) => {
        resolveSync = resolve;
      }),
    loadProgress: async () => {
      progressLoads += 1;
      return "progress";
    },
    commit: (syncResult, progress) => {
      committed.push(`${syncResult}:${progress}`);
    },
  });

  cancelled = true;
  resolveSync("synced");

  assert.equal(await resultPromise, "cancelled");
  assert.equal(progressLoads, 0);
  assert.deepEqual(committed, []);
});

test("runCancellableAuthenticatedRouting stops after progress loading without committing", async () => {
  let cancelled = false;
  let resolveProgress!: (value: string) => void;
  const committed: string[] = [];
  const resultPromise = runCancellableAuthenticatedRouting({
    isCancelled: () => cancelled,
    synchronize: async () => "synced",
    loadProgress: () =>
      new Promise<string>((resolve) => {
        resolveProgress = resolve;
      }),
    commit: (syncResult, progress) => {
      committed.push(`${syncResult}:${progress}`);
    },
  });

  await Promise.resolve();
  cancelled = true;
  resolveProgress("progress");

  assert.equal(await resultPromise, "cancelled");
  assert.deepEqual(committed, []);
});

test("runCancellableAuthenticatedRouting commits normal routing once", async () => {
  const committed: string[] = [];

  const result = await runCancellableAuthenticatedRouting({
    isCancelled: () => false,
    synchronize: async () => "synced",
    loadProgress: async () => "progress",
    commit: (syncResult, progress) => {
      committed.push(`${syncResult}:${progress}`);
    },
  });

  assert.equal(result, "routed");
  assert.deepEqual(committed, ["synced:progress"]);
});
