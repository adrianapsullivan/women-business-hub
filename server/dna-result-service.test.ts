import assert from "node:assert/strict";
import test from "node:test";

import type { DnaAnswerValue } from "../shared/entrepreneur-dna/types";
import { scoreEntrepreneurDnaV2 } from "../shared/entrepreneur-dna/v2-scoring";
import {
  DnaResultAccessError,
  DnaResultConflictError,
  DnaResultValidationError,
  createDnaResultService,
  type DnaResultRepository,
  type StoredDnaResult,
} from "./dna-result-service";

function uniformAnswers(value: DnaAnswerValue) {
  return Array.from({ length: 25 }, (_unused, index) => ({
    questionId: index + 1,
    value,
  }));
}

class MemoryDnaResultRepository implements DnaResultRepository {
  readonly rows = new Map<string, StoredDnaResult>();

  async findByCompletionKey(completionKey: string) {
    return [...this.rows.values()].find(
      (row) => row.completionKey === completionKey,
    ) ?? null;
  }

  async insert(record: StoredDnaResult) {
    this.rows.set(record.id, record);
    return record;
  }

  async findByReportTokenHash(reportTokenHash: string) {
    return [...this.rows.values()].find(
      (row) => row.reportAccessTokenHash === reportTokenHash,
    ) ?? null;
  }

  async findByOwnerUserId(ownerUserId: string) {
    return [...this.rows.values()].find(
      (row) => row.ownerUserId === ownerUserId,
    ) ?? null;
  }

  async rotateReportAccess(
    resultId: string,
    reportAccessTokenHash: string,
    reportAccessExpiresAt: string,
    updatedAt: string,
  ) {
    const current = this.rows.get(resultId);
    if (!current) return null;
    if (
      current.ownerUserId !== null ||
      current.claimedAt !== null ||
      current.reportAccessRevokedAt !== null
    ) {
      return null;
    }
    const updated = Object.freeze({
      ...current,
      reportAccessTokenHash,
      reportAccessExpiresAt,
      reportAccessRevokedAt: null,
      updatedAt,
    });
    this.rows.set(resultId, updated);
    return updated;
  }

  async claimIfUnowned(
    resultId: string,
    ownerUserId: string,
    claimedAt: string,
    reportAccessRevokedAt: string,
  ) {
    const current = this.rows.get(resultId);
    if (!current) return null;
    if (current.ownerUserId && current.ownerUserId !== ownerUserId) return null;
    const claimed = Object.freeze({
      ...current,
      ownerUserId,
      claimedAt,
      reportAccessRevokedAt,
      updatedAt: claimedAt,
    });
    this.rows.set(resultId, claimed);
    return claimed;
  }
}

class ConcurrentInsertRepository extends MemoryDnaResultRepository {
  private initialFindCount = 0;
  private releaseInitialFinds: (() => void) | null = null;
  private readonly initialFindBarrier = new Promise<void>((resolve) => {
    this.releaseInitialFinds = resolve;
  });

  override async findByCompletionKey(completionKey: string) {
    const existing = await super.findByCompletionKey(completionKey);
    if (existing) return existing;

    this.initialFindCount += 1;
    if (this.initialFindCount === 2) {
      this.releaseInitialFinds?.();
    }
    await this.initialFindBarrier;
    return null;
  }

  override async insert(record: StoredDnaResult) {
    const existing = [...this.rows.values()].find(
      (row) => row.completionKey === record.completionKey,
    );
    if (existing) {
      throw Object.assign(new Error("duplicate completion key"), {
        code: "23505",
      });
    }
    return super.insert(record);
  }
}

class PausedRotationRepository extends MemoryDnaResultRepository {
  private signalRotationStarted: (() => void) | null = null;
  private releaseRotation: (() => void) | null = null;
  readonly rotationStarted = new Promise<void>((resolve) => {
    this.signalRotationStarted = resolve;
  });
  private readonly rotationReleased = new Promise<void>((resolve) => {
    this.releaseRotation = resolve;
  });

  continueRotation() {
    this.releaseRotation?.();
  }

  override async rotateReportAccess(
    resultId: string,
    reportAccessTokenHash: string,
    reportAccessExpiresAt: string,
    updatedAt: string,
  ) {
    this.signalRotationStarted?.();
    await this.rotationReleased;
    return super.rotateReportAccess(
      resultId,
      reportAccessTokenHash,
      reportAccessExpiresAt,
      updatedAt,
    );
  }
}

