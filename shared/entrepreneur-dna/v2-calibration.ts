import {
  CALIBRATION_VERSION,
  CANONICAL_DNA_IDENTITIES,
  SCORING_VERSION,
  type CanonicalDnaIdentity,
  type EntrepreneurDnaQuestion,
} from "./types";
import { ENTREPRENEUR_DNA_V2_QUESTIONS } from "./v2-matrix";

const EXPECTED_QUESTION_COUNT = 25;
const OPTIONS_PER_QUESTION = 4;
const EXPECTED_MATRIX_FINGERPRINT = "98b90b965c2006ab";

export const TOTAL_OUTCOME_COUNT = 4n ** 25n;

export interface ExactCalibrationDistribution {
  readonly identity: CanonicalDnaIdentity;
  readonly scoringVersion: typeof SCORING_VERSION;
  readonly calibrationVersion: typeof CALIBRATION_VERSION;
  readonly matrixFingerprint: string;
  readonly counts: readonly bigint[];
  readonly totalOutcomeCount: bigint;
}

export type ExactCalibrationTables = Readonly<
  Record<CanonicalDnaIdentity, ExactCalibrationDistribution>
>;

export interface CalibrationGenerationInput {
  readonly questions?: readonly EntrepreneurDnaQuestion[];
  readonly scoringVersion?: string;
  readonly calibrationVersion?: string;
}

function normalizeMatrix(questions: readonly EntrepreneurDnaQuestion[]): string {
  return JSON.stringify(
    questions.map((question) => ({
      id: question.id,
      category: question.category,
      question: question.question,
      options: question.options.map((option) => ({
        value: option.value,
        title: option.title ?? null,
        label: option.label,
        weights: CANONICAL_DNA_IDENTITIES.map((identity) => [
          identity,
          option.weights[identity] ?? 0,
        ]),
      })),
      betaAnalysis: question.beta_analysis
        ? {
            possibleRedundancyWithQ13:
              question.beta_analysis.possible_redundancy_with_q13 ?? false,
          }
        : null,
    })),
  );
}

function fingerprintMatrix(
  questions: readonly EntrepreneurDnaQuestion[],
): string {
  const normalized = normalizeMatrix(questions);
  let hash = 14695981039346656037n;

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= BigInt(normalized.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 1099511628211n);
  }

  return hash.toString(16).padStart(16, "0");
}

function assertCalibrationIntegrity(
  questions: readonly EntrepreneurDnaQuestion[],
  scoringVersion: string,
  calibrationVersion: string,
): string {
  if (scoringVersion !== SCORING_VERSION) {
    throw new Error(
      `Calibration scoring version mismatch: expected ${SCORING_VERSION}, received ${scoringVersion}`,
    );
  }
  if (calibrationVersion !== CALIBRATION_VERSION) {
    throw new Error(
      `Calibration version mismatch: expected ${CALIBRATION_VERSION}, received ${calibrationVersion}`,
    );
  }
  if (questions.length !== EXPECTED_QUESTION_COUNT) {
    throw new Error(
      `Calibration matrix integrity mismatch: expected ${EXPECTED_QUESTION_COUNT} questions, received ${questions.length}`,
    );
  }
  if (questions.some((question) => question.options.length !== OPTIONS_PER_QUESTION)) {
    throw new Error(
      `Calibration matrix integrity mismatch: every question must have ${OPTIONS_PER_QUESTION} options`,
    );
  }

  const fingerprint = fingerprintMatrix(questions);
  if (fingerprint !== EXPECTED_MATRIX_FINGERPRINT) {
    throw new Error(
      `Calibration matrix integrity mismatch: expected ${EXPECTED_MATRIX_FINGERPRINT}, received ${fingerprint}`,
    );
  }

  return fingerprint;
}

