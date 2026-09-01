import {
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import { z } from "zod";

import {
  ASSESSMENT_VERSION,
  CALIBRATION_VERSION,
  SCORING_VERSION,
  type CanonicalDnaIdentity,
} from "../shared/entrepreneur-dna/types";
import {
  scoreEntrepreneurDnaV2,
  type EntrepreneurDnaResponse,
  type IdentityScoreRecord,
  type ProfileClassification,
} from "../shared/entrepreneur-dna/v2-scoring";

const REPORT_ACCESS_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000;

const persistAnonymousResultSchema = z.object({
  completionKey: z.string().trim().min(8).max(128),
  firstName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(320),
  answers: z.unknown(),
  clientResult: z.unknown().optional(),
});

export interface CanonicalDnaV2ResultPayload {
  readonly answers: readonly EntrepreneurDnaResponse[];
  readonly raw_scores: IdentityScoreRecord;
  readonly calibrated_scores: IdentityScoreRecord;
  readonly primary_dna: CanonicalDnaIdentity;
  readonly secondary_dna: CanonicalDnaIdentity | null;
  readonly profile_classification: ProfileClassification;
  readonly primary_stability: number;
  readonly primary_stability_count: number;
  readonly assessment_version: typeof ASSESSMENT_VERSION;
  readonly scoring_version: typeof SCORING_VERSION;
  readonly calibration_version: typeof CALIBRATION_VERSION;
}

export interface StoredDnaResult {
  readonly id: string;
  readonly completionKey: string;
  readonly firstName: string;
  readonly email: string;
  readonly emailNormalized: string;
  readonly assessmentVersion: typeof ASSESSMENT_VERSION;
  readonly scoringVersion: typeof SCORING_VERSION;
  readonly calibrationVersion: typeof CALIBRATION_VERSION;
  readonly primaryDna: CanonicalDnaIdentity;
  readonly secondaryDna: CanonicalDnaIdentity | null;
  readonly profileClassification: ProfileClassification;
  readonly answers: readonly EntrepreneurDnaResponse[];
  readonly resultPayload: CanonicalDnaV2ResultPayload;
  readonly reportAccessTokenHash: string;
  readonly reportAccessExpiresAt: string;
  readonly reportAccessRevokedAt: string | null;
  readonly ownerUserId: string | null;
  readonly claimedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface DnaResultRepository {
  findByCompletionKey(completionKey: string): Promise<StoredDnaResult | null>;
  insert(record: StoredDnaResult): Promise<StoredDnaResult>;
  findByReportTokenHash(
    reportTokenHash: string,
  ): Promise<StoredDnaResult | null>;
  findByOwnerUserId(ownerUserId: string): Promise<StoredDnaResult | null>;
  rotateReportAccess(
    resultId: string,
    reportAccessTokenHash: string,
    reportAccessExpiresAt: string,
    updatedAt: string,
  ): Promise<StoredDnaResult | null>;
  claimIfUnowned(
    resultId: string,
    ownerUserId: string,
    claimedAt: string,
    reportAccessRevokedAt: string,
  ): Promise<StoredDnaResult | null>;
}

export class DnaResultConflictError extends Error {
  readonly statusCode = 409;

  constructor(message: string) {
    super(message);
    this.name = "DnaResultConflictError";
  }
}

export class DnaResultAccessError extends Error {
  readonly statusCode = 404;

  constructor(message = "DNA result not found") {
    super(message);
    this.name = "DnaResultAccessError";
  }
}

export class DnaResultValidationError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = "DnaResultValidationError";
  }
}

interface DnaResultServiceDependencies {
  readonly repository: DnaResultRepository;
  readonly createId?: () => string;
  readonly createReportAccessToken?: () => string;
  readonly hashReportAccessToken?: (token: string) => string;
  readonly now?: () => Date;
}

export interface PersistAnonymousResultInput {
  readonly completionKey: string;
  readonly firstName: string;
  readonly email: string;
  readonly answers: unknown;
  readonly clientResult?: unknown;
}

export interface ClaimResultInput {
  readonly reportAccessToken: string;
  readonly authenticatedUserId: string;
  readonly authenticatedEmail: string | null;
}

function defaultCreateReportAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashReportAccessToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createCanonicalResultPayload(
  answers: unknown,
): CanonicalDnaV2ResultPayload {
  const scoring = scoreEntrepreneurDnaV2(answers);
  const canonicalAnswers = Object.freeze(
    [...(answers as readonly EntrepreneurDnaResponse[])]
      .sort((left, right) => left.questionId - right.questionId)
      .map((answer) =>
        Object.freeze({
          questionId: answer.questionId,
          value: answer.value,
        }),
      ),
  );

  return Object.freeze({
    answers: canonicalAnswers,
    raw_scores: scoring.rawScores,
    calibrated_scores: scoring.calibratedScores,
    primary_dna: scoring.primaryIdentity,
    secondary_dna: scoring.secondaryDna,
    profile_classification: scoring.profileClassification,
    primary_stability: scoring.primaryStability,
    primary_stability_count: scoring.primaryStabilityCount,
    assessment_version: ASSESSMENT_VERSION,
    scoring_version: SCORING_VERSION,
    calibration_version: CALIBRATION_VERSION,
  });
}

function isSameJsonValue(left: unknown, right: unknown): boolean {
  return isDeepStrictEqual(left, right);
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function isIdenticalRetry(
  existing: StoredDnaResult,
  firstName: string,
  emailNormalized: string,
  resultPayload: CanonicalDnaV2ResultPayload,
): boolean {
  return (
    existing.firstName === firstName &&
    existing.emailNormalized === emailNormalized &&
    existing.assessmentVersion === ASSESSMENT_VERSION &&
    existing.scoringVersion === SCORING_VERSION &&
    existing.calibrationVersion === CALIBRATION_VERSION &&
    isSameJsonValue(existing.answers, resultPayload.answers) &&
    isSameJsonValue(existing.resultPayload, resultPayload)
  );
}

function ensureReportAccessIsValid(
  record: StoredDnaResult | null,
  now: Date,
): StoredDnaResult {
  if (
    !record ||
    record.reportAccessRevokedAt !== null ||
    Date.parse(record.reportAccessExpiresAt) <= now.getTime()
  ) {
    throw new DnaResultAccessError();
  }
  return record;
}

export function createDnaResultService(
  dependencies: DnaResultServiceDependencies,
) {
  const createId = dependencies.createId ?? randomUUID;
  const createReportAccessToken =
    dependencies.createReportAccessToken ?? defaultCreateReportAccessToken;
  const hashToken =
    dependencies.hashReportAccessToken ?? hashReportAccessToken;
  const now = dependencies.now ?? (() => new Date());

  return {
    async persistAnonymousResult(input: PersistAnonymousResultInput) {
      const parsed = persistAnonymousResultSchema.safeParse(input);
      if (!parsed.success) {
        throw new DnaResultValidationError(
          parsed.error.issues[0]?.message ?? "Invalid DNA result submission",
        );
      }

      let resultPayload: CanonicalDnaV2ResultPayload;
      try {
        resultPayload = createCanonicalResultPayload(parsed.data.answers);
      } catch (error) {
        throw new DnaResultValidationError(
          error instanceof Error ? error.message : "Invalid DNA answers",
        );
      }

      if (
        parsed.data.clientResult !== undefined &&
        !isSameJsonValue(parsed.data.clientResult, resultPayload)
      ) {
        throw new DnaResultValidationError(
          "Client DNA result does not match the canonical server result",
        );
      }

      const recoverExistingResult = async (existing: StoredDnaResult) => {
        if (existing.ownerUserId !== null || existing.claimedAt !== null) {
          throw new DnaResultConflictError(
            "This Entrepreneur DNA completion is no longer available for anonymous recovery",
          );
        }
        if (
          !isIdenticalRetry(
            existing,
            parsed.data.firstName,
            normalizeEmail(parsed.data.email),
            resultPayload,
          )
        ) {
          throw new DnaResultConflictError(
            "This Entrepreneur DNA completion cannot be recovered from that submission",
          );
        }

        const retriedAt = now();
        const reportAccessToken = createReportAccessToken();
        const reportAccessExpiresAt = new Date(
          retriedAt.getTime() + REPORT_ACCESS_LIFETIME_MS,
        ).toISOString();
        const rotated = await dependencies.repository.rotateReportAccess(
          existing.id,
          hashToken(reportAccessToken),
          reportAccessExpiresAt,
          retriedAt.toISOString(),
        );
        if (!rotated) {
          throw new DnaResultConflictError(
            "This Entrepreneur DNA completion could not be recovered",
          );
        }
        return Object.freeze({
          record: rotated,
          reportAccessToken,
          recovered: true,
        });
      };

      const existing = await dependencies.repository.findByCompletionKey(
        parsed.data.completionKey,
      );
      if (existing) {
        return recoverExistingResult(existing);
      }

      const createdAt = now();
      const reportAccessToken = createReportAccessToken();
      const reportAccessExpiresAt = new Date(
        createdAt.getTime() + REPORT_ACCESS_LIFETIME_MS,
      );

      const record: StoredDnaResult = Object.freeze({
        id: createId(),
        completionKey: parsed.data.completionKey,
        firstName: parsed.data.firstName,
        email: parsed.data.email,
        emailNormalized: normalizeEmail(parsed.data.email),
        assessmentVersion: ASSESSMENT_VERSION,
        scoringVersion: SCORING_VERSION,
        calibrationVersion: CALIBRATION_VERSION,
        primaryDna: resultPayload.primary_dna,
        secondaryDna: resultPayload.secondary_dna,
        profileClassification: resultPayload.profile_classification,
        answers: resultPayload.answers,
        resultPayload,
        reportAccessTokenHash: hashToken(reportAccessToken),
        reportAccessExpiresAt: reportAccessExpiresAt.toISOString(),
        reportAccessRevokedAt: null,
        ownerUserId: null,
        claimedAt: null,
        createdAt: createdAt.toISOString(),
        updatedAt: createdAt.toISOString(),
      });

      let inserted: StoredDnaResult;
      try {
        inserted = await dependencies.repository.insert(record);
      } catch (error) {
        if (!isUniqueConstraintViolation(error)) {
          throw error;
        }
        const concurrentWinner =
          await dependencies.repository.findByCompletionKey(
            parsed.data.completionKey,
          );
        if (!concurrentWinner) {
          throw new DnaResultConflictError(
            "This Entrepreneur DNA completion could not be recovered",
          );
        }
        return recoverExistingResult(concurrentWinner);
      }
      return Object.freeze({
        record: inserted,
        reportAccessToken,
        recovered: false,
      });
    },

    async readAnonymousResult(reportAccessToken: string) {
      const record = await dependencies.repository.findByReportTokenHash(
        hashToken(reportAccessToken),
      );
      return ensureReportAccessIsValid(record, now());
    },

    async readMemberResult(authenticatedUserId: string) {
      const record = await dependencies.repository.findByOwnerUserId(
        authenticatedUserId,
      );
      if (!record) {
        throw new DnaResultAccessError();
      }
      return record;
    },

    async claimResult(input: ClaimResultInput) {
      const record = await dependencies.repository.findByReportTokenHash(
        hashToken(input.reportAccessToken),
      );
      if (!record) {
        throw new DnaResultAccessError();
      }

      if (
        !input.authenticatedEmail ||
        normalizeEmail(input.authenticatedEmail) !== record.emailNormalized
      ) {
        throw new DnaResultConflictError(
          "The authenticated account email does not match the DNA result email",
        );
      }

      if (record.ownerUserId !== null) {
        if (record.ownerUserId === input.authenticatedUserId) {
          return record;
        }
        throw new DnaResultConflictError(
          "This Entrepreneur DNA result is already owned by another account",
        );
      }

      ensureReportAccessIsValid(record, now());

      const existingOwnedResult =
        await dependencies.repository.findByOwnerUserId(
          input.authenticatedUserId,
        );
      if (existingOwnedResult && existingOwnedResult.id !== record.id) {
        throw new DnaResultConflictError(
          "This account already owns a different Entrepreneur DNA result",
        );
      }

      const claimedAt = now().toISOString();
      let claimed: StoredDnaResult | null;
      try {
        claimed = await dependencies.repository.claimIfUnowned(
          record.id,
          input.authenticatedUserId,
          claimedAt,
          claimedAt,
        );
      } catch (error) {
        if (isUniqueConstraintViolation(error)) {
          throw new DnaResultConflictError(
            "This account already owns a different Entrepreneur DNA result",
          );
        }
        throw error;
      }
      if (!claimed) {
        throw new DnaResultConflictError(
          "This Entrepreneur DNA result is already owned by another account",
        );
      }
      return claimed;
    },
  };
}

export type DnaResultService = ReturnType<typeof createDnaResultService>;