test("anonymous persistence stores one server-scored immutable V2 result", async () => {
  const repository = new MemoryDnaResultRepository();
  const service = createDnaResultService({
    repository,
    createId: () => "result-123",
    createReportAccessToken: () => "report-secret-token",
    hashReportAccessToken: (token) => `hash:${token}`,
    now: () => new Date("2026-08-27T12:00:00.000Z"),
  });

  const answers = uniformAnswers("A");
  const expectedScore = scoreEntrepreneurDnaV2(answers);
  const persisted = await service.persistAnonymousResult({
    completionKey: "completion-123",
    firstName: "  Ada  ",
    email: "  ADA@Example.COM ",
    answers,
  });

  assert.equal(persisted.reportAccessToken, "report-secret-token");
  assert.equal(persisted.record.id, "result-123");
  assert.equal(persisted.record.firstName, "Ada");
  assert.equal(persisted.record.email, "ADA@Example.COM");
  assert.equal(persisted.record.emailNormalized, "ada@example.com");
  assert.equal(persisted.record.assessmentVersion, "2.0-beta");
  assert.equal(persisted.record.scoringVersion, "2.0-beta");
  assert.equal(
    persisted.record.calibrationVersion,
    "2.0-beta-null-uniform",
  );
  assert.equal(
    persisted.record.resultPayload.primary_dna,
    expectedScore.primaryIdentity,
  );
  assert.equal(
    persisted.record.resultPayload.profile_classification,
    expectedScore.profileClassification,
  );
  assert.equal(persisted.record.reportAccessTokenHash, "hash:report-secret-token");
  assert.equal(persisted.record.ownerUserId, null);
  assert.equal(repository.rows.size, 1);
  assert.equal(Object.isFrozen(persisted.record), true);
  assert.equal(Object.isFrozen(persisted.record.resultPayload), true);
});

test("an identical anonymous retry recovers the immutable result and rotates report access", async () => {
  const repository = new MemoryDnaResultRepository();
  const tokens = ["original-report-token", "rotated-report-token"];
  let currentTime = new Date("2026-08-27T12:00:00.000Z");
  const service = createDnaResultService({
    repository,
    createId: () => "result-duplicate-test",
    createReportAccessToken: () => tokens.shift() ?? "unexpected-token",
    hashReportAccessToken: (token) => `hash:${token}`,
    now: () => currentTime,
  });
  const input = {
    completionKey: "completion-duplicate",
    firstName: "Ada",
    email: "ada@example.com",
    answers: uniformAnswers("B"),
  };

  const original = await service.persistAnonymousResult(input);
  const originalPayload = JSON.stringify(original.record.resultPayload);
  currentTime = new Date("2026-08-28T12:00:00.000Z");
  const recovered = await service.persistAnonymousResult({
    ...input,
    email: " ADA@EXAMPLE.COM ",
    clientResult: original.record.resultPayload,
  });

  assert.equal(repository.rows.size, 1);
  assert.equal(recovered.record.id, original.record.id);
  assert.equal(JSON.stringify(recovered.record.resultPayload), originalPayload);
  assert.equal(recovered.record.email, original.record.email);
  assert.equal(recovered.reportAccessToken, "rotated-report-token");
  assert.equal(
    recovered.record.reportAccessTokenHash,
    "hash:rotated-report-token",
  );
  assert.ok(
    Date.parse(recovered.record.reportAccessExpiresAt) >
      Date.parse(original.record.reportAccessExpiresAt),
  );
  await assert.rejects(
    service.readAnonymousResult("original-report-token"),
    (error: unknown) => error instanceof DnaResultAccessError,
  );
  assert.equal(
    (await service.readAnonymousResult("rotated-report-token")).id,
    original.record.id,
  );
});

test("a conflicting or unrelated completion retry cannot recover or alter a result", async () => {
  const repository = new MemoryDnaResultRepository();
  const service = createDnaResultService({
    repository,
    createId: () => "result-conflict-test",
    createReportAccessToken: () => "unchanged-report-token",
    hashReportAccessToken: (token) => `hash:${token}`,
    now: () => new Date("2026-08-27T12:00:00.000Z"),
  });
  const input = {
    completionKey: "completion-conflict",
    firstName: "Ada",
    email: "ada@example.com",
    answers: uniformAnswers("B"),
  };
  const original = await service.persistAnonymousResult(input);
  const originalSnapshot = JSON.stringify(original.record);

  for (const conflictingInput of [
    { ...input, email: "attacker@example.com" },
    { ...input, answers: uniformAnswers("C") },
    { ...input, firstName: "Someone Else" },
    {
      ...input,
      clientResult: {
        ...original.record.resultPayload,
        assessment_version: "forged-version",
      },
    },
  ]) {
    await assert.rejects(
      service.persistAnonymousResult(conflictingInput),
      (error: unknown) =>
        error instanceof DnaResultConflictError ||
        error instanceof DnaResultValidationError,
    );
  }

  assert.equal(repository.rows.size, 1);
  assert.equal(JSON.stringify(repository.rows.get(original.record.id)), originalSnapshot);
  assert.equal(
    (await service.readAnonymousResult("unchanged-report-token")).id,
    original.record.id,
  );
});