function generateIdentityDistribution(
  identity: CanonicalDnaIdentity,
  questions: readonly EntrepreneurDnaQuestion[],
  matrixFingerprint: string,
): ExactCalibrationDistribution {
  let counts: bigint[] = [1n];

  for (const question of questions) {
    const maximumAddedWeight = Math.max(
      ...question.options.map((option) => option.weights[identity] ?? 0),
    );
    const next = Array<bigint>(counts.length + maximumAddedWeight).fill(0n);

    counts.forEach((count, score) => {
      if (count === 0n) {
        return;
      }
      for (const option of question.options) {
        const addedWeight = option.weights[identity] ?? 0;
        next[score + addedWeight] += count;
      }
    });

    counts = next;
  }

  const totalOutcomeCount = counts.reduce((sum, count) => sum + count, 0n);
  if (totalOutcomeCount !== TOTAL_OUTCOME_COUNT) {
    throw new Error(
      `Calibration distribution integrity mismatch for ${identity}: expected ${TOTAL_OUTCOME_COUNT}, received ${totalOutcomeCount}`,
    );
  }

  return Object.freeze({
    identity,
    scoringVersion: SCORING_VERSION,
    calibrationVersion: CALIBRATION_VERSION,
    matrixFingerprint,
    counts: Object.freeze(counts),
    totalOutcomeCount,
  });
}

export function generateExactCalibrationTables(
  input: CalibrationGenerationInput = {},
): ExactCalibrationTables {
  const questions = input.questions ?? ENTREPRENEUR_DNA_V2_QUESTIONS;
  const scoringVersion = input.scoringVersion ?? SCORING_VERSION;
  const calibrationVersion = input.calibrationVersion ?? CALIBRATION_VERSION;
  const matrixFingerprint = assertCalibrationIntegrity(
    questions,
    scoringVersion,
    calibrationVersion,
  );

  return Object.freeze({
    [CANONICAL_DNA_IDENTITIES[0]]: generateIdentityDistribution(
      CANONICAL_DNA_IDENTITIES[0],
      questions,
      matrixFingerprint,
    ),
    [CANONICAL_DNA_IDENTITIES[1]]: generateIdentityDistribution(
      CANONICAL_DNA_IDENTITIES[1],
      questions,
      matrixFingerprint,
    ),
    [CANONICAL_DNA_IDENTITIES[2]]: generateIdentityDistribution(
      CANONICAL_DNA_IDENTITIES[2],
      questions,
      matrixFingerprint,
    ),
    [CANONICAL_DNA_IDENTITIES[3]]: generateIdentityDistribution(
      CANONICAL_DNA_IDENTITIES[3],
      questions,
      matrixFingerprint,
    ),
    [CANONICAL_DNA_IDENTITIES[4]]: generateIdentityDistribution(
      CANONICAL_DNA_IDENTITIES[4],
      questions,
      matrixFingerprint,
    ),
    [CANONICAL_DNA_IDENTITIES[5]]: generateIdentityDistribution(
      CANONICAL_DNA_IDENTITIES[5],
      questions,
      matrixFingerprint,
    ),
    [CANONICAL_DNA_IDENTITIES[6]]: generateIdentityDistribution(
      CANONICAL_DNA_IDENTITIES[6],
      questions,
      matrixFingerprint,
    ),
    [CANONICAL_DNA_IDENTITIES[7]]: generateIdentityDistribution(
      CANONICAL_DNA_IDENTITIES[7],
      questions,
      matrixFingerprint,
    ),
  });
}

export function calculateCalibratedScore(
  distribution: ExactCalibrationDistribution,
  observedScore: number,
): number {
  if (!Number.isInteger(observedScore)) {
    throw new Error(`Observed raw score must be an integer: received ${observedScore}`);
  }
  if (observedScore < 0 || observedScore >= distribution.counts.length) {
    throw new Error(
      `Observed raw score ${observedScore} is outside the supported range 0-${distribution.counts.length - 1}`,
    );
  }

  let lowerCount = 0n;
  for (let score = 0; score < observedScore; score += 1) {
    lowerCount += distribution.counts[score];
  }
  const equalCount = distribution.counts[observedScore];

  return (
    (100 * (Number(lowerCount) + 0.5 * Number(equalCount))) /
    Number(distribution.totalOutcomeCount)
  );
}

export const CALIBRATION_TABLES = generateExactCalibrationTables();