test("anonymous report access requires the exact unexpired unrevoked token", async () => {
  const repository = new MemoryDnaResultRepository();
  let currentTime = new Date("2026-08-27T12:00:00.000Z");
  const service = createDnaResultService({
    repository,
    createId: () => "result-access-test",
    createReportAccessToken: () => "correct-report-token",
    hashReportAccessToken: (token) => `hash:${token}`,
    now: () => currentTime,
  });
  const persisted = await service.persistAnonymousResult({
    completionKey: "completion-access",
    firstName: "Ada",
    email: "ada@example.com",
    answers: uniformAnswers("C"),
  });

  assert.equal(
    (await service.readAnonymousResult("correct-report-token")).id,
    persisted.record.id,
  );
  await assert.rejects(
    service.readAnonymousResult("wrong-report-token"),
    (error: unknown) => error instanceof DnaResultAccessError,
  );

  currentTime = new Date(persisted.record.reportAccessExpiresAt);
  await assert.rejects(
    service.readAnonymousResult("correct-report-token"),
    (error: unknown) => error instanceof DnaResultAccessError,
  );
});

test("claiming links the exact stored result only to a matching authenticated account", async () => {
  const repository = new MemoryDnaResultRepository();
  const service = createDnaResultService({
    repository,
    createId: () => "result-claim-test",
    createReportAccessToken: () => "claim-report-token",
    hashReportAccessToken: (token) => `hash:${token}`,
    now: () => new Date("2026-08-27T12:00:00.000Z"),
  });
  const persisted = await service.persistAnonymousResult({
    completionKey: "completion-claim",
    firstName: "Ada",
    email: "Ada@Example.com",
    answers: uniformAnswers("D"),
  });
  const exactOriginalResult = JSON.stringify(persisted.record.resultPayload);

  await assert.rejects(
    service.claimResult({
      reportAccessToken: "claim-report-token",
      authenticatedUserId: "wrong-email-user",
      authenticatedEmail: "other@example.com",
    }),
    (error: unknown) => error instanceof DnaResultConflictError,
  );

  const claimed = await service.claimResult({
    reportAccessToken: "claim-report-token",
    authenticatedUserId: "member-123",
    authenticatedEmail: "ada@example.com",
  });
  assert.equal(claimed.ownerUserId, "member-123");
  assert.equal(claimed.reportAccessRevokedAt, claimed.claimedAt);
  assert.equal(JSON.stringify(claimed.resultPayload), exactOriginalResult);
  await assert.rejects(
    service.readAnonymousResult("claim-report-token"),
    (error: unknown) => error instanceof DnaResultAccessError,
  );
  await assert.rejects(
    service.persistAnonymousResult({
      completionKey: "completion-claim",
      firstName: "Ada",
      email: "ada@example.com",
      answers: uniformAnswers("D"),
    }),
    (error: unknown) => error instanceof DnaResultConflictError,
  );
  assert.equal(
    (await service.readMemberResult("member-123")).id,
    persisted.record.id,
  );

  const repeated = await service.claimResult({
    reportAccessToken: "claim-report-token",
    authenticatedUserId: "member-123",
    authenticatedEmail: "ADA@EXAMPLE.COM",
  });
  assert.equal(repeated.ownerUserId, "member-123");
  assert.equal(JSON.stringify(repeated.resultPayload), exactOriginalResult);

  await assert.rejects(
    service.claimResult({
      reportAccessToken: "claim-report-token",
      authenticatedUserId: "member-456",
      authenticatedEmail: "ada@example.com",
    }),
    (error: unknown) => error instanceof DnaResultConflictError,
  );
});

test("a concurrent owner uniqueness collision returns a defined conflict", async () => {
  class OwnerCollisionRepository extends MemoryDnaResultRepository {
    override async findByOwnerUserId(_ownerUserId: string) {
      return null;
    }

    override claimIfUnowned(
      _resultId: string,
      _ownerUserId: string,
      _claimedAt: string,
      _reportAccessRevokedAt: string,
    ) {
      return Promise.reject(
        Object.assign(new Error("duplicate owner"), { code: "23505" }),
      );
    }
  }

  const repository = new OwnerCollisionRepository();
  const service = createDnaResultService({
    repository,
    createId: () => "result-owner-collision",
    createReportAccessToken: () => "owner-collision-token",
    hashReportAccessToken: (token) => `hash:${token}`,
    now: () => new Date("2026-08-27T12:00:00.000Z"),
  });
  await service.persistAnonymousResult({
    completionKey: "completion-owner-collision",
    firstName: "Ada",
    email: "ada@example.com",
    answers: uniformAnswers("A"),
  });

  await assert.rejects(
    service.claimResult({
      reportAccessToken: "owner-collision-token",
      authenticatedUserId: "member-with-existing-result",
      authenticatedEmail: "ada@example.com",
    }),
    (error: unknown) => error instanceof DnaResultConflictError,
  );
});

test("concurrent identical completions create one result and recover safely", async () => {
  const repository = new ConcurrentInsertRepository();
  const ids = ["concurrent-result-1", "concurrent-result-2"];
  const tokens = [
    "concurrent-token-1",
    "concurrent-token-2",
    "concurrent-token-recovered",
  ];
  const service = createDnaResultService({
    repository,
    createId: () => ids.shift() ?? "unexpected-id",
    createReportAccessToken: () => tokens.shift() ?? "unexpected-token",
    hashReportAccessToken: (token) => `hash:${token}`,
    now: () => new Date("2026-08-27T12:00:00.000Z"),
  });
  const input = {
    completionKey: "completion-concurrent-identical",
    firstName: "Ada",
    email: "ada@example.com",
    answers: uniformAnswers("B"),
  };

  const results = await Promise.all([
    service.persistAnonymousResult(input),
    service.persistAnonymousResult(input),
  ]);

  assert.equal(repository.rows.size, 1);
  assert.equal(results[0].record.id, results[1].record.id);
  assert.deepEqual(
    results.map((result) => result.recovered).sort(),
    [false, true],
  );
  assert.equal(
    JSON.stringify(results[0].record.resultPayload),
    JSON.stringify(results[1].record.resultPayload),
  );
});

test("a concurrent conflicting completion cannot recover the winning result", async () => {
  const repository = new ConcurrentInsertRepository();
  const ids = ["conflicting-result-1", "conflicting-result-2"];
  const tokens = ["conflicting-token-1", "conflicting-token-2"];
  const service = createDnaResultService({
    repository,
    createId: () => ids.shift() ?? "unexpected-id",
    createReportAccessToken: () => tokens.shift() ?? "unexpected-token",
    hashReportAccessToken: (token) => `hash:${token}`,
    now: () => new Date("2026-08-27T12:00:00.000Z"),
  });
  const baseInput = {
    completionKey: "completion-concurrent-conflict",
    firstName: "Ada",
    email: "ada@example.com",
  };

  const results = await Promise.allSettled([
    service.persistAnonymousResult({
      ...baseInput,
      answers: uniformAnswers("B"),
    }),
    service.persistAnonymousResult({
      ...baseInput,
      answers: uniformAnswers("C"),
    }),
  ]);

  assert.equal(repository.rows.size, 1);
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    1,
  );
  const rejected = results.find((result) => result.status === "rejected");
  assert.ok(rejected && rejected.status === "rejected");
  assert.ok(rejected.reason instanceof DnaResultConflictError);
});

test("claiming during retry rotation cannot restore anonymous access", async () => {
  const repository = new PausedRotationRepository();
  const tokens = ["claim-race-original", "claim-race-retry"];
  const service = createDnaResultService({
    repository,
    createId: () => "claim-race-result",
    createReportAccessToken: () => tokens.shift() ?? "unexpected-token",
    hashReportAccessToken: (token) => `hash:${token}`,
    now: () => new Date("2026-08-27T12:00:00.000Z"),
  });
  const input = {
    completionKey: "completion-claim-race",
    firstName: "Ada",
    email: "ada@example.com",
    answers: uniformAnswers("D"),
  };
  await service.persistAnonymousResult(input);

  const retry = service.persistAnonymousResult(input);
  await repository.rotationStarted;
  const claimed = await service.claimResult({
    reportAccessToken: "claim-race-original",
    authenticatedUserId: "claim-race-member",
    authenticatedEmail: "ada@example.com",
  });
  repository.continueRotation();

  await assert.rejects(
    retry,
    (error: unknown) => error instanceof DnaResultConflictError,
  );
  assert.equal(claimed.ownerUserId, "claim-race-member");
  await assert.rejects(
    service.readAnonymousResult("claim-race-retry"),
    (error: unknown) => error instanceof DnaResultAccessError,
  );
});
